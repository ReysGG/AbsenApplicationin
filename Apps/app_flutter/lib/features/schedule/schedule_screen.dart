import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../shared/models/enums.dart';
import '../../shared/models/shift.dart';

final _weekProvider = FutureProvider.autoDispose<List<Shift>>((ref) async {
  return ref.watch(scheduleRepositoryProvider).getWeek(DateTime.now());
});

class ScheduleScreen extends ConsumerStatefulWidget {
  const ScheduleScreen({super.key});

  @override
  ConsumerState<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends ConsumerState<ScheduleScreen> {
  int _selectedIndex = DateTime.now().weekday - 1;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_weekProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Jadwal Shift')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (shifts) {
          final selected = shifts[_selectedIndex];
          return Column(
            children: [
              // Calendar ribbon
              SizedBox(
                height: 88,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                  itemCount: shifts.length,
                  itemBuilder: (_, i) => _DayPill(
                    shift: shifts[i],
                    selected: i == _selectedIndex,
                    isToday: _isToday(shifts[i].date),
                    onTap: () => setState(() => _selectedIndex = i),
                  ),
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  children: [
                    Text(Formatters.fullDate(selected.date),
                        style: AppTypography.labelMd
                            .copyWith(color: AppColors.onSurfaceVariant)),
                    const SizedBox(height: AppSpacing.sm),
                    _ShiftDetailCard(shift: selected),
                  ],
                ),
              ),
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
}

class _DayPill extends StatelessWidget {
  const _DayPill({
    required this.shift,
    required this.selected,
    required this.isToday,
    required this.onTap,
  });
  final Shift shift;
  final bool selected;
  final bool isToday;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final bg = selected ? AppColors.primary : AppColors.surface;
    final fg = selected ? AppColors.onPrimary : AppColors.onSurface;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        margin: const EdgeInsets.only(right: AppSpacing.sm),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: isToday && !selected
                ? AppColors.primary
                : AppColors.surfaceContainerHigh,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(Formatters.dayNameShort(shift.date),
                style: AppTypography.labelSm
                    .copyWith(color: fg, letterSpacing: 0)),
            const SizedBox(height: 4),
            Text('${shift.date.day}',
                style: AppTypography.headlineMd.copyWith(color: fg)),
            const SizedBox(height: 4),
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: shift.isDayOff
                    ? AppColors.outline
                    : (shift.workMode == WorkMode.wfo
                        ? AppColors.primary
                        : AppColors.secondary),
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ShiftDetailCard extends StatelessWidget {
  const _ShiftDetailCard({required this.shift});
  final Shift shift;

  @override
  Widget build(BuildContext context) {
    if (shift.isDayOff) {
      return AppCard(
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.surfaceContainerHigh,
              child: const Icon(Icons.weekend_outlined,
                  color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(width: AppSpacing.md),
            Text('Hari Libur', style: AppTypography.headlineMd),
          ],
        ),
      );
    }

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(shift.name, style: AppTypography.headlineMd),
              StatusBadge(
                label: shift.workMode.label,
                color: shift.workMode == WorkMode.wfo
                    ? AppColors.primary
                    : AppColors.secondary,
                icon: shift.workMode == WorkMode.wfo
                    ? Icons.business
                    : Icons.home_work_outlined,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: _timeBox('Jam Masuk', shift.startLabel, Icons.login),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: _timeBox('Jam Pulang', shift.endLabel, Icons.logout),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text('Toleransi keterlambatan: ${shift.gracePeriodMinutes} menit',
              style: AppTypography.labelSm.copyWith(
                  color: AppColors.onSurfaceVariant, letterSpacing: 0)),
        ],
      ),
    );
  }

  Widget _timeBox(String label, String value, IconData icon) => Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(height: AppSpacing.xs),
            Text(label,
                style: AppTypography.labelSm.copyWith(
                    color: AppColors.onSurfaceVariant, letterSpacing: 0)),
            Text(value, style: AppTypography.headlineMd),
          ],
        ),
      );
}
