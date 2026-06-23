/// Compile-time configuration. Override with `--dart-define`, e.g.
/// `flutter run --dart-define=API_BASE_URL=https://api.attendx.example`.
///
/// Keeping the base URL configurable means the same build can target a local
/// Docker backend, staging, or production without source-code changes.
abstract final class AppConfig {
  /// Base URL of the AttendX mobile API.
  ///
  /// The Docker stack maps the backend to host port 10001 (10001→4000 inside).
  /// Debug builds default to the Android emulator alias (`10.0.2.2`).
  /// Release builds must pass an explicit HTTPS API_BASE_URL.
  ///
  /// For a PHYSICAL device on the same Wi-Fi, pass your PC's LAN IP, e.g.:
  ///   flutter run --dart-define=USE_MOCK_DATA=false \
  ///     --dart-define=API_BASE_URL=http://192.168.18.11:10001/api/v1
  static const _isRelease = bool.fromEnvironment('dart.vm.product');
  static const _devApiBaseUrl = 'http://10.0.2.2:10001/api/v1';
  static const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

  static final String apiBaseUrl = _resolveApiBaseUrl();

  /// When true, repositories use in-memory mock data instead of the network.
  /// Lets the full UI run before the mobile backend endpoints exist.
  static const useMockData = bool.fromEnvironment(
    'USE_MOCK_DATA',
    defaultValue: !_isRelease,
  );

  static const appName = 'AttendX';
  static const appTagline = 'Absensi Digital Karyawan';

  /// Default geofence radii (meters) — aligned with backend defaults
  /// (PRD 4.2 / 4.4). Server config wins; these are UI fallbacks.
  static const defaultWfoRadiusMeters = 100.0;
  static const defaultWfhRadiusMeters = 150.0;

  static String _resolveApiBaseUrl() {
    if (_configuredApiBaseUrl.isEmpty) {
      if (_isRelease) {
        throw StateError('API_BASE_URL wajib diset untuk release build.');
      }
      return _devApiBaseUrl;
    }

    if (_isRelease && !_configuredApiBaseUrl.startsWith('https://')) {
      throw StateError('API_BASE_URL release harus menggunakan HTTPS.');
    }

    return _configuredApiBaseUrl;
  }
}
