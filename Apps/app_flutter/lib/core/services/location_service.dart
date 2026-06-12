import 'package:geolocator/geolocator.dart';

/// Thrown when a GPS fix cannot be acquired (permission denied or the device
/// location service is switched off). Carries a user-facing [message].
class LocationServiceException implements Exception {
  const LocationServiceException(this.message);
  final String message;

  @override
  String toString() => 'LocationServiceException: $message';
}

/// Wraps the platform GPS sensor via `geolocator`.
///
/// Responsibilities:
///  - ensure the device location service is on,
///  - check/request runtime permission,
///  - return a high-accuracy [Position],
///  - expose the OS mock-location flag (`position.isMocked`) so the caller can
///    flag spoofed fixes to the backend.
class LocationService {
  const LocationService();

  /// Acquires a high-accuracy GPS fix.
  ///
  /// Throws [LocationServiceException] with an Indonesian message when the
  /// location service is disabled or permission is denied.
  Future<Position> getCurrentPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw const LocationServiceException(
        'Layanan lokasi (GPS) mati. Aktifkan GPS lalu coba lagi.',
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw const LocationServiceException(
        'Izin lokasi ditolak. Berikan izin lokasi untuk melanjutkan.',
      );
    }
    if (permission == LocationPermission.deniedForever) {
      throw const LocationServiceException(
        'Izin lokasi diblokir permanen. Aktifkan dari Pengaturan aplikasi.',
      );
    }

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 20),
        ),
      );
    } catch (e) {
      throw LocationServiceException(
        'Gagal mendapatkan lokasi: ${e.toString()}',
      );
    }
  }

  /// Whether the supplied [position] was reported as a mock/spoofed location.
  bool isMocked(Position position) => position.isMocked;
}
