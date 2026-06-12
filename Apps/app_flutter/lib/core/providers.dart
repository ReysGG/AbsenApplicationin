import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../shared/data/attendance_repository.dart';
import '../shared/data/auth_repository.dart';
import '../shared/data/leave_repository.dart';
import '../shared/data/notification_repository.dart';
import '../shared/data/remote_attendance_repository.dart';
import '../shared/data/remote_auth_repository.dart';
import '../shared/data/remote_leave_repository.dart';
import '../shared/data/remote_notification_repository.dart';
import '../shared/data/remote_schedule_repository.dart';
import '../shared/data/schedule_repository.dart';
import 'config/app_config.dart';
import 'network/dio_client.dart';
import 'services/sync_service.dart';
import 'storage/token_store.dart';

/// Central dependency wiring. [AppConfig.useMockData] selects in-memory mocks
/// (offline UI development) versus the remote mobile API. Flipping the flag is
/// the only change needed to go from mock to live.

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());

final dioClientProvider = Provider<DioClient>((ref) {
  return DioClient(ref.read(tokenStoreProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  if (AppConfig.useMockData) return MockAuthRepository();
  return RemoteAuthRepository(
    ref.read(dioClientProvider),
    ref.read(tokenStoreProvider),
  );
});

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  if (AppConfig.useMockData) return MockAttendanceRepository();
  return RemoteAttendanceRepository(ref.read(dioClientProvider));
});

final leaveRepositoryProvider = Provider<LeaveRepository>((ref) {
  if (AppConfig.useMockData) return MockLeaveRepository();
  return RemoteLeaveRepository(ref.read(dioClientProvider));
});

final scheduleRepositoryProvider = Provider<ScheduleRepository>((ref) {
  if (AppConfig.useMockData) return MockScheduleRepository();
  return RemoteScheduleRepository(ref.read(dioClientProvider));
});

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  if (AppConfig.useMockData) return MockNotificationRepository();
  return RemoteNotificationRepository(ref.read(dioClientProvider));
});

/// Connectivity + offline sync. Uses the active attendance repository so synced
/// items hit the same backend as live submissions.
final syncServiceProvider = Provider<SyncService>((ref) {
  return SyncService(ref.read(attendanceRepositoryProvider));
});

/// State management for theme mode switching (Light / Dark).
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.system);

  void toggleTheme() {
    state = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
  }

  void setThemeMode(ThemeMode mode) {
    state = mode;
  }
}

