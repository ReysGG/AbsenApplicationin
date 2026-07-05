import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/animated_entrance.dart';
import '../../core/widgets/page_background.dart';
import '../../core/widgets/solid_card.dart';
import '../../core/widgets/lottie_icon.dart';
import '../../core/widgets/pressable.dart';
import '../../core/widgets/status_badge.dart';
import '../../shared/models/enums.dart';
import 'sync_controller.dart';

class SyncStatusScreen extends ConsumerWidget {
  const SyncStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final queue = ref.watch(syncQueueProvider);
    final pending = queue.where((e) => e.status != SyncStatus.synced).length;
    final syncing = queue.any((e) => e.status == SyncStatus.syncing);
    final allSynced = queue.isNotEmpty && pending == 0;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Sinkronisasi Offline'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: PageBackground(
        child: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.xl),
            children: [
              // ── Status card ─────────────────────────────────────────────
              AnimatedEntrance(
                child: SolidCard(
                  entrance: false,
                  glowColor: pending == 0 ? AppColors.success : AppColors.pending,
                  child: Row(
                    children: [
                      _StatusIcon(synced: pending == 0, syncing: syncing),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              pending == 0
                                  ? 'Semua data tersinkron'
                                  : '$pending data menunggu sinkronisasi',
                              style: AppTypography.labelMd,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Data absen offline otomatis terkirim saat koneksi tersedia.',
                              style: AppTypography.bodyMd
                                  .copyWith(color: AppColors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),

              // ── Sync now button ─────────────────────────────────────────
              if (pending > 0)
                Pressable(
                  child: FilledButton.icon(
                    onPressed: syncing
                        ? null
                        : () => ref.read(syncQueueProvider.notifier).syncNow(),
                    icon: syncing
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.sync_rounded),
                    label: Text(syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.xl),
                      ),
                    ),
                  ),
                )
                    .animate()
                    .fadeIn(duration: 300.ms, delay: 80.ms)
                    .slideY(begin: 0.1, duration: 320.ms, curve: Curves.easeOut),
              if (pending > 0) const SizedBox(height: AppSpacing.md),

              Text('Antrian', style: AppTypography.labelMd),
              const SizedBox(height: AppSpacing.sm),

              // ── Queue / empty / all-synced ──────────────────────────────
              if (queue.isEmpty)
                _CalmEmpty(
                  icon: Icons.inbox_rounded,
                  message: 'Tidak ada antrian sinkronisasi',
                )
              else if (allSynced)
                _AllSyncedState()
              else
                ...[
                  for (var i = 0; i < queue.length; i++)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: _QueueCard(item: queue[i], index: i),
                    ),
                ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Animated status icon (rotates/pulses while syncing) ──────────────────────

class _StatusIcon extends StatefulWidget {
  const _StatusIcon({required this.synced, required this.syncing});
  final bool synced;
  final bool syncing;

  @override
  State<_StatusIcon> createState() => _StatusIconState();
}

class _StatusIconState extends State<_StatusIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _spin;

  @override
  void initState() {
    super.initState();
    _spin = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _sync();
  }

  @override
  void didUpdateWidget(covariant _StatusIcon old) {
    super.didUpdateWidget(old);
    if (old.syncing != widget.syncing) _sync();
  }

  void _sync() {
    if (widget.syncing) {
      _spin.repeat();
    } else {
      _spin.stop();
      _spin.value = 0;
    }
  }

  @override
  void dispose() {
    _spin.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.synced ? AppColors.success : AppColors.pending;
    final icon =
        widget.synced ? Icons.cloud_done_rounded : Icons.cloud_sync_rounded;

    Widget glyph = Icon(icon, color: color, size: 24);
    if (widget.syncing) {
      // Continuous rotation while syncing.
      glyph = RotationTransition(turns: _spin, child: glyph);
    }

    // Colorful rounded-square container (Modern Playful).
    return Container(
      width: 48,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            color.withValues(alpha: 0.20),
            color.withValues(alpha: 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: glyph,
    );
  }
}

// ── Queue card ───────────────────────────────────────────────────────────────

class _QueueCard extends StatelessWidget {
  const _QueueCard({required this.item, required this.index});
  final SyncItem item;
  final int index;

  Color get _statusColor => switch (item.status) {
        SyncStatus.synced => AppColors.success,
        SyncStatus.pending => AppColors.pending,
        SyncStatus.syncing => AppColors.primary,
        SyncStatus.failed => AppColors.error,
      };

  @override
  Widget build(BuildContext context) {
    final isSyncing = item.status == SyncStatus.syncing;

    Widget leading = Container(
      width: 44,
      height: 44,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            _statusColor.withValues(alpha: 0.20),
            _statusColor.withValues(alpha: 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Icon(Icons.fingerprint_rounded, color: _statusColor, size: 22),
    );
    if (isSyncing) {
      // Gentle pulse on the queue item that's actively syncing.
      leading = leading
          .animate(onPlay: (c) => c.repeat(reverse: true))
          .scaleXY(begin: 0.9, end: 1.06, duration: 700.ms, curve: Curves.easeInOut);
    }

    return AnimatedEntrance(
      delay: (70 * index).ms,
      slideBegin: 0.08,
      child: SolidCard(
        entrance: false,
        child: Row(
          children: [
            leading,
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.label, style: AppTypography.labelMd),
                  Text(item.detail,
                      style: AppTypography.bodyMd
                          .copyWith(color: AppColors.onSurfaceVariant)),
                ],
              ),
            ),
            StatusBadge(label: item.status.label, color: _statusColor),
          ],
        ),
      ),
    );
  }
}

// ── All-synced satisfying state ──────────────────────────────────────────────

class _AllSyncedState extends StatelessWidget {
  const _AllSyncedState();

  @override
  Widget build(BuildContext context) {
    return AnimatedEntrance(
      duration: 360.ms,
      child: SolidCard(
        entrance: false,
        glowColor: AppColors.success,
        child: Column(
          children: [
            const LottieIcon(LottieIcon.success, size: 120, repeat: false),
            Text(
              'Semua data sudah tersinkron',
              style: AppTypography.labelMd,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Tidak ada yang menunggu dikirim.',
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Calm empty state ─────────────────────────────────────────────────────────

class _CalmEmpty extends StatelessWidget {
  const _CalmEmpty({required this.icon, required this.message});
  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: AppColors.outline)
                .animate()
                .fadeIn(duration: 360.ms)
                .scaleXY(begin: 0.8, duration: 380.ms, curve: Curves.easeOutBack),
            const SizedBox(height: AppSpacing.sm),
            Text(message,
                style: AppTypography.bodyMd
                    .copyWith(color: AppColors.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }
}
