import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/solid_card.dart';
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
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedDate = _dateOnly(DateTime.now());
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_weekProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: SafeArea(
        child: async.when(
          loading: () => const _ScheduleLoading(),
          error: (e, _) => _ScheduleError(
            message: e.toString(),
            onRetry: () => ref.refresh(_weekProvider),
          ),
          data: _buildContent,
        ),
      ),
    );
  }

  Widget _buildContent(List<Shift> shifts) {
    if (shifts.isEmpty) {
      return _EmptySchedule(onRetry: () => ref.refresh(_weekProvider));
    }

    final selectedIndex = _selectedIndexFor(shifts);
    final selected = shifts[selectedIndex];
    final workDays = shifts.where((e) => !e.isDayOff).length;

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(_weekProvider.future),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          MediaQuery.of(context).padding.bottom + 104,
        ),
        children: [
          _ScheduleHero(
            selected: selected,
            totalDays: shifts.length,
            workDays: workDays,
          ),
          const SizedBox(height: AppSpacing.md),
          _DayRibbon(
            shifts: shifts,
            selectedIndex: selectedIndex,
            onSelected: (shift) {
              setState(() => _selectedDate = _dateOnly(shift.date));
            },
          ),
          const SizedBox(height: AppSpacing.md),
          AnimatedSwitcher(
            duration: 260.ms,
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.04),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
            child: _ShiftDetailCard(
              key: ValueKey(
                '${selected.id}-${selected.date.toIso8601String()}',
              ),
              shift: selected,
            ),
          ),
        ],
      ),
    );
  }

  int _selectedIndexFor(List<Shift> shifts) {
    final explicit = shifts.indexWhere((s) => _sameDay(s.date, _selectedDate));
    if (explicit != -1) return explicit;

    final today = shifts.indexWhere((s) => _isToday(s.date));
    return today == -1 ? 0 : today;
  }
}

class _ScheduleHero extends StatelessWidget {
  const _ScheduleHero({
    required this.selected,
    required this.totalDays,
    required this.workDays,
  });

  final Shift selected;
  final int totalDays;
  final int workDays;

  @override
  Widget build(BuildContext context) {
    return Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.brandMid,
            borderRadius: BorderRadius.circular(AppRadius.xl),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(AppRadius.xl),
                    ),
                    child: Icon(
                      selected.isDayOff
                          ? Icons.weekend_rounded
                          : Icons.calendar_month_rounded,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Jadwal Shift',
                          style: AppTypography.headlineLg.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          _weekRangeLabel(selected.date, totalDays),
                          style: AppTypography.bodySm.copyWith(
                            color: Colors.white.withValues(alpha: 0.82),
                          ),
                        ),
                      ],
                    ),
                  ),
                  _HeroBadge(
                    label: selected.isDayOff
                        ? 'Libur'
                        : selected.workMode.label,
                    icon: selected.isDayOff
                        ? Icons.coffee_rounded
                        : selected.workMode == WorkMode.wfo
                        ? Icons.business_rounded
                        : Icons.home_work_rounded,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: _HeroMetric(value: '$workDays', label: 'Hari kerja'),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _HeroMetric(
                      value: selected.rangeLabel,
                      label: 'Shift dipilih',
                    ),
                  ),
                ],
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 320.ms, curve: Curves.easeOut)
        .slideY(begin: -0.04, duration: 320.ms, curve: Curves.easeOut);
  }
}

