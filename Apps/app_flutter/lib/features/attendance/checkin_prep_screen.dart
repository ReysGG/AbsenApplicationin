import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/app_card.dart';
import '../../shared/models/enums.dart';
import 'checkin_flow_controller.dart';

/// Step 1 of the attendance flow: choose work mode + review prerequisites
/// (GPS, Face, Liveness) before starting verification.
class CheckinPrepScreen extends ConsumerStatefulWidget {
  const CheckinPrepScreen({super.key});

  @override
  ConsumerState<CheckinPrepScreen> createState() => _CheckinPrepScreenState();
}

class _CheckinPrepScreenState extends ConsumerState<CheckinPrepScreen> {
  @override
  void initState() {
    super.initState();
    // Reset flow when entering. Default check-in.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(checkinFlowProvider.notifier).start(CheckFlowKind.checkIn);
    });
  }

  @override
  Widget build(BuildContext context) {
    final flow = ref.watch(checkinFlowProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Persiapan Check-in')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          // Work mode selector
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Mode Kerja',
                  style: AppTypography.labelMd
                      .copyWith(color: AppColors.onSurfaceVariant)),
              SegmentedButton<WorkMode>(
                segments: const [
                  ButtonSegment(
                    value: WorkMode.wfo,
                    label: Text('WFO'),
                    icon: Icon(Icons.business, size: 18),
                  ),
                  ButtonSegment(
                    value: WorkMode.wfh,
                    label: Text('WFH'),
                    icon: Icon(Icons.home_work_outlined, size: 18),
                  ),
                ],
                selected: {flow.workMode},
                onSelectionChanged: (s) => ref
                    .read(checkinFlowProvider.notifier)
                    .setWorkMode(s.first),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          if (flow.workMode == WorkMode.wfh)
            _InfoBanner(
              icon: Icons.info_outline,
              text:
                  'Mode WFH: validasi GPS dinonaktifkan, verifikasi wajah tetap aktif.',
            ),
          const SizedBox(height: AppSpacing.lg),

          Text('Prasyarat Verifikasi', style: AppTypography.labelMd),
          const SizedBox(height: AppSpacing.sm),
          _PrereqCard(
            icon: Icons.location_on_outlined,
            title: 'Validasi Lokasi (GPS)',
            subtitle: flow.requiresGps
                ? 'Pastikan kamu berada di radius lokasi kerja'
                : 'Tidak diperlukan untuk WFH',
            done: flow.locationVerified || !flow.requiresGps,
            enabled: flow.requiresGps,
          ),
          const SizedBox(height: AppSpacing.sm),
          _PrereqCard(
            icon: Icons.face_outlined,
            title: 'Validasi Wajah',
            subtitle: 'Pemindaian wajah real-time',
            done: flow.faceVerified,
            enabled: true,
          ),
          const SizedBox(height: AppSpacing.sm),
          _PrereqCard(
            icon: Icons.visibility_outlined,
            title: 'Liveness Check',
            subtitle: 'Kedip / gerakkan kepala (anti foto statis)',
            done: flow.livenessPassed,
            enabled: true,
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: FilledButton.icon(
            onPressed: () {
              // WFO → verify location first; WFH → skip straight to face.
              if (flow.requiresGps) {
                context.push(AppRoutes.locationValidation);
              } else {
                context.push(AppRoutes.faceVerification);
              }
            },
            icon: const Icon(Icons.arrow_forward),
            label: Text(flow.requiresGps
                ? 'Mulai Validasi Lokasi'
                : 'Mulai Verifikasi Wajah'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
          ),
        ),
      ),
    );
  }
}

class _PrereqCard extends StatelessWidget {
  const _PrereqCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.done,
    required this.enabled,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool done;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final color = !enabled
        ? AppColors.outline
        : (done ? AppColors.success : AppColors.pending);
    return AppCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: color.withValues(alpha: 0.1),
            child: Icon(done ? Icons.check : icon, color: color),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.labelMd),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: AppTypography.bodyMd
                        .copyWith(color: AppColors.onSurfaceVariant)),
              ],
            ),
          ),
          if (done)
            const Icon(Icons.check_circle, color: AppColors.success)
          else if (enabled)
            const Icon(Icons.radio_button_unchecked, color: AppColors.outline),
        ],
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm + 2),
      decoration: BoxDecoration(
        color: AppColors.secondaryFixed,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.secondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(text,
                style: AppTypography.bodyMd.copyWith(color: AppColors.onSurface)),
          ),
        ],
      ),
    );
  }
}
