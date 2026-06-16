import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/services/local_db.dart';
import '../../shared/data/attendance_repository.dart';
import '../../shared/models/attendance_record.dart';
import '../../shared/models/enums.dart';

/// Whether the active flow is a check-in or a check-out.
enum CheckFlowKind { checkIn, checkOut }

/// Mutable state shared across the multi-step check-in/out flow
/// (prep → location → face → submit).
class CheckinFlowState {
  CheckinFlowState({
    this.kind = CheckFlowKind.checkIn,
    this.workMode = WorkMode.wfo,
    this.gpsReady = false,
    this.locationVerified = false,
    this.faceVerified = false,
    this.livenessPassed = false,
    this.latitude,
    this.longitude,
    this.locationId,
    this.mockLocationDetected = false,
    this.savedOffline = false,
    this.livenessChecksPassed = 0,
    this.livenessChecksTotal = 0,
    this.faceImageBase64,
  });

  final CheckFlowKind kind;
  final WorkMode workMode;
  final bool gpsReady;
  final bool locationVerified;
  final bool faceVerified;
  final bool livenessPassed;
  final double? latitude;
  final double? longitude;
  final String? locationId;
  final bool mockLocationDetected;

  /// Liveness challenge counts captured on-device, forwarded to the server
  /// which is the authority on the face/liveness verdict.
  final int livenessChecksPassed;
  final int livenessChecksTotal;

  /// Base64 JPEG of the verified face capture, forwarded to the server.
  final String? faceImageBase64;

  /// True when the last submit was queued locally because the device was
  /// offline (or the network call failed).
  final bool savedOffline;

  CheckinFlowState copyWith({
    CheckFlowKind? kind,
    WorkMode? workMode,
    bool? gpsReady,
    bool? locationVerified,
    bool? faceVerified,
    bool? livenessPassed,
    double? latitude,
    double? longitude,
    String? locationId,
    bool? mockLocationDetected,
    bool? savedOffline,
    int? livenessChecksPassed,
    int? livenessChecksTotal,
    String? faceImageBase64,
  }) {
    return CheckinFlowState(
      kind: kind ?? this.kind,
      workMode: workMode ?? this.workMode,
      gpsReady: gpsReady ?? this.gpsReady,
      locationVerified: locationVerified ?? this.locationVerified,
      faceVerified: faceVerified ?? this.faceVerified,
      livenessPassed: livenessPassed ?? this.livenessPassed,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      locationId: locationId ?? this.locationId,
      mockLocationDetected: mockLocationDetected ?? this.mockLocationDetected,
      savedOffline: savedOffline ?? this.savedOffline,
      livenessChecksPassed: livenessChecksPassed ?? this.livenessChecksPassed,
      livenessChecksTotal: livenessChecksTotal ?? this.livenessChecksTotal,
      faceImageBase64: faceImageBase64 ?? this.faceImageBase64,
    );
  }

  /// WFH disables the GPS geofence requirement (PDF 5.1) but face stays on.
  bool get requiresGps => workMode == WorkMode.wfo;

  bool get readyToSubmit =>
      (locationVerified || !requiresGps) && faceVerified && livenessPassed;
}

class CheckinFlowController extends StateNotifier<CheckinFlowState> {
  CheckinFlowController(this._ref) : super(CheckinFlowState());

  final Ref _ref;

  void start(CheckFlowKind kind) {
    state = CheckinFlowState(kind: kind);
  }

  void setWorkMode(WorkMode mode) => state = state.copyWith(workMode: mode);

  void setGpsReady(bool ready) => state = state.copyWith(gpsReady: ready);

  void setLocation({
    required double lat,
    required double lng,
    required bool verified,
    String? locationId,
    bool mockDetected = false,
  }) {
    state = state.copyWith(
      latitude: lat,
      longitude: lng,
      locationVerified: verified,
      locationId: locationId,
      gpsReady: true,
      mockLocationDetected: mockDetected,
    );
  }

  void setFaceResult({
    required bool faceVerified,
    required bool liveness,
    int? checksPassed,
    int? checksTotal,
    String? faceImageBase64,
  }) {
    state = state.copyWith(
      faceVerified: faceVerified,
      livenessPassed: liveness,
      livenessChecksPassed: checksPassed,
      livenessChecksTotal: checksTotal,
      faceImageBase64: faceImageBase64,
    );
  }

  /// Submits the verified attendance.
  ///
  /// When the device has no connectivity (or the network call throws a network
  /// error) the submission is queued in the local SQLite DB and a synthetic
  /// "saved offline" record is returned with `savedOffline` set on the state.
  Future<AttendanceRecord> submit() async {
    final repo = _ref.read(attendanceRepositoryProvider);
    final now = DateTime.now();
    final submission = AttendanceSubmission(
      workMode: state.workMode,
      latitude: state.latitude ?? 0,
      longitude: state.longitude ?? 0,
      faceVerified: state.faceVerified,
      livenessPassed: state.livenessPassed,
      locationId: state.locationId,
      isMocked: state.mockLocationDetected,
      capturedAt: now,
      livenessChecksPassed: state.livenessChecksPassed,
      livenessChecksTotal: state.livenessChecksTotal,
      faceImageBase64: state.faceImageBase64,
    );

    final type =
        state.kind == CheckFlowKind.checkIn ? 'checkin' : 'checkout';

    // If we already know we're offline, queue immediately without a round-trip.
    final online = await _ref.read(syncServiceProvider).isOnline();
    if (!online) {
      return _queueOffline(submission, type, now);
    }

    try {
      return state.kind == CheckFlowKind.checkIn
          ? await repo.checkIn(submission)
          : await repo.checkOut(submission);
    } catch (e) {
      // Network failures → queue offline so the user isn't blocked.
      if (_isNetworkError(e)) {
        return _queueOffline(submission, type, now);
      }
      rethrow;
    }
  }

  Future<AttendanceRecord> _queueOffline(
      AttendanceSubmission submission, String type, DateTime capturedAt) async {
    await LocalDb.instance.insert(submission.toJson(), type, capturedAt);
    state = state.copyWith(savedOffline: true);
    // Synthetic record so the success screen has something to show.
    return AttendanceRecord(
      id: 'offline-${capturedAt.millisecondsSinceEpoch}',
      date: DateTime(capturedAt.year, capturedAt.month, capturedAt.day),
      status: AttendanceStatus.present,
      workMode: submission.workMode,
      shiftName: 'Tersimpan Offline',
      checkInAt: state.kind == CheckFlowKind.checkIn ? capturedAt : null,
      checkOutAt: state.kind == CheckFlowKind.checkOut ? capturedAt : null,
      checkInLat: submission.latitude,
      checkInLng: submission.longitude,
      faceStatus: VerificationStatus.passed,
      geofenceValid: state.locationVerified,
      syncStatus: SyncStatus.pending,
    );
  }

  bool _isNetworkError(Object e) {
    final s = e.toString().toLowerCase();
    return s.contains('koneksi') ||
        s.contains('network') ||
        s.contains('timeout') ||
        s.contains('socket') ||
        s.contains('connection');
  }
}

final checkinFlowProvider =
    StateNotifierProvider<CheckinFlowController, CheckinFlowState>((ref) {
  return CheckinFlowController(ref);
});