class _HeroBadge extends StatelessWidget {
  const _HeroBadge({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTypography.labelSm.copyWith(
              color: Colors.white,
              letterSpacing: 0,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroMetric extends StatelessWidget {
  const _HeroMetric({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.titleLg.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          Text(
            label,
            style: AppTypography.labelSm.copyWith(
              color: Colors.white.withValues(alpha: 0.74),
              letterSpacing: 0,
            ),
          ),
        ],
      ),
    );
  }
}

class _DayRibbon extends StatelessWidget {
  const _DayRibbon({
    required this.shifts,
    required this.selectedIndex,
    required this.onSelected,
  });

  final List<Shift> shifts;
  final int selectedIndex;
  final ValueChanged<Shift> onSelected;

  @override
  Widget build(BuildContext context) {
    return SolidCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
            child: Text(
              'Pilih tanggal',
              style: AppTypography.labelMd.copyWith(
                color: AppColors.onSurface,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            height: 88,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: shifts.length,
              separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
              itemBuilder: (context, i) => _DayPill(
                shift: shifts[i],
                selected: i == selectedIndex,
                isToday: _isToday(shifts[i].date),
                onTap: () => onSelected(shifts[i]),
              ),
            ),
          ),
        ],
      ),
    );
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
    final accent = shift.isDayOff ? AppColors.pending : _modeColor(shift);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: AnimatedContainer(
        duration: 180.ms,
        curve: Curves.easeOut,
        width: 64,
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary
              : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: selected
                ? AppColors.primary
                : isToday
                ? AppColors.primary.withValues(alpha: 0.5)
                : AppColors.outlineVariant,
            width: isToday || selected ? 1.5 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.22),
                    blurRadius: 14,
                    offset: const Offset(0, 8),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              Formatters.dayNameShort(shift.date).toUpperCase(),
              style: AppTypography.labelSm.copyWith(
                color: selected
                    ? AppColors.onPrimary.withValues(alpha: 0.78)
                    : AppColors.onSurfaceVariant,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '${shift.date.day}',
              style: AppTypography.headlineMd.copyWith(
                color: selected ? AppColors.onPrimary : AppColors.onSurface,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: selected ? AppColors.onPrimary : accent,
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
  const _ShiftDetailCard({super.key, required this.shift});

  final Shift shift;

  @override
  Widget build(BuildContext context) {
    if (shift.isDayOff) {
      return _DayOffCard(shift: shift);
    }

    final modeColor = _modeColor(shift);

    return SolidCard(
      entrance: false,
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: modeColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                    ),
                    child: Icon(
                      shift.workMode == WorkMode.wfo
                          ? Icons.business_rounded
                          : Icons.home_work_rounded,
                      color: modeColor,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          shift.name,
                          style: AppTypography.headlineMd.copyWith(
                            color: AppColors.onSurface,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          Formatters.fullDate(shift.date),
                          style: AppTypography.bodySm.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _ModeBadge(shift: shift),
                ],
              ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxWidth < 340;
                  final start = _TimeTile(
                    title: 'Jam Masuk',
                    time: shift.startLabel,
                    icon: Icons.login_rounded,
                    color: AppColors.success,
                  );
                  final end = _TimeTile(
                    title: 'Jam Pulang',
                    time: shift.endLabel,
                    icon: Icons.logout_rounded,
                    color: AppColors.error,
                  );

                  if (compact) {
                    return Column(
                      children: [
                        start,
                        const SizedBox(height: AppSpacing.sm),
                        end,
                      ],
                    );
                  }

                  return Row(
                    children: [
                      Expanded(child: start),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(child: end),
                    ],
                  );
                },
              ),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(AppRadius.xl),
                  bottomRight: Radius.circular(AppRadius.xl),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    size: 18,
                    color: AppColors.onSurfaceVariant,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      shift.workMode == WorkMode.wfo
                          ? 'Absensi WFO wajib berada di lokasi kantor. Toleransi keterlambatan ${shift.gracePeriodMinutes} menit.'
                          : 'Absensi WFH mengikuti lokasi kerja yang disetujui. Toleransi keterlambatan ${shift.gracePeriodMinutes} menit.',
                      style: AppTypography.bodySm.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
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

class _DayOffCard extends StatelessWidget {
  const _DayOffCard({required this.shift});

  final Shift shift;

  @override
  Widget build(BuildContext context) {
    return SolidCard(
      entrance: false,
      child: Column(
        children: [
          Container(
            width: 78,
            height: 78,
            decoration: BoxDecoration(
              color: AppColors.pending.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.weekend_rounded,
              color: AppColors.pending,
              size: 42,
            ),
          ).animate().scaleXY(
            begin: 0.9,
            end: 1,
            duration: 320.ms,
            curve: Curves.easeOutBack,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Hari Libur',
            style: AppTypography.headlineMd.copyWith(
              color: AppColors.onSurface,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            Formatters.fullDate(shift.date),
            style: AppTypography.bodyMd.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Tidak ada shift aktif di tanggal ini. Nikmati waktu istirahatmu.',
            textAlign: TextAlign.center,
            style: AppTypography.bodyMd.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeBadge extends StatelessWidget {
  const _ModeBadge({required this.shift});

  final Shift shift;

  @override
  Widget build(BuildContext context) {
    final color = _modeColor(shift);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            shift.workMode == WorkMode.wfo
                ? Icons.business_rounded
                : Icons.home_work_rounded,
            size: 14,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            shift.workMode.label,
            style: AppTypography.labelSm.copyWith(
              color: color,
              letterSpacing: 0,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _TimeTile extends StatelessWidget {
  const _TimeTile({
    required this.title,
    required this.time,
    required this.icon,
    required this.color,
  });

  final String title;
  final String time;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: color.withValues(alpha: 0.14)),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.labelSm.copyWith(
                    color: AppColors.onSurfaceVariant,
                    letterSpacing: 0,
                  ),
                ),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    time,
                    style: AppTypography.headlineLg.copyWith(
                      color: AppColors.onSurface,
                      fontWeight: FontWeight.w800,
                    ),
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

class _ScheduleLoading extends StatelessWidget {
  const _ScheduleLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        Container(
              height: 174,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(28),
              ),
            )
            .animate(onPlay: (c) => c.repeat(reverse: true))
            .fade(begin: 0.45, end: 1, duration: 700.ms),
        const SizedBox(height: AppSpacing.md),
        Container(
              height: 136,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppRadius.xl),
              ),
            )
            .animate(onPlay: (c) => c.repeat(reverse: true), delay: 80.ms)
            .fade(begin: 0.45, end: 1, duration: 700.ms),
        const SizedBox(height: AppSpacing.md),
        Container(
              height: 260,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppRadius.xl),
              ),
            )
            .animate(onPlay: (c) => c.repeat(reverse: true), delay: 160.ms)
            .fade(begin: 0.45, end: 1, duration: 700.ms),
      ],
    );
  }
}

class _ScheduleError extends StatelessWidget {
  const _ScheduleError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: SolidCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cloud_off_rounded, size: 46, color: AppColors.error),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Gagal memuat shift',
                style: AppTypography.titleLg.copyWith(
                  color: AppColors.onSurface,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                message,
                textAlign: TextAlign.center,
                style: AppTypography.bodyMd.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptySchedule extends StatelessWidget {
  const _EmptySchedule({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.xl,
        AppSpacing.md,
        MediaQuery.of(context).padding.bottom + 104,
      ),
      children: [
        SolidCard(
          child: Column(
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.event_busy_rounded,
                  color: AppColors.primary,
                  size: 38,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Belum ada jadwal shift',
                style: AppTypography.titleLg.copyWith(
                  color: AppColors.onSurface,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Akun ini belum memiliki shift aktif. Hubungi HR/admin untuk penjadwalan.',
                textAlign: TextAlign.center,
                style: AppTypography.bodyMd.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Muat Ulang'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

Color _modeColor(Shift shift) => switch (shift.workMode) {
  WorkMode.wfo => AppColors.success,
  WorkMode.wfh => AppColors.brandMid,
};

DateTime _dateOnly(DateTime date) => DateTime(date.year, date.month, date.day);

bool _sameDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

bool _isToday(DateTime d) => _sameDay(d, DateTime.now());

String _weekRangeLabel(DateTime selected, int totalDays) {
  final start = selected.subtract(Duration(days: selected.weekday - 1));
  final end = start.add(Duration(days: totalDays >= 7 ? 6 : totalDays - 1));
  return '${Formatters.shortDate(start)} - ${Formatters.shortDate(end)}';
}
