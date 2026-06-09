import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/status_styles.dart';
import '../../core/widgets/app_card.dart';
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
      appBar: AppBar(title: const Text('Detail Presensi')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (r) => ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
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
            const SizedBox(height: AppSpacing.md),

            // Time & shift overview
            AppCard(
              child: Column(
                children: [
                  _row('Shift', r.shiftName),
                  const Divider(height: AppSpacing.lg),
                  _row('Jam Masuk',
                      r.checkInAt != null ? Formatters.time(r.checkInAt!) : '—'),
                  const Divider(height: AppSpacing.lg),
                  _row('Jam Pulang',
                      r.checkOutAt != null ? Formatters.time(r.checkOutAt!) : '—'),
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
            const SizedBox(height: AppSpacing.md),

            // Validation & metrics
            Text('Validasi & Metrik', style: AppTypography.labelMd),
            const SizedBox(height: AppSpacing.sm),
            AppCard(
              child: Column(
                children: [
                  _metric('Mode Kerja', r.workMode.label,
                      color: StatusStyles.workMode(r.workMode)),
                  const Divider(height: AppSpacing.lg),
                  _metric(
                    'Validasi Lokasi',
                    r.geofenceValid ? 'Valid' : 'Di luar radius',
                    color: r.geofenceValid ? AppColors.success : AppColors.error,
                  ),
                  const Divider(height: AppSpacing.lg),
                  _metric(
                    'Validasi Wajah',
                    _faceLabel(r.faceStatus),
                    color: r.faceStatus == VerificationStatus.passed
                        ? AppColors.success
                        : AppColors.pending,
                  ),
                  const Divider(height: AppSpacing.lg),
                  _metric('Status Sinkronisasi', r.syncStatus.label,
                      color: StatusStyles.sync(r.syncStatus)),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            if (r.checkInLat != null) ...[
              Text('Lokasi Check-in', style: AppTypography.labelMd),
              const SizedBox(height: AppSpacing.sm),
              _MapPlaceholder(
                lat: r.checkInLat!,
                lng: r.checkInLng!,
                label: r.locationName ?? 'Lokasi check-in',
              ),
            ],
            if (r.checkOutLat != null) ...[
              const SizedBox(height: AppSpacing.md),
              Text('Lokasi Check-out', style: AppTypography.labelMd),
              const SizedBox(height: AppSpacing.sm),
              _MapPlaceholder(
                lat: r.checkOutLat!,
                lng: r.checkOutLng!,
                label: 'Lokasi check-out',
              ),
            ],
          ],
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

  Widget _metric(String label, String value, {required Color color}) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onSurfaceVariant)),
          StatusBadge(label: value, color: color),
        ],
      );
}

/// Simple coordinate placeholder. Replaced by an interactive OSM map
/// (flutter_map) in Fase 3 when the maps dependency lands.
class _MapPlaceholder extends StatelessWidget {
  const _MapPlaceholder({
    required this.lat,
    required this.lng,
    required this.label,
  });
  final double lat;
  final double lng;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 140,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.surfaceContainerHigh),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.place, color: AppColors.primary, size: 32),
          const SizedBox(height: AppSpacing.xs),
          Text(label, style: AppTypography.labelMd),
          Text('${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}',
              style: AppTypography.labelSm
                  .copyWith(color: AppColors.onSurfaceVariant, letterSpacing: 0)),
        ],
      ),
    );
  }
}
