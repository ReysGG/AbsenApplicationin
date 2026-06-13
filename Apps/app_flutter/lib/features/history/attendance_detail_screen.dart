import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/status_styles.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/page_background.dart';
import '../../core/widgets/solid_card.dart';
import '../../core/widgets/lottie_icon.dart';
import '../../core/widgets/osm_mini_map.dart';
import '../../core/widgets/status_badge.dart';
import '../../shared/models/enums.dart';
import 'history_controller.dart';

class AttendanceDetailScreen extends ConsumerWidget {
  const AttendanceDetailScreen({super.key, required this.recordId});
  final String recordId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(attendanceDetailProvider(recordId));

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Detail Presensi'),
        backgroundColor: Colors.transparent,
      ),
      body: PageBackground(
        child: async.when(
          loading: () =>
              const Center(child: LottieIcon(LottieIcon.loading)),
          error: (e, _) => AppErrorState(
              onRetry: () =>
                  ref.invalidate(attendanceDetailProvider(recordId))),
          data: (r) {
            // Hero destination — the status header card.
            final headerCard = SolidCard(
              entrance: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(Formatters.fullDate(r.date),
                          style: AppTypography.labelMd
                              .copyWith(color: AppColors.onSurfaceVariant)),
                      StatusBadge(
                        label: r.status.label,
                        color: StatusStyles.attendance(r.status),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(r.shiftName, style: AppTypography.headlineMd),
                  const SizedBox(height: AppSpacing.xs),
                  Row(
                    children: [
                      Icon(
                        r.workMode == WorkMode.wfo
                            ? Icons.business
                            : Icons.home_work_outlined,
                        size: 16,
                        color: AppColors.onSurfaceVariant,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${r.workMode.label} · ${r.locationName ?? '-'}',
                        style: AppTypography.labelSm.copyWith(
                            color: AppColors.onSurfaceVariant,
                            letterSpacing: 0),
                      ),
                    ],
                  ),
                ],
              ),
            );

            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                Hero(
                  tag: 'attendance-${r.id}',
                  flightShuttleBuilder: (_, _, _, _, _) => headerCard,
                  child: headerCard,
                ),
                const SizedBox(height: AppSpacing.md),

                // Time & shift overview
                _AnimatedGlass(
                  delayMs: 100,
                  child: SolidCard(
                    entrance: false,
                    child: Column(
                      children: [
                        _row('Shift', r.shiftName),
                        const Divider(height: AppSpacing.lg),
                        _row(
                            'Jam Masuk',
                            r.checkInAt != null
                                ? Formatters.time(r.checkInAt!)
                                : '—'),
                        const Divider(height: AppSpacing.lg),
                        _row(
                            'Jam Pulang',
                            r.checkOutAt != null
                                ? Formatters.time(r.checkOutAt!)
                                : '—'),
                        const Divider(height: AppSpacing.lg),
                        _row(
                          'Total Jam',
                          r.workedDuration != null
                              ? Formatters.duration(r.workedDuration!)
                              : '—',
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // Validation & metrics
                Text('Validasi & Metrik', style: AppTypography.labelMd)
                    .animate(delay: 160.ms)
                    .fadeIn(duration: 280.ms),
                const SizedBox(height: AppSpacing.sm),
                _AnimatedGlass(
                  delayMs: 200,
                  child: SolidCard(
                    entrance: false,
                    child: Column(
                      children: [
                        _StaggeredMetric(
                          index: 0,
                          label: 'Mode Kerja',
                          value: r.workMode.label,
                          color: StatusStyles.workMode(r.workMode),
                        ),
                        const Divider(height: AppSpacing.lg),
                        _StaggeredMetric(
                          index: 1,
                          label: 'Validasi Lokasi',
                          value: r.geofenceValid ? 'Valid' : 'Di luar radius',
                          color: r.geofenceValid
                              ? AppColors.success
                              : AppColors.error,
                        ),
                        const Divider(height: AppSpacing.lg),
                        _StaggeredMetric(
                          index: 2,
                          label: 'Validasi Wajah',
                          value: _faceLabel(r.faceStatus),
                          color: r.faceStatus == VerificationStatus.passed
                              ? AppColors.success
                              : AppColors.pending,
                        ),
                        const Divider(height: AppSpacing.lg),
                        _StaggeredMetric(
                          index: 3,
                          label: 'Status Sinkronisasi',
                          value: r.syncStatus.label,
                          color: StatusStyles.sync(r.syncStatus),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                if (r.checkInLat != null) ...[
                  Text('Lokasi Check-in', style: AppTypography.labelMd)
                      .animate(delay: 320.ms)
                      .fadeIn(duration: 240.ms),
                  const SizedBox(height: AppSpacing.sm),
                  _MapPlaceholder(
                    lat: r.checkInLat!,
                    lng: r.checkInLng!,
                    label: r.locationName ?? 'Lokasi check-in',
                    delayMs: 360,
                  ),
                ],
                if (r.checkOutLat != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Text('Lokasi Check-out', style: AppTypography.labelMd)
                      .animate(delay: 440.ms)
                      .fadeIn(duration: 240.ms),
                  const SizedBox(height: AppSpacing.sm),
                  _MapPlaceholder(
                    lat: r.checkOutLat!,
                    lng: r.checkOutLng!,
                    label: 'Lokasi check-out',
                    delayMs: 480,
                  ),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  String _faceLabel(VerificationStatus s) => switch (s) {
        VerificationStatus.passed => 'Terverifikasi',
        VerificationStatus.failed => 'Gagal',
        VerificationStatus.pending => 'Menunggu',
        VerificationStatus.notRequired => 'Tidak diperlukan',
      };

  Widget _row(String label, String value) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onSurfaceVariant)),
          Text(value, style: AppTypography.labelMd),
        ],
      );
}

/// Wraps a child with a delayed fade + slide entrance, typed as a plain
/// [Widget] so `.animate()` resolves to the flutter_animate extension method.
class _AnimatedGlass extends StatelessWidget {
  const _AnimatedGlass({required this.child, required this.delayMs});
  final Widget child;
  final int delayMs;

  @override
  Widget build(BuildContext context) {
    return child
        .animate(delay: delayMs.ms)
        .fadeIn(duration: 320.ms)
        .slideY(begin: 0.08, curve: Curves.easeOut);
  }
}

class _StaggeredMetric extends StatelessWidget {
  const _StaggeredMetric({
    required this.index,
    required this.label,
    required this.value,
    required this.color,
  });
  final int index;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: AppTypography.bodyMd
                .copyWith(color: AppColors.onSurfaceVariant)),
        StatusBadge(label: value, color: color),
      ],
    )
        .animate(delay: (260 + 80 * index).ms)
        .fadeIn(duration: 280.ms)
        .slideX(begin: 0.08, curve: Curves.easeOut);
  }
}

/// Coordinate panel — a flat card framing the OpenStreetMap mini-map preview
/// of the recorded check-in / check-out location.
class _MapPlaceholder extends StatelessWidget {
  const _MapPlaceholder({
    required this.lat,
    required this.lng,
    required this.label,
    this.delayMs = 0,
  });
  final double lat;
  final double lng;
  final String label;
  final int delayMs;

  @override
  Widget build(BuildContext context) {
    final Widget card = SolidCard(
      entrance: false,
      padding: EdgeInsets.zero,
      child: SizedBox(
        height: 160,
        child: Stack(
          children: [
            // Real OpenStreetMap preview of the recorded coordinate.
            Positioned.fill(
              child: OsmMiniMap(
                latitude: lat,
                longitude: lng,
                height: 160,
                borderRadius: AppRadius.xl,
              ),
            ),
            // Label chip overlay.
            Positioned(
              left: AppSpacing.sm,
              top: AppSpacing.sm,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.place, color: AppColors.primary, size: 14),
                    const SizedBox(width: 4),
                    Text(label, style: AppTypography.labelSm),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
    return card
        .animate(delay: delayMs.ms)
        .fadeIn(duration: 320.ms)
        .slideY(begin: 0.08, curve: Curves.easeOut);
  }
}
