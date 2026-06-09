import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../shared/data/attendance_repository.dart';
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
  return HomeData(today: today, shift: shift);
});
