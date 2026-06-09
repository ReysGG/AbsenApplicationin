import 'dart:math' as math;

import 'package:equatable/equatable.dart';

/// A valid work location (office / branch / approved WFH) with geofence radius.
class WorkLocation extends Equatable {
  const WorkLocation({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
    this.address,
  });

  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final String? address;

  /// Great-circle distance in meters from this location to [lat]/[lng]
  /// using the Haversine formula.
  double distanceMetersTo(double lat, double lng) {
    const earthRadius = 6371000.0; // meters
    final dLat = _toRad(lat - latitude);
    final dLng = _toRad(lng - longitude);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRad(latitude)) *
            math.cos(_toRad(lat)) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadius * c;
  }

  bool isWithinGeofence(double lat, double lng) =>
      distanceMetersTo(lat, lng) <= radiusMeters;

  static double _toRad(double deg) => deg * (math.pi / 180.0);

  @override
  List<Object?> get props => [id];
}
