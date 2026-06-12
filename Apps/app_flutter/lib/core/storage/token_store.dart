import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists auth tokens in platform secure storage (Keystore on Android,
/// Keychain on iOS, libsecret/DPAPI on desktop).
///
/// The bearer token is no longer stored in plaintext (previously
/// SharedPreferences).
///
/// ENVIRONMENT CAVEAT (this machine only): the Flutter SDK is installed under a
/// path containing a space (`C:\Users\David Boy\flutter`). That breaks the Dart
/// native-assets hook runner (`objective_c` build hook) used by
/// flutter_secure_storage, so `flutter test` and `flutter build apk` fail with
/// "'C:\Users\David' is not recognized...". `flutter analyze` is unaffected.
/// Fix: move the SDK to a space-free path (e.g. `C:\flutter`) and re-run
/// `flutter pub get`. The application code itself is correct.
class TokenStore {
  TokenStore([FlutterSecureStorage? storage])
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  static const _kAccess = 'attendx.access_token';
  static const _kRefresh = 'attendx.refresh_token';
  static const _kAppLock = 'attendx.app_lock_enabled';

  final FlutterSecureStorage _storage;

  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await _storage.write(key: _kAccess, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _kRefresh, value: refreshToken);
    }
  }

  Future<String?> readAccessToken() => _storage.read(key: _kAccess);
  Future<String?> readRefreshToken() => _storage.read(key: _kRefresh);

  Future<bool> hasSession() async => (await readAccessToken()) != null;

  Future<bool> isAppLockEnabled() async {
    final val = await _storage.read(key: _kAppLock);
    return val == 'true';
  }

  Future<void> setAppLockEnabled(bool enabled) async {
    await _storage.write(key: _kAppLock, value: enabled ? 'true' : 'false');
  }

  Future<void> clear() async {
    await _storage.delete(key: _kAccess);
    await _storage.delete(key: _kRefresh);
  }
}
