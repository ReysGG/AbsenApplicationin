import 'package:flutter_test/flutter_test.dart';

import 'package:app_flutter/shared/models/work_location.dart';

void main() {
  group('WorkLocation geofence', () {
    const office = WorkLocation(
      id: 'loc-1',
      name: 'Office',
      latitude: -6.2088,
      longitude: 106.8456,
      radiusMeters: 100,
    );

    test('point at the exact center is within the geofence', () {
      expect(office.isWithinGeofence(-6.2088, 106.8456), isTrue);
      expect(office.distanceMetersTo(-6.2088, 106.8456), closeTo(0, 0.5));
    });

    test('a far-away point is outside the geofence', () {
      // Roughly Bandung — definitely outside a 100m radius.
      expect(office.isWithinGeofence(-6.9175, 107.6191), isFalse);
    });

    test('a point ~35m away stays within a 100m radius', () {
      final d = office.distanceMetersTo(-6.20885, 106.84575);
      expect(d, lessThan(100));
      expect(office.isWithinGeofence(-6.20885, 106.84575), isTrue);
    });
  });
}
