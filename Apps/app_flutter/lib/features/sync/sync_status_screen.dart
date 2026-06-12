import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/animated_entrance.dart';
import '../../core/widgets/aurora_background.dart';
import '../../core/widgets/glass_card.dart';
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
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.xl),
            children: [
              // ── Status card ─────────────────────────────────────────────
              AnimatedEntrance(
                child: GlassCard(
                animate: false,
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
                    onPressed: () =>
                        ref.read(syncQueueProvider.notifier).syncNow(),
                    icon: const Icon(Icons.sync),
                    label: const Text('Sinkronkan Sekarang'),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
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
                  icon: Icons.inbox_outlined,
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
    final icon = widget.synced ? Icons.cloud_done : Icons.cloud_sync;

    Widget glyph = Icon(icon, color: color);
    if (widget.syncing) {
      // Continuous rotation while syncing.
      glyph = RotationTransition(turns: _spin, child: glyph);
    }

    return CircleAvatar(
      radius: 24,
      backgroundColor: color.withValues(alpha: 0.12),
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
    Widget leading = Icon(Icons.fingerprint, color: _statusColor);
    if (isSyncing) {
      // Gentle pulse on the queue item that's actively syncing.
      leading = leading
          .animate(onPlay: (c) => c.repeat(reverse: true))
          .scaleXY(begin: 0.9, end: 1.1, duration: 700.ms, curve: Curves.easeInOut);
    }

    return AnimatedEntrance(
      delay: (70 * index).ms,
      slideBegin: 0.08,
      child: GlassCard(
      animate: false,
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
      child: GlassCard(
      animate: false,
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
