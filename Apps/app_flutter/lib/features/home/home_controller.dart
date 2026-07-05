import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/services/local_db.dart';
import '../../shared/data/attendance_repository.dart';
import '../../shared/models/attendance_record.dart';
import '../../shared/models/enums.dart';
import '../../shared/models/shift.dart';

/// Aggregated state for the Home dashboard.
class HomeData {
  const HomeData({required this.today, required this.shift});
  final TodayAttendance today;
  final Shift? shift;
}

final homeDataProvider = FutureProvider.autoDispose<HomeData>((ref) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  final today = await repo.getToday();
  final shift = await repo.getTodayShift();
  final mergedToday = await _mergePendingToday(today, shift);
  return HomeData(today: mergedToday, shift: shift);
});

Future<TodayAttendance> _mergePendingToday(
  TodayAttendance remote,
  Shift? shift,
) async {
  List<PendingCheckin> pending;
  try {
    pending = await LocalDb.instance.getPending();
  } catch (_) {
    return remote;
  }

  final today = DateTime.now();
  final todaysPending = pending.where((row) => _sameLocalDay(row.capturedAt, today));
  AttendanceRecord? checkIn = remote.checkIn;
  AttendanceRecord? checkOut = remote.checkOut;

  for (final row in todaysPending) {
    final submission = AttendanceSubmission.fromJson(row.payload);
    if (row.type == 'checkin' && checkIn == null) {
      checkIn = _pendingRecord(
        row: row,
        submission: submission,
        shift: shift,
        checkInAt: row.capturedAt,
      );
    }
  }

  for (final row in todaysPending) {
    final submission = AttendanceSubmission.fromJson(row.payload);
    if (row.type == 'checkout' && checkOut == null) {
      final base = checkIn ?? remote.checkIn;
      checkOut = _pendingRecord(
        row: row,
        submission: submission,
        shift: shift,
        checkInAt: base?.checkInAt ?? row.capturedAt,
        checkOutAt: row.capturedAt,
        base: base,
      );
      checkIn ??= checkOut;
    }
  }

  return TodayAttendance(checkIn: checkIn, checkOut: checkOut);
}

bool _sameLocalDay(DateTime a, DateTime b) {
  final localA = a.toLocal();
  final localB = b.toLocal();
  return localA.year == localB.year &&
      localA.month == localB.month &&
      localA.day == localB.day;
}

AttendanceRecord _pendingRecord({
  required PendingCheckin row,
  required AttendanceSubmission submission,
  required Shift? shift,
  DateTime? checkInAt,
  DateTime? checkOutAt,
  AttendanceRecord? base,
}) {
  final captured = row.capturedAt.toLocal();
  final date = DateTime(captured.year, captured.month, captured.day);
  return AttendanceRecord(
    id: 'pending-${row.id}',
    date: base?.date ?? date,
    status: base?.status ?? AttendanceStatus.present,
    workMode: base?.workMode ?? submission.workMode,
    shiftName: base?.shiftName ?? shift?.name ?? 'Tersimpan Offline',
    checkInAt: base?.checkInAt ?? checkInAt,
    checkOutAt: checkOutAt ?? base?.checkOutAt,
    checkInLat: base?.checkInLat ?? submission.latitude,
    checkInLng: base?.checkInLng ?? submission.longitude,
    checkOutLat: checkOutAt != null ? submission.latitude : base?.checkOutLat,
    checkOutLng: checkOutAt != null ? submission.longitude : base?.checkOutLng,
    locationName:
        base?.locationName ?? (submission.workMode == WorkMode.wfh ? 'Lokasi WFH' : null),
    faceStatus: VerificationStatus.passed,
    geofenceValid: base?.geofenceValid ?? (submission.workMode == WorkMode.wfh),
    syncStatus: SyncStatus.pending,
  );
}
