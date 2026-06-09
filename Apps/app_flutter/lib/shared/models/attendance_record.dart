import 'package:equatable/equatable.dart';

import 'enums.dart';

/// A single attendance log entry (one work day) for the current employee.
class AttendanceRecord extends Equatable {
  const AttendanceRecord({
    required this.id,
    required this.date,
    required this.status,
    required this.workMode,
    required this.shiftName,
    this.checkInAt,
    this.checkOutAt,
    this.checkInLat,
    this.checkInLng,
    this.checkOutLat,
    this.checkOutLng,
    this.locationName,
    this.faceStatus = VerificationStatus.notRequired,
    this.geofenceValid = true,
    this.syncStatus = SyncStatus.synced,
  });

  final String id;
  final DateTime date;
  final AttendanceStatus status;
  final WorkMode workMode;
  final String shiftName;
  final DateTime? checkInAt;
  final DateTime? checkOutAt;
  final double? checkInLat;
  final double? checkInLng;
  final double? checkOutLat;
  final double? checkOutLng;
  final String? locationName;
  final VerificationStatus faceStatus;
  final bool geofenceValid;
  final SyncStatus syncStatus;

  /// Worked duration between check-in and check-out, if both present.
  Duration? get workedDuration {
    if (checkInAt == null || checkOutAt == null) return null;
    return checkOutAt!.difference(checkInAt!);
  }

  @override
  List<Object?> get props => [id, date];
}
