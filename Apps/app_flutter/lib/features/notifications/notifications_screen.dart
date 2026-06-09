import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_card.dart';
import '../../shared/models/app_notification.dart';

final _notifProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) async {
  return ref.watch(notificationRepositoryProvider).getAll();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_notifProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifikasi'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(notificationRepositoryProvider).markAllRead();
              ref.invalidate(_notifProvider);
            },
            child: const Text('Tandai dibaca'),
          ),
        ],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Text('Tidak ada notifikasi',
                  style: AppTypography.bodyMd
                      .copyWith(color: AppColors.onSurfaceVariant)),
            );
          }
          final today = items.where((n) => _isToday(n.createdAt)).toList();
          final earlier = items.where((n) => !_isToday(n.createdAt)).toList();
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.md),
            children: [
              if (today.isNotEmpty) ...[
                _section('Hari Ini'),
                ...today.map((n) => _NotifCard(notification: n, ref: ref)),
              ],
              if (earlier.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.md),
                _section('Sebelumnya'),
                ...earlier.map((n) => _NotifCard(notification: n, ref: ref)),
              ],
            ],
          );
        },
      ),
    );
  }

  bool _isToday(DateTime d) {
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }

  Widget _section(String title) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Text(title,
            style: AppTypography.labelMd
                .copyWith(color: AppColors.onSurfaceVariant)),
      );
}

class _NotifCard extends StatelessWidget {
  const _NotifCard({required this.notification, required this.ref});
  final AppNotification notification;
  final WidgetRef ref;

  IconData get _icon => switch (notification.kind) {
        NotificationKind.reminder => Icons.alarm,
        NotificationKind.approval => Icons.task_alt,
        NotificationKind.sync => Icons.sync,
        NotificationKind.info => Icons.info_outline,
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
      child: AppCard(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: _color.withValues(alpha: 0.1),
              child: Icon(_icon, color: _color, size: 20),
            ),
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
                      if (!notification.read)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(notification.body,
                      style: AppTypography.bodyMd
                          .copyWith(color: AppColors.onSurfaceVariant)),
                  const SizedBox(height: 4),
                  Text(Formatters.time(notification.createdAt),
                      style: AppTypography.labelSm.copyWith(
                          color: AppColors.outline, letterSpacing: 0)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
