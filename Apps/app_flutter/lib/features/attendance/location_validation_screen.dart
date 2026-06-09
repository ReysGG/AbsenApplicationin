import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../shared/models/work_location.dart';
import 'checkin_flow_controller.dart';

/// Step 2 (WFO only): acquire GPS fix and verify the employee is within the
/// geofence radius of an assigned work location.
///
/// Uses a simulated location fix for now; `geolocator` + `flutter_map` (OSM)
/// integration lands in Fase 3 without changing this screen's contract.
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

  @override
  void initState() {
    super.initState();
    _acquire();
  }

  Future<void> _acquire() async {
    setState(() => _locating = true);
    final repo = ref.read(attendanceRepositoryProvider);
    final locations = await repo.getAssignedLocations();
    // Simulated GPS fix near the first assigned office.
    await Future<void>.delayed(const Duration(milliseconds: 1200));
    final loc = locations.first;
    // Pretend we are 35m away (within the 100m radius).
    const myLat = -6.20885;
    const myLng = 106.84575;
    final dist = loc.distanceMetersTo(myLat, myLng);
    if (!mounted) return;
    setState(() {
      _location = loc;
      _distance = dist;
      _withinRadius = loc.isWithinGeofence(myLat, myLng);
      _locating = false;
    });
    ref.read(checkinFlowProvider.notifier).setLocation(
          lat: myLat,
          lng: myLng,
          verified: _withinRadius,
        );
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

          // Map area (placeholder; OSM map in Fase 3)
          Container(
            height: 240,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainer,
              borderRadius: BorderRadius.circular(AppRadius.xl),
              border: Border.all(color: AppColors.surfaceContainerHigh),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                if (_locating)
                  const CircularProgressIndicator()
                else ...[
                  Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      color: (_withinRadius
                              ? AppColors.success
                              : AppColors.error)
                          .withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: (_withinRadius
                                ? AppColors.success
                                : AppColors.error)
                            .withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                  Icon(Icons.my_location,
                      color:
                          _withinRadius ? AppColors.success : AppColors.error,
                      size: 36),
                ],
              ],
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
                    if (!_locating)
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
          if (!_locating && !_withinRadius) ...[
            const SizedBox(height: AppSpacing.md),
            _WarningCard(onRetry: _acquire),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: FilledButton(
            onPressed: (!_locating && _withinRadius)
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
  const _WarningCard({required this.onRetry});
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
          const Icon(Icons.warning_amber_rounded,
              color: AppColors.onErrorContainer),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'Kamu berada di luar radius lokasi kerja. Pindah lebih dekat lalu coba lagi.',
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
