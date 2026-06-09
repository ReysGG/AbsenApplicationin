import 'dart:async';

import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/token_store.dart';
import 'api_exception.dart';

/// Configures the shared [Dio] instance: base URL, timeouts, bearer-token
/// injection, bounded 429 backoff, automatic 401 token clearing, and error
/// normalization to [ApiException].
class DioClient {
  DioClient(this._tokenStore) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        sendTimeout: const Duration(seconds: 20),
        headers: {'Accept': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStore.readAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (err, handler) async {
          final status = err.response?.statusCode;
          final path = err.requestOptions.path;

          // 429 — bounded retry with backoff. Honour `Retry-After` if present
          // (seconds). Cap at [_maxRetries] retries per request to avoid
          // hammering the server when it's already overloaded.
          if (status == 429) {
            final retryCount = (err.requestOptions.extra[_kRetryKey] as int?) ?? 0;
            if (retryCount < _maxRetries) {
              final delay = _retryDelay(err.response, retryCount);
              await Future<void>.delayed(delay);
              try {
                final cloned = err.requestOptions.copyWith(
                  extra: {
                    ...err.requestOptions.extra,
                    _kRetryKey: retryCount + 1,
                  },
                );
                final response = await _dio.fetch<dynamic>(cloned);
                return handler.resolve(response);
              } catch (retryErr) {
                if (retryErr is DioException) return handler.next(retryErr);
                rethrow;
              }
            }
          }

          // 401 — session is invalid. Clear the stored token so the next
          // request goes out unauthenticated and the UI can redirect to login.
          // Skip on the login endpoint itself: a wrong-password 401 is normal
          // and must not wipe an unrelated session.
          if (status == 401 && !path.contains('/mobile/auth/login')) {
            await _tokenStore.clear();
          }

          handler.next(err);
        },
      ),
    );
  }

  static const _kRetryKey = 'attendx.retryCount';
  static const _maxRetries = 2;

  final TokenStore _tokenStore;
  late final Dio _dio;

  Dio get raw => _dio;

  /// Picks a backoff duration. Honours an integer-seconds `Retry-After` header
  /// from the server, otherwise exponential 500ms / 1s.
  static Duration _retryDelay(Response<dynamic>? res, int attempt) {
    final retryAfter = res?.headers.value('retry-after');
    if (retryAfter != null) {
      final secs = int.tryParse(retryAfter);
      if (secs != null && secs > 0 && secs <= 30) {
        return Duration(seconds: secs);
      }
    }
    return Duration(milliseconds: 500 * (1 << attempt));
  }

  /// Maps a [DioException] into the app's [ApiException].
  static ApiException mapError(DioException err) {
    final status = err.response?.statusCode;
    final isNetwork = err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout;

    String message = 'Terjadi kesalahan. Coba lagi.';
    final data = err.response?.data;
    if (data is Map && data['error'] is Map && data['error']['message'] != null) {
      message = data['error']['message'].toString();
    } else if (data is Map && data['message'] != null) {
      message = data['message'].toString();
    } else if (isNetwork) {
      message = 'Tidak ada koneksi internet.';
    } else if (status == 401) {
      message = 'Sesi berakhir. Silakan masuk kembali.';
    } else if (status == 429) {
      message = 'Terlalu banyak percobaan. Coba lagi sebentar.';
    }

    return ApiException(message, statusCode: status, isNetwork: isNetwork);
  }
}
