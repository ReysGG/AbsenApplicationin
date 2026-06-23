import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/brand_header.dart';
import '../../core/widgets/solid_card.dart';
import '../../core/widgets/lottie_icon.dart';
import '../../shared/models/app_notification.dart';
import 'notifications_controller.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsListProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: Column(
        children: [
          BrandHeader(
            title: 'Notifikasi',
            subtitle: 'Pengingat dan status aktivitas Anda',
            trailing: BrandHeaderAction(
              icon: Icons.done_all_rounded,
              onTap: () async {
                await ref.read(notificationRepositoryProvider).markAllRead();
                ref.invalidate(notificationsListProvider);
              },
              tooltip: 'Tandai Semua Dibaca',
            ),
          ),
          Expanded(
            child: async.when(
              loading: () => const Center(
                  child: LottieIcon(LottieIcon.loading, size: 96)),
              error: (e, _) => AppErrorState(
                  onRetry: () => ref.invalidate(notificationsListProvider)),
              data: (items) {
                if (items.isEmpty) {
                  return _EmptyState();
                }
                final today =
                    items.where((n) => _isToday(n.createdAt)).toList();
                final earlier =
                    items.where((n) => !_isToday(n.createdAt)).toList();

                int idx = 0;
                final children = <Widget>[];

                if (today.isNotEmpty) {
                  children.add(_section('Hari Ini'));
                  for (final n in today) {
                    children.add(_NotifCard(
                      notification: n,
                      index: idx++,
                      ref: ref,
                      key: ValueKey(n.id),
                    ));
                  }
                }
                if (earlier.isNotEmpty) {
                  children.add(const SizedBox(height: AppSpacing.md));
                  children.add(_section('Sebelumnya'));
                  for (final n in earlier) {
                    children.add(_NotifCard(
                      notification: n,
                      index: idx++,
                      ref: ref,
                      key: ValueKey(n.id),
                    ));
                  }
                }

                return ListView(
                  padding: const EdgeInsets.fromLTRB(
                      AppSpacing.md, AppSpacing.sm, AppSpacing.md, 110),
                  children: children,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  bool _isToday(DateTime d) {
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }

  static Widget _section(String title) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Text(title,
            style: AppTypography.labelMd
                .copyWith(color: AppColors.onSurfaceVariant)),
      );
}

// ── Empty state ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const LottieIcon(LottieIcon.empty, size: 160),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Tidak ada notifikasi',
            style: AppTypography.bodyMd
                .copyWith(color: AppColors.onSurfaceVariant),
          ).animate().fadeIn(duration: 400.ms, delay: 150.ms),
        ],
      ),
    );
  }
}

// ── Notification card ────────────────────────────────────────────────────────

class _NotifCard extends StatelessWidget {
  const _NotifCard({
    required this.notification,
    required this.index,
    required this.ref,
    super.key,
  });

  final AppNotification notification;
  final int index;
  final WidgetRef ref;

  IconData get _icon => switch (notification.kind) {
        NotificationKind.reminder => Icons.alarm_rounded,
        NotificationKind.approval => Icons.task_alt_rounded,
        NotificationKind.sync => Icons.sync_rounded,
        NotificationKind.info => Icons.info_rounded,
      };

  Color get _color => switch (notification.kind) {
        NotificationKind.reminder => AppColors.pending,
        NotificationKind.approval => AppColors.success,
        NotificationKind.sync => AppColors.primary,
        NotificationKind.info => AppColors.secondary,
      };

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: SolidCard(
        entrance: false,
        color: notification.read
            ? AppColors.surfaceContainerLow
            : AppColors.surface,
        glowColor: notification.read ? null : _color,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Colorful rounded icon container, tinted per kind.
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    _color.withValues(alpha: 0.20),
                    _color.withValues(alpha: 0.08),
                  ],
                ),
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: Icon(_icon, color: _color, size: 20),
            )
                .animate(delay: (70 * index).ms)
                .fadeIn(duration: 250.ms)
                .scaleXY(begin: 0.7, duration: 280.ms, curve: Curves.easeOutBack),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(notification.title,
                            style: AppTypography.labelMd),
                      ),
                      // Unread dot with pulse animation.
                      if (!notification.read)
                        _UnreadDot(),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    notification.body,
                    style: AppTypography.bodyMd
                        .copyWith(color: AppColors.onSurfaceVariant),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    Formatters.time(notification.createdAt),
                    style: AppTypography.labelSm
                        .copyWith(color: AppColors.outline, letterSpacing: 0),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    )
        .animate(delay: (70 * index).ms)
        .fadeIn(duration: 300.ms, curve: Curves.easeOut)
        .slideY(begin: 0.08, duration: 320.ms, curve: Curves.easeOut);
  }
}

// ── Pulsing unread dot ───────────────────────────────────────────────────────

class _UnreadDot extends StatelessWidget {
  const _UnreadDot();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: AppColors.primary,
        shape: BoxShape.circle,
      ),
    )
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .scaleXY(
          begin: 1.0,
          end: 1.45,
          duration: 900.ms,
          curve: Curves.easeInOut,
        )
        .fadeIn(begin: 0.6, duration: 900.ms, curve: Curves.easeInOut);
  }
}
