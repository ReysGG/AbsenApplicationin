import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// OpenStreetMap mini-map showing a position pin and an optional geofence
/// circle. Free OSM tiles (no API key), but tiles need real internet (WAN).
///
/// Robust by design: a flat "map base" (neutral surface + subtle grid) is
/// painted BEHIND the tile layer, so if tiles fail to load (offline /
/// LAN-only Wi-Fi) the panel still shows the pin, geofence ring, and
/// coordinates instead of a blank box.
class OsmMiniMap extends StatelessWidget {
  const OsmMiniMap({
    super.key,
    required this.latitude,
    required this.longitude,
    this.geofenceRadiusMeters,
    this.height = 180,
    this.interactive = false,
    this.borderRadius = AppRadius.lg,
  });

  final double latitude;
  final double longitude;
  final double? geofenceRadiusMeters;
  final double height;
  final bool interactive;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final center = LatLng(latitude, longitude);

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: SizedBox(
        height: height,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Flat fallback base — always visible; tiles paint over it.
            const _MapBase(),
            FlutterMap(
              options: MapOptions(
                initialCenter: center,
                initialZoom: 16,
                interactionOptions: InteractionOptions(
                  flags:
                      interactive ? InteractiveFlag.all : InteractiveFlag.none,
                ),
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.app_flutter',
                  tileProvider: NetworkTileProvider(),
                  // Keep transparent on error so the styled base shows through.
                  errorTileCallback: (tile, error, stack) {},
                ),
                if (geofenceRadiusMeters != null)
                  CircleLayer(
                    circles: [
                      CircleMarker(
                        point: center,
                        radius: geofenceRadiusMeters!,
                        useRadiusInMeter: true,
                        color: AppColors.primary.withValues(alpha: 0.15),
                        borderColor: AppColors.primary.withValues(alpha: 0.6),
                        borderStrokeWidth: 2,
                      ),
                    ],
                  ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: center,
                      width: 44,
                      height: 44,
                      child: const _Pin(),
                    ),
                  ],
                ),
              ],
            ),
            // Coordinate chip (bottom-left) — useful when tiles are absent.
            Positioned(
              left: AppSpacing.sm,
              bottom: AppSpacing.sm,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Text(
                  '${latitude.toStringAsFixed(5)}, ${longitude.toStringAsFixed(5)}',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Flat map-like backdrop (neutral surface + faint grid) shown under the tiles
/// so the panel never renders as a blank box when tiles are unavailable.
class _MapBase extends StatelessWidget {
  const _MapBase();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(color: AppColors.surfaceContainer),
      child:
          CustomPaint(painter: _GridPainter(), child: const SizedBox.expand()),
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.outlineVariant.withValues(alpha: 0.5)
      ..strokeWidth = 1;
    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_GridPainter oldDelegate) => false;
}

class _Pin extends StatelessWidget {
  const _Pin();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.primary,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
        boxShadow: const [
          BoxShadow(
            color: Color(0x40000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: const Icon(Icons.person_pin_circle, color: Colors.white, size: 22),
    );
  }
}
