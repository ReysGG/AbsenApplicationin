import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_card.dart';
import '../../shared/models/attendance_record.dart';
import '../attendance/checkin_flow_controller.dart';

class CheckinSuccessScreen extends ConsumerWidget {
  const CheckinSuccessScreen({super.key, this.recordId});
  final String? recordId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCheckout =
        ref.read(checkinFlowProvider).kind == CheckFlowKind.checkOut;
    final detailAsync = recordId == null
        ? null
        : ref.watch(_detailProvider(recordId!));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle,
                    color: AppColors.success, size: 64),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                isCheckout ? 'Check-out Berhasil!' : 'Check-in Berhasil!',
                style: AppTypography.display,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Kehadiranmu telah tercatat dengan aman.',
                style: AppTypography.bodyMd
                    .copyWith(color: AppColors.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.lg),
              if (detailAsync != null)
                detailAsync.when(
                  loading: () => const CircularProgressIndicator(),
                  error: (_, _) => const SizedBox.shrink(),
                  data: (r) => _SummaryCard(record: r, isCheckout: isCheckout),
                ),
              const Spacer(),
              FilledButton(
                onPressed: () => context.go(AppRoutes.home),
                style:
                    FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                child: const Text('Kembali ke Beranda'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

final _detailProvider =
    FutureProvider.autoDispose.family<AttendanceRecord, String>((ref, id) {
  return ref.watch(attendanceRepositoryProvider).getDetail(id);
});

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.record, required this.isCheckout});
  final AttendanceRecord record;
  final bool isCheckout;

  @override
  Widget build(BuildContext context) {
    final time = isCheckout ? record.checkOutAt : record.checkInAt;
    return AppCard(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.primaryFixed,
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(isCheckout ? 'Jam Pulang' : 'Jam Masuk',
                    style: AppTypography.labelMd
                        .copyWith(color: AppColors.onPrimaryFixed)),
                Text(time != null ? Formatters.time(time) : '—',
                    style: AppTypography.headlineMd
                        .copyWith(color: AppColors.onPrimaryFixed)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _row('Tanggal', Formatters.shortDate(record.date)),
          const Divider(height: AppSpacing.lg),
          _row('Mode Kerja', record.workMode.label),
          const Divider(height: AppSpacing.lg),
          _row('Lokasi', record.locationName ?? '—'),
          const Divider(height: AppSpacing.lg),
          _row('Status', record.status.label),
        ],
      ),
    );
  }

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
