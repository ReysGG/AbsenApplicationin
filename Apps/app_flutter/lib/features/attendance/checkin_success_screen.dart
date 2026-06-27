import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/page_background.dart';
import '../../core/widgets/pressable.dart';
import '../../core/widgets/solid_card.dart';
import '../../core/widgets/lottie_icon.dart';
import '../../shared/models/attendance_record.dart';
import '../../shared/models/enums.dart';
import '../history/history_controller.dart';
import '../home/home_controller.dart';
import '../attendance/checkin_flow_controller.dart';

class CheckinSuccessScreen extends ConsumerStatefulWidget {
  const CheckinSuccessScreen({super.key, this.recordId});
  final String? recordId;

  @override
  ConsumerState<CheckinSuccessScreen> createState() =>
      _CheckinSuccessScreenState();
}

class _CheckinSuccessScreenState extends ConsumerState<CheckinSuccessScreen> {
  @override
  void initState() {
    super.initState();
    // Reaching this screen means a check-in/out was just recorded. The home
    // dashboard and history live underneath in a still-alive IndexedStack, so
    // their cached providers must be invalidated now — otherwise the home keeps
    // showing the stale "Belum Check-in" state and never flips to the
    // check-out action after a successful check-in.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.invalidate(homeDataProvider);
      ref.invalidate(historyProvider);
    });
  }

  @override
  Widget build(BuildContext context) {
    final recordId = widget.recordId;
    final isCheckout =
        ref.read(checkinFlowProvider).kind == CheckFlowKind.checkOut;
    final detailAsync = recordId == null
        ? null
        : ref.watch(_detailProvider(recordId));

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: PageBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              children: [
                const Spacer(),
                // Celebration checkmark — plays once, large + centered,
                // resting on a soft colored glow (Modern Playful).
                SizedBox(
                  width: 180,
                  height: 180,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Soft success glow behind the Lottie.
                      Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              AppColors.success.withValues(alpha: 0.26),
                              AppColors.success.withValues(alpha: 0.0),
                            ],
                          ),
                        ),
                      )
                          .animate()
                          .fadeIn(duration: 600.ms)
                          .scaleXY(begin: 0.6, end: 1, duration: 700.ms),
                      const LottieIcon(
                        LottieIcon.success,
                        size: 160,
                        repeat: false,
                      ),
                    ],
                  ),
                )
                    .animate()
                    .scaleXY(
                      begin: 0.5,
                      end: 1,
                      duration: 520.ms,
                      curve: Curves.elasticOut,
                    )
                    .fadeIn(duration: 240.ms),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  isCheckout ? 'Check-out Berhasil!' : 'Check-in Berhasil!',
                  style: AppTypography.display,
                  textAlign: TextAlign.center,
                )
                    .animate(delay: 360.ms)
                    .fadeIn(duration: 300.ms)
                    .scaleXY(begin: 0.92, end: 1, curve: Curves.easeOutBack),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Kehadiranmu telah tercatat dengan aman.',
                  style: AppTypography.bodyMd
                      .copyWith(color: AppColors.onSurfaceVariant),
                  textAlign: TextAlign.center,
                ).animate(delay: 480.ms).fadeIn(duration: 320.ms).slideY(
                      begin: 0.2,
                      curve: Curves.easeOut,
                    ),
                const SizedBox(height: AppSpacing.lg),
                if (detailAsync != null)
                  detailAsync.when(
                    loading: () => const SizedBox.shrink(),
                    error: (_, _) => const SizedBox.shrink(),
                    data: (r) => _SummaryCard(record: r, isCheckout: isCheckout),
                  ),
                const Spacer(),
                Pressable(
                  child: FilledButton(
                    onPressed: () => context.go(AppRoutes.home),
                    style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(52)),
                    child: const Text('Kembali ke Beranda'),
                  ),
                ).animate(delay: 620.ms).fadeIn(duration: 320.ms).slideY(
                      begin: 0.3,
                      curve: Curves.easeOut,
                    ),
              ],
            ),
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
    final Widget card = SolidCard(
      entrance: false,
      glowColor: AppColors.primary,
      child: Column(
        children: [
          // Hero time chip with a playful brand gradient.
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: AppColors.headerGradient,
              ),
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(isCheckout ? 'Jam Pulang' : 'Jam Masuk',
                    style: AppTypography.labelMd
                        .copyWith(color: Colors.white)),
                Text(time != null ? Formatters.time(time) : '—',
                    style: AppTypography.headlineMd
                        .copyWith(color: Colors.white)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _row(Icons.event_rounded, AppColors.accentViolet, 'Tanggal',
              Formatters.shortDate(record.date)),
          const Divider(height: AppSpacing.lg),
          _row(
              record.workMode == WorkMode.wfo
                  ? Icons.business_rounded
                  : Icons.home_work_rounded,
              AppColors.accentCyan,
              'Mode Kerja',
              record.workMode.label),
          const Divider(height: AppSpacing.lg),
          _row(Icons.place_rounded, AppColors.accentRose, 'Lokasi',
              record.locationName ?? '—'),
          const Divider(height: AppSpacing.lg),
          _row(Icons.verified_rounded, AppColors.success, 'Status',
              record.status.label),
        ],
      ),
    );
    return card.animate(delay: 560.ms).fadeIn(duration: 360.ms).slideY(
          begin: 0.18,
          curve: Curves.easeOut,
        );
  }

  Widget _row(IconData icon, Color tint, String label, String value) => Row(
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  tint.withValues(alpha: 0.18),
                  tint.withValues(alpha: 0.08),
                ],
              ),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(icon, size: 17, color: tint),
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(label,
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onSurfaceVariant)),
          const Spacer(),
          Flexible(
            child: Text(value,
                textAlign: TextAlign.right, style: AppTypography.labelMd),
          ),
        ],
      );
}
