// Domain enums shared across features. Values mirror the backend's
// attendance/leave status vocabulary (see backend `attendance.schema.ts`).

enum WorkMode {
  wfo,
  wfh;

  String get label => switch (this) {
    WorkMode.wfo => 'WFO',
    WorkMode.wfh => 'WFH',
  };
}

enum AttendanceStatus {
  present,
  late,
  absent,
  pendingCheckout,
  missingCheckout,
  leave,
  invalid;

  String get label => switch (this) {
    AttendanceStatus.present => 'Hadir',
    AttendanceStatus.late => 'Terlambat',
    AttendanceStatus.absent => 'Absen',
    AttendanceStatus.pendingCheckout => 'Belum Check-out',
    AttendanceStatus.missingCheckout => 'Lupa Check-out',
    AttendanceStatus.leave => 'Izin/Cuti',
    AttendanceStatus.invalid => 'Tidak Valid',
  };
}

enum VerificationStatus { passed, failed, pending, notRequired }

enum SyncStatus {
  synced,
  pending,
  syncing,
  failed;

  String get label => switch (this) {
    SyncStatus.synced => 'Tersinkron',
    SyncStatus.pending => 'Menunggu Sync',
    SyncStatus.syncing => 'Menyinkronkan',
    SyncStatus.failed => 'Gagal Sync',
  };
}

enum LeaveType {
  annual,
  sick,
  personal,
  other;

  String get label => switch (this) {
    LeaveType.annual => 'Cuti Tahunan',
    LeaveType.sick => 'Sakit',
    LeaveType.personal => 'Izin Pribadi',
    LeaveType.other => 'Lainnya',
  };
}

enum LeaveStatus {
  pending,
  approved,
  rejected,
  cancelled;

  String get label => switch (this) {
    LeaveStatus.pending => 'Menunggu',
    LeaveStatus.approved => 'Disetujui',
    LeaveStatus.rejected => 'Ditolak',
    LeaveStatus.cancelled => 'Dibatalkan',
  };
}
