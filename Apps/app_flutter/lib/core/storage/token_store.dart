import 'package:shared_preferences/shared_preferences.dart';

/// Persists auth tokens.
///
/// NOTE: For production this should use platform secure storage
/// (Keystore / Keychain via `flutter_secure_storage`). It is temporarily
/// backed by SharedPreferences because the current Flutter SDK is installed
/// under a path containing a space (`C:\Users\David Boy\flutter`), which breaks
/// the Dart native-assets hook runner that `flutter_secure_storage` pulls in
/// transitively (via `path_provider_foundation → objective_c`). Once the SDK
/// is relocated to a space-free path, swap this back to secure storage.
class TokenStore {
  static const _kAccess = 'attendx.access_token';
  static const _kRefresh = 'attendx.refresh_token';

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    final p = await _prefs;
    await p.setString(_kAccess, accessToken);
    if (refreshToken != null) {
      await p.setString(_kRefresh, refreshToken);
    }
  }

  Future<String?> readAccessToken() async => (await _prefs).getString(_kAccess);
  Future<String?> readRefreshToken() async =>
      (await _prefs).getString(_kRefresh);

  Future<bool> hasSession() async => (await readAccessToken()) != null;

  Future<void> clear() async {
    final p = await _prefs;
    await p.remove(_kAccess);
    await p.remove(_kRefresh);
  }
}
