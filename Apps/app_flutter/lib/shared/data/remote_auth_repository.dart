import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../../core/storage/token_store.dart';
import '../models/user_profile.dart';
import 'auth_repository.dart';

/// Talks to the backend mobile API (`/mobile/auth/*`, `/mobile/me`) using a
/// better-auth bearer token persisted in [TokenStore].
class RemoteAuthRepository implements AuthRepository {
  RemoteAuthRepository(this._client, this._tokenStore);

  final DioClient _client;
  final TokenStore _tokenStore;

  Dio get _dio => _client.raw;

  @override
  Future<UserProfile?> restoreSession() async {
    if (!await _tokenStore.hasSession()) return null;
    try {
      final res = await _dio.get<Map<String, dynamic>>('/mobile/me');
      final data = res.data?['data'] as Map<String, dynamic>?;
      if (data == null) return null;
      return UserProfile.fromJson(data);
    } on DioException catch (e) {
      // A stale/expired token → drop it and report no session.
      if (e.response?.statusCode == 401) {
        await _tokenStore.clear();
        return null;
      }
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<UserProfile> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/mobile/auth/login',
        data: {'email': email, 'password': password},
      );
      final data = res.data?['data'] as Map<String, dynamic>?;
      final token = data?['token'] as String?;
      final profile = data?['profile'] as Map<String, dynamic>?;
      if (token == null || profile == null) {
        throw const AuthException('Respons login tidak valid.');
      }
      await _tokenStore.saveTokens(accessToken: token);
      return UserProfile.fromJson(profile);
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _dio.post<void>('/mobile/auth/logout');
    } on DioException {
      // Best-effort; clear the local token regardless.
    } finally {
      await _tokenStore.clear();
    }
  }

  @override
  Future<UserProfile> enrollFace() async {
    try {
      final res =
          await _dio.post<Map<String, dynamic>>('/mobile/me/face/enroll');
      final data = res.data?['data'] as Map<String, dynamic>?;
      if (data == null) {
        throw const AuthException('Respons pendaftaran wajah tidak valid.');
      }
      return UserProfile.fromJson(data);
    } on DioException catch (e) {
      throw DioClient.mapError(e);
    }
  }
}

class AuthException implements Exception {
  const AuthException(this.message);
  final String message;
  @override
  String toString() => message;
}
