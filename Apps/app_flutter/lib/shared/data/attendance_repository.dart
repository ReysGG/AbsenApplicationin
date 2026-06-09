import '../models/attendance_record.dart';
import '../models/enums.dart';
import '../models/shift.dart';
import '../models/work_location.dart';
import 'mock_data.dart';

/// Input payload for a check-in / check-out submission.
class AttendanceSubmission {
  const AttendanceSubmission({
    required this.workMode,
    required this.latitude,
    required this.longitude,
    required this.faceVerified,
    required this.livenessPassed,
    this.locationId,
    this.capturedAt,
  });

  final WorkMode workMode;
  final double latitude;
  final double longitude;
  final bool faceVerified;
  final bool livenessPassed;
  final String? locationId;
  final DateTime? capturedAt;
}

/// Today's attendance state for the home screen.
class TodayAttendance {
  const TodayAttendance({this.checkIn, this.checkOut});
  final AttendanceRecord? checkIn;
  final AttendanceRecord? checkOut;

  bool get hasCheckedIn => checkIn != null;
  bool get hasCheckedOut => checkOut != null;
}

abstract interface class AttendanceRepository {
  Future<TodayAttendance> getToday();
  Future<List<AttendanceRecord>> getHistory();
  Future<AttendanceRecord> getDetail(String id);
  Future<List<WorkLocation>> getAssignedLocations();
  Future<Shift?> getTodayShift();

  /// Submits a check-in. Returns the created record.
  Future<AttendanceRecord> checkIn(AttendanceSubmission submission);

  /// Submits a check-out for the open record.
  Future<AttendanceRecord> checkOut(AttendanceSubmission submission);
}

class MockAttendanceRepository implements AttendanceRepository {
  final List<AttendanceRecord> _history = [...MockData.attendanceHistory()];
  AttendanceRecord? _todayCheckIn;
  AttendanceRecord? _todayCheckOut;

  @override
  Future<TodayAttendance> getToday() async {
    await _delay();
    return TodayAttendance(checkIn: _todayCheckIn, checkOut: _todayCheckOut);
  }

  @override
  Future<List<AttendanceRecord>> getHistory() async {
    await _delay();
    final all = [
      ?_todayCheckIn,
      ..._history,
    ];
    all.sort((a, b) => b.date.compareTo(a.date));
    return all;
  }

  @override
  Future<AttendanceRecord> getDetail(String id) async {
    await _delay();
    return [?_todayCheckIn, ..._history]
        .firstWhere((r) => r.id == id, orElse: () => _history.first);
  }

  @override
  Future<List<WorkLocation>> getAssignedLocations() async {
    await _delay();
    return MockData.locations;
  }

  @override
  Future<Shift?> getTodayShift() async {
    await _delay();
    return MockData.todayShift;
  }

  @override
  Future<AttendanceRecord> checkIn(AttendanceSubmission s) async {
    await _delay();
    final now = s.capturedAt ?? DateTime.now();
    final shift = MockData.todayShift;
    final lateThreshold = DateTime(now.year, now.month, now.day,
            shift.startTime.hour, shift.startTime.minute)
        .add(Duration(minutes: shift.gracePeriodMinutes));
    final record = AttendanceRecord(
      id: 'att-today',
      date: DateTime(now.year, now.month, now.day),
      status: now.isAfter(lateThreshold)
          ? AttendanceStatus.late
          : AttendanceStatus.present,
      workMode: s.workMode,
      shiftName: shift.name,
      checkInAt: now,
      checkInLat: s.latitude,
      checkInLng: s.longitude,
      locationName: s.workMode == WorkMode.wfo
          ? MockData.officeJakarta.name
          : 'Lokasi WFH',
      faceStatus: VerificationStatus.passed,
      geofenceValid: true,
    );
    _todayCheckIn = record;
    return record;
  }

  @override
  Future<AttendanceRecord> checkOut(AttendanceSubmission s) async {
    await _delay();
    final now = s.capturedAt ?? DateTime.now();
    final base = _todayCheckIn;
    final record = AttendanceRecord(
      id: 'att-today',
      date: base?.date ?? DateTime(now.year, now.month, now.day),
      status: base?.status ?? AttendanceStatus.present,
      workMode: s.workMode,
      shiftName: base?.shiftName ?? MockData.todayShift.name,
      checkInAt: base?.checkInAt,
      checkOutAt: now,
      checkInLat: base?.checkInLat,
      checkInLng: base?.checkInLng,
      checkOutLat: s.latitude,
      checkOutLng: s.longitude,
      locationName: base?.locationName,
      faceStatus: VerificationStatus.passed,
      geofenceValid: true,
    );
    _todayCheckIn = record;
    _todayCheckOut = record;
    return record;
  }

  Future<void> _delay() =>
      Future<void>.delayed(const Duration(milliseconds: 500));
}
