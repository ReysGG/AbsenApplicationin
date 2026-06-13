/// Compile-time configuration. Override with `--dart-define`, e.g.
/// `flutter run --dart-define=API_BASE_URL=https://api.attendx.example`.
///
/// Keeping the base URL configurable means the same build can target a local
/// Docker backend, staging, or production without code changes.
abstract final class AppConfig {
  /// Base URL of the AttendX mobile API.
  ///
  /// The Docker stack maps the backend to host port 10001 (10001→4000 inside).
  /// Default below targets the Android emulator alias (`10.0.2.2`).
  ///
  /// For a PHYSICAL device on the same Wi-Fi, pass your PC's LAN IP, e.g.:
  ///   flutter run --dart-define=USE_MOCK_DATA=false \
  ///     --dart-define=API_BASE_URL=http://192.168.18.11:10001/api/v1
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:10001/api/v1',
  );

  /// When true, repositories use in-memory mock data instead of the network.
  /// Lets the full UI run before the mobile backend endpoints exist.
  static const useMockData = bool.fromEnvironment(
    'USE_MOCK_DATA',
    defaultValue: true,
  );

  static const appName = 'AttendX';
  static const appTagline = 'Absensi Digital Karyawan';

  /// Default geofence radii (meters) — aligned with backend defaults
  /// (PRD 4.2 / 4.4). Server config wins; these are UI fallbacks.
  static const defaultWfoRadiusMeters = 100.0;
  static const defaultWfhRadiusMeters = 150.0;
}
