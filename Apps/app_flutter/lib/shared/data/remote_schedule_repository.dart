import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/shift.dart';
import 'api_mappers.dart';
import 'schedule_repository.dart';

/// Remote schedule repository backed by `/mobile/me/schedule`.
/// The backend returns upcoming days; this filters to the week of [anchor].
class RemoteScheduleRepository implements ScheduleRepository {
  RemoteScheduleRepository(this._client);

  final DioClient _client;
  Dio get _dio => _client.raw;

  @override
  Future<List<Shift>> getWeek(DateTime anchor) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/mobile/me/schedule');
      final list = res.data?['data'] as List<dynamic>? ?? const [];
      final shifts = list
          .map((e) => ApiMappers.scheduleDay(e as Map<String, dynamic>))
          .toList();

      // Restrict to the Mon–Sun week containing [anchor].
      final monday = anchor.subtract(Duration(days: anchor.weekday - 1));
      final start = DateTime(monday.year, monday.month, monday.day);
      final end = start.add(const Duration(days: 7));
      final week = shifts
          .where((s) => !s.date.isBefore(start) && s.date.isBefore(end))
          .toList()
        ..sort((a, b) => a.date.compareTo(b.date));
      return week.isNotEmpty ? week : shifts;
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }
}
