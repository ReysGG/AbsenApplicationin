import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../shared/models/attendance_record.dart';

final historyProvider =
    FutureProvider.autoDispose<List<AttendanceRecord>>((ref) async {
  return ref.watch(attendanceRepositoryProvider).getHistory();
});

final attendanceDetailProvider = FutureProvider.autoDispose
    .family<AttendanceRecord, String>((ref, id) async {
  return ref.watch(attendanceRepositoryProvider).getDetail(id);
});
