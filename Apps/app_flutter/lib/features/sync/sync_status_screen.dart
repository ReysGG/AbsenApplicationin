import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../shared/models/enums.dart';
import 'sync_controller.dart';

class SyncStatusScreen extends ConsumerWidget {
  const SyncStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final queue = ref.watch(syncQueueProvider);
    final pending = queue.where((e) => e.status != SyncStatus.synced).length;

    return Scaffold(
      appBar: AppBar(title: const Text('Sinkronisasi Offline')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          AppCard(
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: (pending == 0
                          ? AppColors.success
                          : AppColors.pending)
                      .withValues(alpha: 0.12),
                  child: Icon(
                    pending == 0 ? Icons.cloud_done : Icons.cloud_sync,
                    color:
                        pending == 0 ? AppColors.success : AppColors.pending,
                  ),
                ),
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
          const SizedBox(height: AppSpacing.md),
          if (pending > 0)
            FilledButton.icon(
              onPressed: () =>
                  ref.read(syncQueueProvider.notifier).syncNow(),
              icon: const Icon(Icons.sync),
              label: const Text('Sinkronkan Sekarang'),
              style:
                  FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            ),
          const SizedBox(height: AppSpacing.md),
          Text('Antrian', style: AppTypography.labelMd),
          const SizedBox(height: AppSpacing.sm),
          if (queue.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text('Tidak ada antrian sinkronisasi',
                    style: AppTypography.bodyMd
                        .copyWith(color: AppColors.onSurfaceVariant)),
              ),
            )
          else
            ...queue.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: AppCard(
                    child: Row(
                      children: [
                        const Icon(Icons.fingerprint,
                            color: AppColors.onSurfaceVariant),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.label, style: AppTypography.labelMd),
                              Text(item.detail,
                                  style: AppTypography.bodyMd.copyWith(
                                      color: AppColors.onSurfaceVariant)),
                            ],
                          ),
                        ),
                        StatusBadge(
                          label: item.status.label,
                          color: switch (item.status) {
                            SyncStatus.synced => AppColors.success,
                            SyncStatus.pending => AppColors.pending,
                            SyncStatus.syncing => AppColors.primary,
                            SyncStatus.failed => AppColors.error,
                          },
                        ),
                      ],
                    ),
                  ),
                )),
        ],
      ),
    );
  }
}
