import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/aurora_background.dart';
import '../../core/widgets/lottie_icon.dart';
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
        title: Text(
          'Jadwal Shift',
          style: AppTypography.headlineLg.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.onSurface,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
      ),
      body: AuroraBackground(
        child: async.when(
          loading: () => const Center(child: LottieIcon(LottieIcon.loading)),
          error: (e, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline_rounded, color: Colors.red, size: 48),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'Gagal memuat jadwal: ${e.toString()}',
                    textAlign: TextAlign.center,
                    style: AppTypography.bodyMd,
                  ),
                ],
              ),
            ),
          ),
          data: (shifts) {
            if (shifts.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.calendar_today_outlined, color: Colors.grey, size: 48),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'Tidak ada jadwal shift untuk minggu ini.',
                      style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
                    ),
                  ],
                ),
              );
            }
            
            // Safely clamp the selected index to handle dynamic lists
            final index = _selectedIndex.clamp(0, shifts.length - 1);
            final selected = shifts[index];

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date picker ribbon header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
                  child: Text(
                    'Kalender Shift Pekan Ini',
                    style: AppTypography.labelSm.copyWith(
                      color: AppColors.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                
                // Calendar ribbon
                SizedBox(
                  height: 104,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.xs,
                    ),
                    itemCount: shifts.length,
                    itemBuilder: (_, i) => _DayPill(
                      shift: shifts[i],
                      selected: i == index,
                      isToday: _isToday(shifts[i].date),
                      onTap: () => setState(() => _selectedIndex = i),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                Formatters.fullDate(selected.date),
                                style: AppTypography.headlineMd.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.onSurface,
                                ),
                              ),
                              if (_isToday(selected.date))
                                Container(
                                  margin: const EdgeInsets.only(top: 4),
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'Hari Ini',
                                    style: AppTypography.labelSm.copyWith(
                                      color: AppColors.primary,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      
                      // Animated Shift Card
                      AnimatedSwitcher(
                        duration: 300.ms,
                        switchInCurve: Curves.easeOutCubic,
                        switchOutCurve: Curves.easeInCubic,
                        transitionBuilder: (child, anim) => FadeTransition(
                          opacity: anim,
                          child: SlideTransition(
                            position: Tween<Offset>(
                              begin: const Offset(0, 0.05),
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
    
    // Work mode color coding
    final Color dotColor;
    if (shift.isDayOff) {
      dotColor = AppColors.outlineVariant;
    } else {
      dotColor = shift.workMode == WorkMode.wfo 
          ? const Color(0xFF10B981) // Crisp modern green
          : AppColors.primary;      // Clean primary blue
    }

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: 200.ms,
        curve: Curves.easeOut,
        width: 62,
        margin: const EdgeInsets.only(right: AppSpacing.sm),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          gradient: selected
              ? LinearGradient(
                  colors: [
                    AppColors.primary,
                    AppColors.primary.withValues(alpha: 0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: selected ? null : AppColors.surfaceContainerLow,
          border: Border.all(
            color: selected
                ? Colors.transparent
                : (isToday ? AppColors.primary.withValues(alpha: 0.5) : AppColors.outline.withValues(alpha: 0.15)),
            width: isToday && !selected ? 1.5 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              Formatters.dayNameShort(shift.date).toUpperCase(),
              style: AppTypography.labelSm.copyWith(
                color: selected 
                    ? AppColors.onPrimary.withValues(alpha: 0.8) 
                    : AppColors.onSurfaceVariant,
                fontSize: 10,
                letterSpacing: 0.5,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${shift.date.day}',
              style: AppTypography.headlineMd.copyWith(
                color: fg,
                fontWeight: FontWeight.bold,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 6),
            
            // Mode Indicator Badge
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: selected ? Colors.white : dotColor,
                shape: BoxShape.circle,
                border: selected
                    ? null
                    : Border.all(
                        color: Colors.white,
                        width: 1,
                      ),
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
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 32),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(AppRadius.xl),
          border: Border.all(
            color: AppColors.outline.withValues(alpha: 0.08),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.06),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.weekend_rounded,
                color: AppColors.primary,
                size: 56,
              ),
            )
                .animate()
                .scaleXY(begin: 0.9, end: 1.0, duration: 400.ms, curve: Curves.easeOutBack),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Hari Libur',
              style: AppTypography.headlineLg.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.onSurface,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Waktunya istirahat! Nikmati hari liburmu untuk menyegarkan pikiran dan isi ulang energimu.',
              textAlign: TextAlign.center,
              style: AppTypography.bodyMd.copyWith(
                color: AppColors.onSurfaceVariant,
                height: 1.5,
              ),
            ),
          ],
        ),
      );
    }

    final isWFO = shift.workMode == WorkMode.wfo;
    final badgeColor = isWFO ? const Color(0xFF10B981) : AppColors.primary;
    final badgeBg = badgeColor.withValues(alpha: 0.08);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(
          color: AppColors.outline.withValues(alpha: 0.08),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        shift.name,
                        style: AppTypography.headlineMd.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Jadwal Kerja Normal',
                        style: AppTypography.labelSm.copyWith(
                          color: AppColors.onSurfaceVariant,
                          fontWeight: FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                    border: Border.all(
                      color: badgeColor.withValues(alpha: 0.15),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isWFO ? Icons.business_rounded : Icons.home_work_rounded,
                        size: 14,
                        color: badgeColor,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        shift.workMode.label,
                        style: AppTypography.labelSm.copyWith(
                          color: badgeColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1, thickness: 1),
          
          // Timeline Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.xl),
            child: Row(
              children: [
                // Check in
                Expanded(
                  child: _timelineItem(
                    title: 'Jam Masuk',
                    time: shift.startLabel,
                    icon: Icons.login_rounded,
                    accentColor: const Color(0xFF10B981),
                  ),
                ),
                
                // Connection indicator
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                  child: Container(
                    width: 32,
                    height: 2,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF10B981).withValues(alpha: 0.4),
                          AppColors.error.withValues(alpha: 0.4),
                        ],
                      ),
                    ),
                  ),
                ),
                
                // Check out
                Expanded(
                  child: _timelineItem(
                    title: 'Jam Pulang',
                    time: shift.endLabel,
                    icon: Icons.logout_rounded,
                    accentColor: AppColors.error,
                  ),
                ),
              ],
            ),
          ),
          
          // Policy / Details Banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainer,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(AppRadius.xl),
                bottomRight: Radius.circular(AppRadius.xl),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.info_outline_rounded,
                      size: 16,
                      color: AppColors.onSurfaceVariant,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Kebijakan Kehadiran:',
                        style: AppTypography.labelSm.copyWith(
                          color: AppColors.onSurface,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.only(left: 24),
                  child: Text(
                    isWFO 
                      ? 'Absensi WFO wajib dilakukan di lingkungan kantor dengan toleransi keterlambatan ${shift.gracePeriodMinutes} menit.'
                      : 'Absensi WFH dapat dilakukan dari rumah/luar kantor dengan toleransi keterlambatan ${shift.gracePeriodMinutes} menit.',
                    style: AppTypography.labelSm.copyWith(
                      color: AppColors.onSurfaceVariant,
                      fontWeight: FontWeight.normal,
                      height: 1.4,
                      fontSize: 11,
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

  Widget _timelineItem({
    required String title,
    required String time,
    required IconData icon,
    required Color accentColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: AppColors.outline.withValues(alpha: 0.06),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 14, color: accentColor),
              ),
              const SizedBox(width: 6),
              Text(
                title,
                style: AppTypography.labelSm.copyWith(
                  color: AppColors.onSurfaceVariant,
                  fontSize: 11,
                  fontWeight: FontWeight.normal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            time,
            style: AppTypography.display.copyWith(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.onSurface,
              height: 1.1,
            ),
          ),
        ],
      ),
    );
  }
}
