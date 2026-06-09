import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
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
    this.mockLocationDetected = false,
  });

  final CheckFlowKind kind;
  final WorkMode workMode;
  final bool gpsReady;
  final bool locationVerified;
  final bool faceVerified;
  final bool livenessPassed;
  final double? latitude;
  final double? longitude;
  final bool mockLocationDetected;

  CheckinFlowState copyWith({
    CheckFlowKind? kind,
    WorkMode? workMode,
    bool? gpsReady,
    bool? locationVerified,
    bool? faceVerified,
    bool? livenessPassed,
    double? latitude,
    double? longitude,
    bool? mockLocationDetected,
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
      mockLocationDetected: mockLocationDetected ?? this.mockLocationDetected,
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
    bool mockDetected = false,
  }) {
    state = state.copyWith(
      latitude: lat,
      longitude: lng,
      locationVerified: verified,
      gpsReady: true,
      mockLocationDetected: mockDetected,
    );
  }

  void setFaceResult({required bool faceVerified, required bool liveness}) {
    state = state.copyWith(faceVerified: faceVerified, livenessPassed: liveness);
  }

  /// Submits the verified attendance to the repository.
  Future<AttendanceRecord> submit() async {
    final repo = _ref.read(attendanceRepositoryProvider);
    final submission = AttendanceSubmission(
      workMode: state.workMode,
      latitude: state.latitude ?? 0,
      longitude: state.longitude ?? 0,
      faceVerified: state.faceVerified,
      livenessPassed: state.livenessPassed,
    );
    return state.kind == CheckFlowKind.checkIn
        ? repo.checkIn(submission)
        : repo.checkOut(submission);
  }
}

final checkinFlowProvider =
    StateNotifierProvider<CheckinFlowController, CheckinFlowState>((ref) {
  return CheckinFlowController(ref);
});
