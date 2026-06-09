import 'package:flutter/material.dart';

import '../../shared/models/enums.dart';
import '../theme/app_colors.dart';

/// Maps domain status enums to their semantic display color.
abstract final class StatusStyles {
  static Color attendance(AttendanceStatus s) => switch (s) {
        AttendanceStatus.present => AppColors.success,
        AttendanceStatus.late => AppColors.pending,
        AttendanceStatus.absent => AppColors.error,
        AttendanceStatus.invalid => AppColors.error,
        AttendanceStatus.missingCheckout => AppColors.pending,
        AttendanceStatus.pendingCheckout => AppColors.primary,
        AttendanceStatus.leave => AppColors.secondary,
      };

  static Color leave(LeaveStatus s) => switch (s) {
        LeaveStatus.approved => AppColors.success,
        LeaveStatus.pending => AppColors.pending,
        LeaveStatus.rejected => AppColors.error,
        LeaveStatus.cancelled => AppColors.outline,
      };

  static Color sync(SyncStatus s) => switch (s) {
        SyncStatus.synced => AppColors.success,
        SyncStatus.pending => AppColors.pending,
        SyncStatus.syncing => AppColors.primary,
        SyncStatus.failed => AppColors.error,
      };

  static Color workMode(WorkMode m) =>
      m == WorkMode.wfo ? AppColors.primary : AppColors.secondary;
}
