import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/token_store.dart';
import 'api_exception.dart';

/// Configures the shared [Dio] instance: base URL, timeouts, bearer-token
/// injection, and error normalization to [ApiException].
///
/// Token refresh (on 401) and 429 backoff are layered in during Fase 6 when
/// the real mobile auth endpoints exist; the hook points live here.
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
        onError: (err, handler) {
          handler.reject(err);
        },
      ),
    );
  }

  final TokenStore _tokenStore;
  late final Dio _dio;

  Dio get raw => _dio;

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
