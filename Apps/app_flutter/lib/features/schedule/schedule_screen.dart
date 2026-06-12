import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/aurora_background.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/lottie_icon.dart';
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
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Jadwal Shift'),
        backgroundColor: Colors.transparent,
      ),
      body: AuroraBackground(
        child: async.when(
          loading: () => const Center(child: LottieIcon(LottieIcon.loading)),
          error: (e, _) => Center(child: Text(e.toString())),
          data: (shifts) {
            final selected = shifts[_selectedIndex];
            return Column(
              children: [
                // Calendar ribbon
                SizedBox(
                  height: 96,
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
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    children: [
                      Text(Formatters.fullDate(selected.date),
                          style: AppTypography.labelMd
                              .copyWith(color: AppColors.onSurfaceVariant)),
                      const SizedBox(height: AppSpacing.sm),
                      // Re-animates whenever the selected day changes.
                      AnimatedSwitcher(
                        duration: 320.ms,
                        switchInCurve: Curves.easeOut,
                        switchOutCurve: Curves.easeIn,
                        transitionBuilder: (child, anim) => FadeTransition(
                          opacity: anim,
                          child: SlideTransition(
                            position: Tween<Offset>(
                              begin: const Offset(0, 0.06),
                              end: Offset.zero,
                            ).animate(anim),
                            child: child,
                          ),
                        ),
                        child: _ShiftDetailCard(
                          key: ValueKey(selected.date),
                          shift: selected,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
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
    final fg = selected ? AppColors.onPrimary : AppColors.onSurface;
    final dotColor = shift.isDayOff
        ? AppColors.outline
        : (shift.workMode == WorkMode.wfo
            ? AppColors.primary
            : AppColors.secondary);

    Widget pill = AnimatedScale(
      scale: selected ? 1.08 : 1,
      duration: 240.ms,
      curve: Curves.easeOutBack,
      child: AnimatedContainer(
        duration: 240.ms,
        curve: Curves.easeOut,
        width: 56,
        margin: const EdgeInsets.only(right: AppSpacing.sm),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.glassFill,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: isToday && !selected
                ? AppColors.primary
                : AppColors.glassBorderSoft,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppColors.glassShadow,
                    blurRadius: 16,
                    offset: Offset(0, 6),
                  ),
                ]
              : null,
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
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );

    // Subtle pulse on today's pill to draw the eye.
    if (isToday) {
      pill = pill
          .animate(onPlay: (c) => c.repeat(reverse: true))
          .scaleXY(
            begin: 1,
            end: 1.04,
            duration: 1100.ms,
            curve: Curves.easeInOut,
          );
    }

    return GestureDetector(onTap: onTap, child: pill);
  }
}

class _ShiftDetailCard extends StatelessWidget {
  const _ShiftDetailCard({super.key, required this.shift});
  final Shift shift;

  @override
  Widget build(BuildContext context) {
    if (shift.isDayOff) {
      return GlassCard(
        animate: false,
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.surfaceContainerHigh
                  .withValues(alpha: 0.6),
              child: Icon(Icons.weekend_outlined,
                  color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(width: AppSpacing.md),
            Text('Hari Libur', style: AppTypography.headlineMd),
          ],
        ),
      );
    }

    return GlassCard(
      animate: false,
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
          color: AppColors.surfaceContainerLow.withValues(alpha: 0.6),
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
