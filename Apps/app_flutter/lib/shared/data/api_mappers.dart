import 'package:flutter/material.dart';

import '../models/app_notification.dart';
import '../models/attendance_record.dart';
import '../models/enums.dart';
import '../models/leave_request.dart';
import '../models/shift.dart';
import '../models/work_location.dart';

/// Pure functions mapping backend mobile-API JSON (see
/// Apps/backend/src/modules/mobile/mobile.service.ts DTOs) into app models.
/// Kept separate from repositories so the contract lives in one place.
abstract final class ApiMappers {
  static AttendanceStatus attendanceStatus(String? v) => switch (v) {
        'present' => AttendanceStatus.present,
        'late' => AttendanceStatus.late,
        'absent' => AttendanceStatus.absent,
        'pendingCheckout' => AttendanceStatus.pendingCheckout,
        'missingCheckout' => AttendanceStatus.missingCheckout,
        'leave' => AttendanceStatus.leave,
        _ => AttendanceStatus.invalid,
      };

  static WorkMode workMode(String? v) =>
      v == 'wfh' ? WorkMode.wfh : WorkMode.wfo;

  static VerificationStatus faceStatus(String? v) => switch (v) {
        'passed' => VerificationStatus.passed,
        'failed' => VerificationStatus.failed,
        'pending' => VerificationStatus.pending,
        _ => VerificationStatus.notRequired,
      };

  static SyncStatus syncStatus(String? v) => switch (v) {
        'pending' => SyncStatus.pending,
        'syncing' => SyncStatus.syncing,
        'failed' => SyncStatus.failed,
        _ => SyncStatus.synced,
      };

  static DateTime _date(String v) => DateTime.parse(v);
  static DateTime? _dateOrNull(String? v) =>
      (v == null || v.isEmpty) ? null : DateTime.parse(v);
  static double? _toDouble(dynamic v) =>
      v == null ? null : (v as num).toDouble();

  static AttendanceRecord attendance(Map<String, dynamic> j) {
    return AttendanceRecord(
      id: j['id'] as String,
      date: _date(j['date'] as String),
      status: attendanceStatus(j['status'] as String?),
      workMode: workMode(j['workMode'] as String?),
      shiftName: j['shiftName'] as String? ?? 'Tanpa Shift',
      checkInAt: _dateOrNull(j['checkInAt'] as String?),
      checkOutAt: _dateOrNull(j['checkOutAt'] as String?),
      checkInLat: _toDouble(j['checkInLat']),
      checkInLng: _toDouble(j['checkInLng']),
      checkOutLat: _toDouble(j['checkOutLat']),
      checkOutLng: _toDouble(j['checkOutLng']),
      locationName: j['locationName'] as String?,
      faceStatus: faceStatus(j['faceStatus'] as String?),
      geofenceValid: j['geofenceValid'] as bool? ?? true,
      syncStatus: syncStatus(j['syncStatus'] as String?),
    );
  }

  static WorkLocation location(Map<String, dynamic> j) {
    return WorkLocation(
      id: j['id'] as String,
      name: j['name'] as String,
      latitude: (j['latitude'] as num).toDouble(),
      longitude: (j['longitude'] as num).toDouble(),
      radiusMeters: (j['radiusMeters'] as num).toDouble(),
      address: j['address'] as String?,
    );
  }

  static TimeOfDay _hm(String v) {
    final parts = v.split(':');
    return TimeOfDay(
      hour: int.tryParse(parts[0]) ?? 0,
      minute: parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0,
    );
  }

  /// Maps the `/mobile/me/shift` DTO into a [Shift] anchored to [date].
  static Shift shift(Map<String, dynamic> j, DateTime date) {
    return Shift(
      id: j['id'] as String,
      name: j['name'] as String,
      date: date,
      startTime: _hm(j['startTime'] as String),
      endTime: _hm(j['endTime'] as String),
      workMode: WorkMode.wfo,
      gracePeriodMinutes: (j['gracePeriodMinutes'] as num?)?.toInt() ?? 10,
    );
  }

  /// Maps a `/mobile/me/schedule` day entry into a [Shift].
  static Shift scheduleDay(Map<String, dynamic> j) {
    return Shift(
      id: j['id'] as String,
      name: j['name'] as String,
      date: _date(j['date'] as String),
      startTime: _hm(j['startTime'] as String),
      endTime: _hm(j['endTime'] as String),
      workMode: workMode(j['workMode'] as String?),
      gracePeriodMinutes: (j['gracePeriodMinutes'] as num?)?.toInt() ?? 10,
      isDayOff: j['isDayOff'] as bool? ?? false,
    );
  }

  static LeaveType leaveType(String? v) => switch (v) {
        'annual' => LeaveType.annual,
        'sick' => LeaveType.sick,
        'personal' => LeaveType.personal,
        _ => LeaveType.other,
      };

  static String leaveTypeToApi(LeaveType t) => switch (t) {
        LeaveType.annual => 'annual',
        LeaveType.sick => 'sick',
        LeaveType.personal => 'personal',
        LeaveType.other => 'other',
      };

  static LeaveStatus leaveStatus(String? v) => switch (v) {
        'approved' => LeaveStatus.approved,
        'rejected' => LeaveStatus.rejected,
        'cancelled' => LeaveStatus.cancelled,
        _ => LeaveStatus.pending,
      };

  static LeaveRequest leave(Map<String, dynamic> j) {
    return LeaveRequest(
      id: j['id'] as String,
      type: leaveType(j['type'] as String?),
      startDate: _date(j['startDate'] as String),
      endDate: _date(j['endDate'] as String),
      reason: j['reason'] as String? ?? '',
      status: leaveStatus(j['status'] as String?),
      attachmentName: j['attachmentName'] as String?,
      submittedAt: _dateOrNull(j['submittedAt'] as String?),
      reviewerNote: j['reviewerNote'] as String?,
    );
  }

  static NotificationKind notificationKind(String? v) => switch (v) {
        'reminder' => NotificationKind.reminder,
        'approval' => NotificationKind.approval,
        'sync' => NotificationKind.sync,
        _ => NotificationKind.info,
      };

  static AppNotification notification(Map<String, dynamic> j) {
    return AppNotification(
      id: j['id'] as String,
      title: j['title'] as String? ?? 'Notifikasi',
      body: j['body'] as String? ?? '',
      createdAt: _date(j['createdAt'] as String),
      kind: notificationKind(j['kind'] as String?),
      read: j['read'] as bool? ?? false,
    );
  }
}
