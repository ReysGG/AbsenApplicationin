import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/page_background.dart';
import '../../core/widgets/solid_card.dart';
import '../../shared/models/enums.dart';
import 'checkin_flow_controller.dart';

/// Step 1 of the attendance flow: choose work mode + review prerequisites
/// (GPS, Face, Liveness) before starting verification.
class CheckinPrepScreen extends ConsumerStatefulWidget {
  const CheckinPrepScreen({
    super.key,
    this.isCheckout = false,
    this.checkInModeName,
  });

  /// When true this screen drives a CHECK-OUT (reusing the check-in work mode)
  /// instead of a check-in.
  final bool isCheckout;

  /// Work mode chosen at check-in ('wfo'/'wfh'), reused for check-out so the
  /// user isn't asked WFO/WFH again. Null for check-in.
  final String? checkInModeName;

  @override
  ConsumerState<CheckinPrepScreen> createState() => _CheckinPrepScreenState();
}

class _CheckinPrepScreenState extends ConsumerState<CheckinPrepScreen> {
  @override
  void initState() {
    super.initState();
    // Reset flow when entering. Default check-in.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final notifier = ref.read(checkinFlowProvider.notifier);
      notifier.start(
          widget.isCheckout ? CheckFlowKind.checkOut : CheckFlowKind.checkIn);
      // Check-out reuses the work mode chosen at check-in (don't re-ask).
      if (widget.isCheckout && widget.checkInModeName != null) {
        notifier.setWorkMode(
            widget.checkInModeName == 'wfh' ? WorkMode.wfh : WorkMode.wfo);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final flow = ref.watch(checkinFlowProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: Text(
            widget.isCheckout ? 'Persiapan Check-out' : 'Persiapan Check-in'),
        backgroundColor: Colors.transparent,
      ),
      body: PageBackground(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            // Work mode selector
            SolidCard(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md, vertical: AppSpacing.sm + 2),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Mode Kerja',
                      style: AppTypography.labelMd
                          .copyWith(color: AppColors.onSurfaceVariant)),
                  if (widget.isCheckout)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          flow.workMode == WorkMode.wfo
                              ? Icons.business
                              : Icons.home_work_outlined,
                          size: 18,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          flow.workMode == WorkMode.wfo ? 'WFO' : 'WFH',
                          style: AppTypography.labelMd
                              .copyWith(color: AppColors.onSurface),
                        ),
                      ],
                    )
                  else
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
                  )
                      // Springy pop when the selection changes.
                      .animate(target: flow.workMode == WorkMode.wfh ? 1 : 0)
                      .scaleXY(
                        begin: 1,
                        end: 1.04,
                        duration: 180.ms,
                        curve: Curves.easeOut,
                      )
                      .then()
                      .scaleXY(end: 1 / 1.04, duration: 160.ms),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            // WFH banner slides + fades in when the mode switches on.
            AnimatedSize(
              duration: 280.ms,
              curve: Curves.easeOut,
              alignment: Alignment.topCenter,
              child: flow.workMode == WorkMode.wfh
                  ? Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: const _InfoBanner(
                        icon: Icons.info_outline,
                        text:
                            'Mode WFH: validasi GPS dinonaktifkan, verifikasi wajah tetap aktif.',
                      )
                          .animate()
                          .fadeIn(duration: 260.ms, curve: Curves.easeOut)
                          .slideY(begin: -0.18, curve: Curves.easeOut),
                    )
                  : const SizedBox(width: double.infinity),
            ),
            const SizedBox(height: AppSpacing.md),

            Text('Prasyarat Verifikasi', style: AppTypography.labelMd)
                .animate()
                .fadeIn(duration: 280.ms),
            const SizedBox(height: AppSpacing.sm),
            _PrereqCard(
              index: 0,
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
              index: 1,
              icon: Icons.face_outlined,
              title: 'Validasi Wajah',
              subtitle: 'Pemindaian wajah real-time',
              done: flow.faceVerified,
              enabled: true,
            ),
            const SizedBox(height: AppSpacing.sm),
            _PrereqCard(
              index: 2,
              icon: Icons.visibility_outlined,
              title: 'Liveness Check',
              subtitle: 'Kedip / gerakkan kepala (anti foto statis)',
              done: flow.livenessPassed,
              enabled: true,
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: _PressableButton(
            onPressed: () {
              // WFO → verify location first; WFH → skip straight to face.
              if (flow.requiresGps) {
                context.push(AppRoutes.locationValidation);
              } else {
                context.push(AppRoutes.faceVerification);
              }
            },
            icon: Icons.arrow_forward,
            label: flow.requiresGps
                ? 'Mulai Validasi Lokasi'
                : 'Mulai Verifikasi Wajah',
          ),
        ),
      ),
    );
  }
}

class _PrereqCard extends StatelessWidget {
  const _PrereqCard({
    required this.index,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.done,
    required this.enabled,
  });

  final int index;
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
    // Typed as Widget so `.animate()` resolves to the flutter_animate
    // extension method.
    final Widget card = SolidCard(
      entrance: false,
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: color.withValues(alpha: 0.1),
            // Bounce-in the check glyph when the prereq becomes ready.
            child: Icon(done ? Icons.check : icon, color: color)
                .animate(target: done ? 1 : 0)
                .scaleXY(
                  begin: 0.6,
                  end: 1,
                  duration: 320.ms,
                  curve: Curves.elasticOut,
                ),
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
            Icon(Icons.check_circle, color: AppColors.success)
                .animate(target: done ? 1 : 0)
                .scaleXY(
                  begin: 0.4,
                  end: 1,
                  duration: 360.ms,
                  curve: Curves.elasticOut,
                )
                .fadeIn(duration: 200.ms)
          else if (enabled)
            Icon(Icons.radio_button_unchecked,
                color: AppColors.outline),
        ],
      ),
    );

    // Staggered entrance for the prereq list.
    return card
        .animate(delay: (120 + 80 * index).ms)
        .fadeIn(duration: 320.ms, curve: Curves.easeOut)
        .slideY(begin: 0.08, curve: Curves.easeOut);
  }
}

/// Filled button that scales down briefly while pressed.
class _PressableButton extends StatefulWidget {
  const _PressableButton({
    required this.onPressed,
    required this.icon,
    required this.label,
  });
  final VoidCallback onPressed;
  final IconData icon;
  final String label;

  @override
  State<_PressableButton> createState() => _PressableButtonState();
}

class _PressableButtonState extends State<_PressableButton> {
  bool _pressed = false;

  void _setPressed(bool v) {
    if (_pressed != v) setState(() => _pressed = v);
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _setPressed(true),
      onPointerUp: (_) => _setPressed(false),
      onPointerCancel: (_) => _setPressed(false),
      child: AnimatedScale(
        scale: _pressed ? 0.96 : 1,
        duration: 120.ms,
        curve: Curves.easeOut,
        child: FilledButton.icon(
          onPressed: widget.onPressed,
          icon: Icon(widget.icon),
          label: Text(widget.label),
          style: FilledButton.styleFrom(
            minimumSize: const Size.fromHeight(52),
          ),
        ),
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
