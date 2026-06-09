import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/app_notification.dart';
import 'api_mappers.dart';
import 'notification_repository.dart';

/// Remote notification repository backed by `/mobile/me/notifications`.
class RemoteNotificationRepository implements NotificationRepository {
  RemoteNotificationRepository(this._client);

  final DioClient _client;
  Dio get _dio => _client.raw;

  @override
  Future<List<AppNotification>> getAll() async {
    try {
      final res =
          await _dio.get<Map<String, dynamic>>('/mobile/me/notifications');
      final list = res.data?['data'] as List<dynamic>? ?? const [];
      return list
          .map((e) => ApiMappers.notification(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<void> markRead(String id) async {
    // Mark-read endpoint not yet exposed on the mobile API surface; no-op.
  }

  @override
  Future<void> markAllRead() async {
    // Mark-all-read endpoint not yet exposed on the mobile API surface; no-op.
  }
}
