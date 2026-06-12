import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/router/app_routes.dart';
import '../../core/services/location_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/osm_mini_map.dart';
import '../../core/widgets/status_badge.dart';
import '../../shared/models/work_location.dart';
import 'checkin_flow_controller.dart';

/// Step 2 (WFO only): acquire a real GPS fix via [LocationService] and verify
/// the employee is within the geofence radius of an assigned work location.
class LocationValidationScreen extends ConsumerStatefulWidget {
  const LocationValidationScreen({super.key});

  @override
  ConsumerState<LocationValidationScreen> createState() =>
      _LocationValidationScreenState();
}

class _LocationValidationScreenState
    extends ConsumerState<LocationValidationScreen> {
  bool _locating = true;
  WorkLocation? _location;
  double? _distance;
  bool _withinRadius = false;
  bool _mocked = false;
  String? _error;
  double? _myLat;
  double? _myLng;

  @override
  void initState() {
    super.initState();
    _acquire();
  }

  Future<void> _acquire() async {
    setState(() {
      _locating = true;
      _error = null;
    });

    final repo = ref.read(attendanceRepositoryProvider);

    try {
      final locations = await repo.getAssignedLocations();
      if (locations.isEmpty) {
        if (!mounted) return;
        setState(() {
          _locating = false;
          _error = 'Belum ada lokasi kerja yang ditugaskan.';
        });
        return;
      }

      // Real GPS fix.
      final position = await const LocationService().getCurrentPosition();
      final myLat = position.latitude;
      final myLng = position.longitude;
      final mocked = position.isMocked;

      // Pick the nearest assigned location to validate against.
      WorkLocation nearest = locations.first;
      double nearestDist = nearest.distanceMetersTo(myLat, myLng);
      for (final loc in locations.skip(1)) {
        final d = loc.distanceMetersTo(myLat, myLng);
        if (d < nearestDist) {
          nearest = loc;
          nearestDist = d;
        }
      }

      final within = nearest.isWithinGeofence(myLat, myLng);
      if (!mounted) return;
      setState(() {
        _location = nearest;
        _distance = nearestDist;
        _withinRadius = within;
        _mocked = mocked;
        _myLat = myLat;
        _myLng = myLng;
        _locating = false;
      });

      ref.read(checkinFlowProvider.notifier).setLocation(
            lat: myLat,
            lng: myLng,
            verified: within,
            locationId: nearest.id,
            mockDetected: mocked,
          );
    } on LocationServiceException catch (e) {
      if (!mounted) return;
      setState(() {
        _locating = false;
        _error = e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _locating = false;
        _error = 'Gagal mendapatkan lokasi. Coba lagi.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Validasi Lokasi')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Text('Memastikan kamu berada di lokasi kerja yang sah',
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: AppSpacing.md),

          // Map area — real OpenStreetMap with geofence circle + my position.
          if (_locating)
            Container(
              height: 240,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainer,
                borderRadius: BorderRadius.circular(AppRadius.xl),
                border: Border.all(color: AppColors.surfaceContainerHigh),
              ),
              child: const Center(child: CircularProgressIndicator()),
            )
          else if (_myLat != null && _myLng != null)
            OsmMiniMap(
              latitude: _myLat!,
              longitude: _myLng!,
              geofenceRadiusMeters: _location?.radiusMeters.toDouble(),
              height: 240,
              borderRadius: AppRadius.xl,
            )
          else
            Container(
              height: 240,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainer,
                borderRadius: BorderRadius.circular(AppRadius.xl),
                border: Border.all(color: AppColors.surfaceContainerHigh),
              ),
              child: Center(
                child: Icon(Icons.location_off,
                    color: AppColors.onSurfaceVariant, size: 36),
              ),
            ),
          const SizedBox(height: AppSpacing.md),

          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(_location?.name ?? 'Mencari lokasi...',
                          style: AppTypography.labelMd),
                    ),
                    if (!_locating && _error == null)
                      StatusBadge(
                        label: _withinRadius ? 'Dalam Radius' : 'Di Luar Radius',
                        color: _withinRadius
                            ? AppColors.success
                            : AppColors.error,
                        icon: _withinRadius
                            ? Icons.check_circle
                            : Icons.error_outline,
                      ),
                  ],
                ),
                if (_location?.address != null) ...[
                  const SizedBox(height: 4),
                  Text(_location!.address!,
                      style: AppTypography.bodyMd
                          .copyWith(color: AppColors.onSurfaceVariant)),
                ],
                if (_distance != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Jarak: ${_distance!.toStringAsFixed(0)} m '
                    '(radius ${_location!.radiusMeters.toStringAsFixed(0)} m)',
                    style: AppTypography.labelSm.copyWith(
                        color: AppColors.onSurfaceVariant, letterSpacing: 0),
                  ),
                ],
              ],
            ),
          ),
          if (!_locating && _mocked) ...[
            const SizedBox(height: AppSpacing.md),
            _MockWarningCard(),
          ],
          if (!_locating && _error != null) ...[
            const SizedBox(height: AppSpacing.md),
            _WarningCard(
              message: _error!,
              onRetry: _acquire,
            ),
          ] else if (!_locating && !_withinRadius) ...[
            const SizedBox(height: AppSpacing.md),
            _WarningCard(
              message:
                  'Kamu berada di luar radius lokasi kerja. Pindah lebih dekat lalu coba lagi.',
              onRetry: _acquire,
            ),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: FilledButton(
            onPressed: (!_locating && _withinRadius && _error == null)
                ? () => context.push(AppRoutes.faceVerification)
                : null,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: const Text('Lanjut ke Verifikasi Wajah'),
          ),
        ),
      ),
    );
  }
}

class _WarningCard extends StatelessWidget {
  const _WarningCard({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.errorContainer,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded,
              color: AppColors.onErrorContainer),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onErrorContainer),
            ),
          ),
          TextButton(onPressed: onRetry, child: const Text('Ulangi')),
        ],
      ),
    );
  }
}

/// Shown when the OS reports a mock/spoofed GPS fix. We still capture it; the
/// backend is the authority that rejects spoofed check-ins.
class _MockWarningCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.errorContainer,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        children: [
          Icon(Icons.gpp_bad_outlined, color: AppColors.onErrorContainer),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'Lokasi palsu (mock GPS) terdeteksi. Absen dapat ditolak server. '
              'Matikan aplikasi pemalsu lokasi lalu coba lagi.',
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onErrorContainer),
            ),
          ),
        ],
      ),
    );
  }
}
