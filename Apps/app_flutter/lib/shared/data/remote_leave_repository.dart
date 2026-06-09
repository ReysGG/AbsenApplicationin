import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/leave_request.dart';
import 'api_mappers.dart';
import 'leave_repository.dart';

/// Remote leave repository backed by `/mobile/me/leave-requests`.
class RemoteLeaveRepository implements LeaveRepository {
  RemoteLeaveRepository(this._client);

  final DioClient _client;
  Dio get _dio => _client.raw;

  @override
  Future<List<LeaveRequest>> getRequests() async {
    try {
      final res =
          await _dio.get<Map<String, dynamic>>('/mobile/me/leave-requests');
      final list = res.data?['data'] as List<dynamic>? ?? const [];
      return list
          .map((e) => ApiMappers.leave(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<LeaveRequest> submit(LeaveDraft draft) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/mobile/me/leave-requests',
        data: {
          'type': ApiMappers.leaveTypeToApi(draft.type),
          'startDate': _dateOnly(draft.startDate),
          'endDate': _dateOnly(draft.endDate),
          'reason': draft.reason,
        },
      );
      return ApiMappers.leave(res.data?['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<void> cancel(String id) async {
    // Cancellation endpoint is not yet exposed on the mobile API; the UI keeps
    // this as a no-op until the backend adds DELETE /mobile/me/leave-requests/:id.
    throw UnimplementedError('Pembatalan pengajuan belum tersedia.');
  }

  String _dateOnly(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
