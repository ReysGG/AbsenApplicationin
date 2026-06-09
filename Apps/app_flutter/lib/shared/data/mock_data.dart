import 'package:flutter/material.dart';

import '../models/app_notification.dart';
import '../models/attendance_record.dart';
import '../models/enums.dart';
import '../models/leave_request.dart';
import '../models/shift.dart';
import '../models/work_location.dart';

/// Seed data for the mock repositories. Mirrors the scenarios shown in the
/// mockups (present/WFO, late/WFH, pending sync, etc.).
abstract final class MockData {
  static DateTime _d(int daysAgo) {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day).subtract(Duration(days: daysAgo));
  }

  static final officeJakarta = const WorkLocation(
    id: 'loc-001',
    name: 'Kantor Pusat Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    radiusMeters: 100,
    address: 'Jl. Jenderal Sudirman No. 1, Jakarta Pusat',
  );

  static List<WorkLocation> locations = [officeJakarta];

  static Shift todayShift = Shift(
    id: 'shift-001',
    name: 'Shift Pagi',
    date: _d(0),
    startTime: const TimeOfDay(hour: 8, minute: 0),
    endTime: const TimeOfDay(hour: 17, minute: 0),
    workMode: WorkMode.wfo,
    gracePeriodMinutes: 10,
  );

  static List<Shift> weekShifts() {
    final monday = _d(DateTime.now().weekday - 1);
    return List.generate(7, (i) {
      final date = monday.add(Duration(days: i));
      final isWeekend = date.weekday == DateTime.saturday ||
          date.weekday == DateTime.sunday;
      return Shift(
        id: 'shift-${date.toIso8601String()}',
        name: isWeekend ? 'Libur' : (i.isEven ? 'Shift Pagi' : 'Shift Siang'),
        date: date,
        startTime: TimeOfDay(hour: i.isEven ? 8 : 13, minute: 0),
        endTime: TimeOfDay(hour: i.isEven ? 17 : 22, minute: 0),
        workMode: i % 3 == 1 ? WorkMode.wfh : WorkMode.wfo,
        isDayOff: isWeekend,
      );
    });
  }

  static List<AttendanceRecord> attendanceHistory() => [
        AttendanceRecord(
          id: 'att-1',
          date: _d(1),
          status: AttendanceStatus.present,
          workMode: WorkMode.wfo,
          shiftName: 'Shift Pagi',
          checkInAt: _d(1).add(const Duration(hours: 7, minutes: 58)),
          checkOutAt: _d(1).add(const Duration(hours: 17, minutes: 5)),
          checkInLat: -6.2088,
          checkInLng: 106.8456,
          locationName: 'Kantor Pusat Jakarta',
          faceStatus: VerificationStatus.passed,
        ),
        AttendanceRecord(
          id: 'att-2',
          date: _d(2),
          status: AttendanceStatus.late,
          workMode: WorkMode.wfh,
          shiftName: 'Shift Pagi',
          checkInAt: _d(2).add(const Duration(hours: 8, minutes: 35)),
          checkOutAt: _d(2).add(const Duration(hours: 17, minutes: 2)),
          locationName: 'Rumah (WFH)',
          faceStatus: VerificationStatus.passed,
        ),
        AttendanceRecord(
          id: 'att-3',
          date: _d(3),
          status: AttendanceStatus.present,
          workMode: WorkMode.wfo,
          shiftName: 'Shift Pagi',
          checkInAt: _d(3).add(const Duration(hours: 7, minutes: 50)),
          locationName: 'Kantor Pusat Jakarta',
          faceStatus: VerificationStatus.passed,
          syncStatus: SyncStatus.pending,
        ),
      ];

  static List<LeaveRequest> leaveRequests() => [
        LeaveRequest(
          id: 'lv-1',
          type: LeaveType.annual,
          startDate: _d(-3),
          endDate: _d(-1),
          reason: 'Liburan keluarga ke luar kota.',
          status: LeaveStatus.pending,
          submittedAt: _d(1),
        ),
        LeaveRequest(
          id: 'lv-2',
          type: LeaveType.sick,
          startDate: _d(5),
          endDate: _d(5),
          reason: 'Demam, surat dokter terlampir.',
          status: LeaveStatus.approved,
          attachmentName: 'surat_dokter.pdf',
          submittedAt: _d(6),
          reviewerNote: 'Semoga lekas sembuh.',
        ),
        LeaveRequest(
          id: 'lv-3',
          type: LeaveType.personal,
          startDate: _d(10),
          endDate: _d(10),
          reason: 'Keperluan keluarga.',
          status: LeaveStatus.rejected,
          submittedAt: _d(12),
          reviewerNote: 'Bentrok dengan deadline rilis.',
        ),
      ];

  static List<AppNotification> notifications() => [
        AppNotification(
          id: 'n-1',
          title: 'Pengingat Check-in',
          body: 'Jangan lupa absen sebelum jam 08:00.',
          createdAt: DateTime.now().subtract(const Duration(hours: 1)),
          kind: NotificationKind.reminder,
        ),
        AppNotification(
          id: 'n-2',
          title: 'Pengajuan Disetujui',
          body: 'Cuti sakit tanggal kemarin telah disetujui HR.',
          createdAt: DateTime.now().subtract(const Duration(hours: 3)),
          kind: NotificationKind.approval,
        ),
        AppNotification(
          id: 'n-3',
          title: 'Sinkronisasi Selesai',
          body: 'Absen offline kemarin berhasil dikirim ke server.',
          createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
          kind: NotificationKind.sync,
          read: true,
        ),
      ];
}
