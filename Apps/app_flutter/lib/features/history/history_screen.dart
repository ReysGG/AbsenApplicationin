import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/status_styles.dart';
import '../../core/widgets/brand_header.dart';
import '../../core/widgets/lottie_icon.dart';
import '../../core/widgets/solid_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../shared/models/attendance_record.dart';
import '../../shared/models/enums.dart';
import 'history_controller.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  AttendanceStatus? _filter;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(historyProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: Column(
        children: [
          const BrandHeader(title: 'Riwayat Presensi'),
          Expanded(
            child: Column(
          children: [
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md, vertical: AppSpacing.md),
              child: Row(
                children: [
                  _FilterChip(
                    label: 'Semua',
                    selected: _filter == null,
                    onTap: () => setState(() => _filter = null),
                  ),
                  for (final s in [
                    AttendanceStatus.present,
                    AttendanceStatus.late,
                    AttendanceStatus.absent,
                  ])
                    _FilterChip(
                      label: s.label,
                      selected: _filter == s,
                      onTap: () => setState(() => _filter = s),
                    ),
                ],
              ),
            ),
            Expanded(
              child: async.when(
                loading: () =>
                    const Center(child: LottieIcon(LottieIcon.loading)),
                error: (e, _) => Center(child: Text(e.toString())),
                data: (records) {
                  final filtered = _filter == null
                      ? records
                      : records.where((r) => r.status == _filter).toList();
                  if (filtered.isEmpty) {
                    return const _EmptyHistory();
                  }
                  return RefreshIndicator(
                    onRefresh: () async => ref.refresh(historyProvider.future),
                    child: ListView.separated(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      itemCount: filtered.length,
                      itemBuilder: (_, i) =>
                          _HistoryCard(record: filtered[i], index: i),
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: AppSpacing.sm),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
          ),
        ],
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.record, required this.index});
  final AttendanceRecord record;
  final int index;

  @override
  Widget build(BuildContext context) {
    final card = SolidCard(
      entrance: false,
      onTap: () => context.push('${AppRoutes.attendanceDetail}?id=${record.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(Formatters.shortDate(record.date),
                  style: AppTypography.labelMd),
              StatusBadge(
                label: record.status.label,
                color: StatusStyles.attendance(record.status),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              _TimeChunk(
                icon: Icons.login,
                label: 'Masuk',
                value: record.checkInAt != null
                    ? Formatters.time(record.checkInAt!)
                    : '—',
              ),
              const SizedBox(width: AppSpacing.lg),
              _TimeChunk(
                icon: Icons.logout,
                label: 'Pulang',
                value: record.checkOutAt != null
                    ? Formatters.time(record.checkOutAt!)
                    : '—',
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Icon(
                record.workMode == WorkMode.wfo
                    ? Icons.business
                    : Icons.home_work_outlined,
                size: 16,
                color: AppColors.onSurfaceVariant,
              ),
              const SizedBox(width: 4),
              Text(
                '${record.workMode.label} · ${record.locationName ?? '-'}',
                style: AppTypography.labelSm.copyWith(
                    color: AppColors.onSurfaceVariant, letterSpacing: 0),
              ),
              const Spacer(),
              if (record.syncStatus != SyncStatus.synced)
                StatusBadge(
                  label: record.syncStatus.label,
                  color: StatusStyles.sync(record.syncStatus),
                  icon: Icons.sync,
                ),
            ],
          ),
        ],
      ),
    );

    // Hero shares the card surface with the detail header.
    final hero = Hero(
      tag: 'attendance-${record.id}',
      // Avoid blur/material artifacts mid-flight.
      flightShuttleBuilder: (_, _, _, _, _) => card,
      child: card,
    );

    return hero
        .animate(delay: (60 * index).ms)
        .fadeIn(duration: 320.ms, curve: Curves.easeOut)
        .slideY(begin: 0.08, curve: Curves.easeOut);
  }
}

class _TimeChunk extends StatelessWidget {
  const _TimeChunk({
    required this.icon,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.onSurfaceVariant),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: AppTypography.labelSm.copyWith(
                    color: AppColors.onSurfaceVariant, letterSpacing: 0)),
            Text(value, style: AppTypography.labelMd),
          ],
        ),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.sm),
      child: AnimatedScale(
        scale: selected ? 1.06 : 1,
        duration: 200.ms,
        curve: Curves.easeOutBack,
        child: ChoiceChip(
          label: Text(label),
          selected: selected,
          onSelected: (_) => onTap(),
          showCheckmark: false,
          selectedColor: AppColors.brandMid,
          backgroundColor: Colors.white,
          side: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.5)),
          labelStyle: AppTypography.labelMd.copyWith(
            color: selected ? Colors.white : AppColors.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

class _EmptyHistory extends StatelessWidget {
  const _EmptyHistory();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const LottieIcon(LottieIcon.empty, size: 160),
          const SizedBox(height: AppSpacing.sm),
          Text('Belum ada riwayat presensi',
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onSurfaceVariant)),
        ],
      ).animate().fadeIn(duration: 360.ms),
    );
  }
}
