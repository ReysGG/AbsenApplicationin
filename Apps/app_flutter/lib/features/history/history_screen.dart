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
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/brand_header.dart';
import '../../core/widgets/lottie_icon.dart';
import '../../core/widgets/page_background.dart';
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
      body: PageBackground(
        child: Column(
          children: [
            // Compact BrandHeader matching Image #16 style
            BrandHeader(
              title: 'Riwayat Presensi',
              subtitle: 'Pantau kehadiran dan aktivitas Anda',
              trailing: BrandHeaderAction(
                icon: Icons.calendar_month_rounded,
                onTap: () {},
                tooltip: 'Kalender',
              ),
            ),
            Expanded(
              child: Column(
                children: [
                  _HistoryFilterBar(
                    filter: _filter,
                    onChanged: (value) => setState(() => _filter = value),
                  ),
                  Expanded(
                    child: async.when(
                      loading: () =>
                          const Center(child: LottieIcon(LottieIcon.loading)),
                      error: (e, _) => AppErrorState(
                        onRetry: () => ref.invalidate(historyProvider),
                      ),
                      data: (records) {
                        final filtered = _filter == null
                            ? records
                            : records
                                  .where((r) => r.status == _filter)
                                  .toList();
                        if (filtered.isEmpty) {
                          return const _EmptyHistory();
                        }
                        return RefreshIndicator(
                          onRefresh: () async =>
                              ref.refresh(historyProvider.future),
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(
                              AppSpacing.md,
                              AppSpacing.xs,
                              AppSpacing.md,
                              110, // Avoid bottom bar clipping
                            ),
                            itemCount: filtered.length,
                            itemBuilder: (_, i) =>
                                _HistoryCard(record: filtered[i], index: i),
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: AppSpacing.sm + 2),
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
      onTap: () =>
          context.push('${AppRoutes.attendanceDetail}?id=${record.id}'),
      gradient: AppColors.isDark
          ? const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1A1B2F), Color(0xFF151625)],
            )
          : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                Formatters.shortDate(record.date),
                style: AppTypography.labelMd.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.onSurface,
                ),
              ),
              StatusBadge(
                label: record.status.label,
                color: StatusStyles.attendance(record.status),
                filled:
                    record.status == AttendanceStatus.late ||
                    record.status == AttendanceStatus.absent,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              _TimeChunk(
                icon: Icons.login_rounded,
                tint: AppColors.success,
                label: 'Masuk',
                value: record.checkInAt != null
                    ? Formatters.time(record.checkInAt!)
                    : '—',
              ),
              const SizedBox(width: AppSpacing.lg + 8),
              _TimeChunk(
                icon: Icons.logout_rounded,
                tint: AppColors.accentRose,
                label: 'Pulang',
                value: record.checkOutAt != null
                    ? Formatters.time(record.checkOutAt!)
                    : '—',
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Icon(
                record.workMode == WorkMode.wfo
                    ? Icons.business_rounded
                    : Icons.home_work_rounded,
                size: 16,
                color: AppColors.onSurfaceVariant,
              ),
              const SizedBox(width: 6),
              Text(
                '${record.workMode.label} · ${record.locationName ?? '-'}',
                style: AppTypography.labelSm.copyWith(
                  color: AppColors.onSurfaceVariant,
                  letterSpacing: 0,
                  fontWeight: FontWeight.w600,
                ),
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

    final hero = Hero(
      tag: 'attendance-${record.id}',
      flightShuttleBuilder: (_, _, _, _, _) => card,
      child: card,
    );

    return hero
        .animate(delay: (40 * index.clamp(0, 4)).ms)
        .fadeIn(duration: 320.ms, curve: Curves.easeOut)
        .slideY(begin: 0.08, curve: Curves.easeOut);
  }
}

class _TimeChunk extends StatelessWidget {
  const _TimeChunk({
    required this.icon,
    required this.label,
    required this.value,
    required this.tint,
  });
  final IconData icon;
  final String label;
  final String value;
  final Color tint;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                tint.withValues(alpha: 0.18),
                tint.withValues(alpha: 0.08),
              ],
            ),
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          child: Icon(icon, size: 18, color: tint),
        ),
        const SizedBox(width: AppSpacing.sm),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: AppTypography.labelSm.copyWith(
                color: AppColors.onSurfaceVariant,
                letterSpacing: 0,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 1),
            Text(
              value,
              style: AppTypography.labelMd.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ── Filter Chip conforming to Image #14 ──────────────────────────────────
class _HistoryFilterBar extends StatelessWidget {
  const _HistoryFilterBar({required this.filter, required this.onChanged});

  final AttendanceStatus? filter;
  final ValueChanged<AttendanceStatus?> onChanged;

  @override
  Widget build(BuildContext context) {
    final items = [
      (null, 'Semua', Icons.grid_view_rounded),
      (AttendanceStatus.present, 'Hadir', Icons.check_circle_outline_rounded),
      (AttendanceStatus.late, 'Telat', Icons.access_time_rounded),
      (AttendanceStatus.absent, 'Absen', Icons.cancel_outlined),
    ];

    return SizedBox(
      height: 72,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.sm,
        ),
        itemBuilder: (context, index) {
          final item = items[index];
          return _FilterChip(
            label: item.$2,
            icon: item.$3,
            selected: filter == item.$1,
            onTap: () => onChanged(item.$1),
          );
        },
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemCount: items.length,
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: 180.ms,
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
        decoration: BoxDecoration(
          gradient: selected
              ? LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: AppColors.navActiveGradient,
                )
              : null,
          color: selected
              ? null
              : AppColors.surface.withValues(
                  alpha: AppColors.isDark ? 0.78 : 1,
                ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? Colors.white.withValues(alpha: 0.10)
                : AppColors.cardBorder,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppColors.softGlow(AppColors.primary),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                    spreadRadius: -8,
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: selected
                  ? Colors.white
                  : AppColors.onSurfaceVariant.withValues(alpha: 0.88),
            ),
            const SizedBox(width: 7),
            Text(
              label,
              style: AppTypography.labelMd.copyWith(
                color: selected
                    ? Colors.white
                    : AppColors.onSurfaceVariant.withValues(alpha: 0.92),
                fontWeight: selected ? FontWeight.w800 : FontWeight.w700,
              ),
            ),
          ],
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
          Text(
            'Belum ada riwayat presensi',
            style: AppTypography.bodyMd.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ).animate().fadeIn(duration: 360.ms),
    );
  }
}
