import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/solid_card.dart';
import '../../shared/models/enums.dart';
import '../../shared/models/shift.dart';
import '../auth/auth_controller.dart';
import 'home_controller.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authProfileProvider);
    final homeAsync = ref.watch(homeDataProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(homeDataProvider.future),
        child: CustomScrollView(
          slivers: [
            // ── Brand header band ───────────────────────────────────────
            SliverToBoxAdapter(
              child: _MinuteTicker(
                builder: (context, now) => _BrandHeader(
                  now: now,
                  firstName: profile?.firstName ?? '',
                  initial: profile?.firstName.characters.first ?? 'A',
                  onBell: () => context.push(AppRoutes.notifications),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.md,
                AppSpacing.md,
                120, // Extra space so content isn't hidden under floating bottom bar
              ),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (profile?.faceEnrolled == false) ...[
                    _FaceEnrollBanner(
                      onTap: () => context.push(AppRoutes.faceEnroll),
                    ),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  _MinuteTicker(
                    builder: (context, now) =>
                        _ClockShiftCard(now: now, sh: _shiftOf(homeAsync)),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  homeAsync.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Center(child: _HomeLoader()),
                    ),
                    error: (e, _) => _ErrorState(
                      message: e.toString(),
                      onRetry: () => ref.refresh(homeDataProvider),
                    ),
                    data: (data) => _AttendanceActionCard(today: data.today),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _SectionLabel('Layanan Mandiri'),
                  const SizedBox(height: AppSpacing.sm),
                  _QuickGrid(),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Shift? _shiftOf(AsyncValue homeAsync) =>
      homeAsync.maybeWhen(data: (d) => d.shift as Shift?, orElse: () => null);
}

// ── Brand header band ──────────────────────────────────────────────────────
class _MinuteTicker extends StatefulWidget {
  const _MinuteTicker({required this.builder});

  final Widget Function(BuildContext context, DateTime now) builder;

  @override
  State<_MinuteTicker> createState() => _MinuteTickerState();
}

class _MinuteTickerState extends State<_MinuteTicker> {
  Timer? _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _scheduleNextMinute();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _scheduleNextMinute() {
    final now = DateTime.now();
    final delay = Duration(
      minutes: 1,
      seconds: -now.second,
      milliseconds: -now.millisecond,
      microseconds: -now.microsecond,
    );

    _timer = Timer(delay, () {
      if (!mounted) return;
      setState(() => _now = DateTime.now());
      _timer = Timer.periodic(const Duration(minutes: 1), (_) {
        if (mounted) setState(() => _now = DateTime.now());
      });
    });
  }

  @override
  Widget build(BuildContext context) => widget.builder(context, _now);
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader({
    required this.now,
    required this.firstName,
    required this.initial,
    required this.onBell,
  });

  final DateTime now;
  final String firstName;
  final String initial;
  final VoidCallback onBell;

  String _motivasi(DateTime now) {
    final h = now.hour;
    if (h < 10) return 'Selamat pagi, semangat! ☀️';
    if (h < 15) return 'Semangat bekerja hari ini! 👋';
    if (h < 18) return 'Tetap semangat sore ini! 💪';
    return 'Istirahat yang baik ya! 🌙';
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    // Split into static decoration (cached) + dynamic content (rebuilds on minute tick).
    return RepaintBoundary(
      child: Container(
        clipBehavior: Clip.hardEdge,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: AppColors.brandGradient,
          ),
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(32),
            bottomRight: Radius.circular(32),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.brandEnd.withValues(
                alpha: AppColors.isDark ? 0.35 : 0.22,
              ),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Stack(
          children: [
            // ── Decorative blobs (static — repaint boundary isolates) ───
            Positioned(
              right: -30,
              top: -20,
              child: RepaintBoundary(
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.07),
                  ),
                ),
              ),
            ),
            Positioned(
              right: 30,
              top: 30,
              child: RepaintBoundary(
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
              ),
            ),
            // ── Dynamic content ───────────────────────────────────────────
            Padding(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.md,
                top + AppSpacing.md,
                AppSpacing.md,
                AppSpacing.lg,
              ),
              child: Row(
                children: [
                  // Avatar circle
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.45),
                        width: 2,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      initial,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 22,
                        fontFamily: AppTypography.fontFamily,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${Formatters.greeting(now)},',
                          style: AppTypography.bodySm.copyWith(
                            color: Colors.white.withValues(alpha: 0.78),
                          ),
                        ),
                        Text(
                          firstName.isEmpty ? 'Karyawan' : firstName,
                          style: AppTypography.headlineMd.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _motivasi(now),
                          style: AppTypography.bodySm.copyWith(
                            color: Colors.white.withValues(alpha: 0.65),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _IconBubble(
                    icon: Icons.notifications_none_rounded,
                    onTap: onBell,
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

class _IconBubble extends StatelessWidget {
  const _IconBubble({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.18),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Badge(
            smallSize: 8,
            child: Icon(icon, color: Colors.white, size: 22),
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: AppTypography.labelMd.copyWith(
        color: AppColors.onSurface,
        fontWeight: FontWeight.w800,
      ),
    ).animate(delay: 280.ms).fadeIn(duration: 320.ms);
  }
}

class _HomeLoader extends StatelessWidget {
  const _HomeLoader();

  @override
  Widget build(BuildContext context) {
    Widget dot(int i) =>
        Container(
              width: 10,
              height: 10,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            )
            .animate(
              onPlay: (c) => c.repeat(reverse: true),
              delay: (i * 180).ms,
            )
            .scaleXY(
              begin: 0.6,
              end: 1.0,
              duration: 500.ms,
              curve: Curves.easeInOut,
            )
            .fadeIn(duration: 500.ms);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [dot(0), dot(1), dot(2)],
    );
  }
}

// ── Clock & Shift Card (Stacked & Overlapped layout) ──────────────────────
class _ClockShiftCard extends StatelessWidget {
  const _ClockShiftCard({required this.now, required this.sh});
  final DateTime now;
  final Shift? sh;

  static const _purple = Color(0xFF3B2E8C);

  @override
  Widget build(BuildContext context) {
    final clockColor = AppColors.isDark ? AppColors.primary : _purple;
    return SolidCard(
          entrance: false,
          padding: EdgeInsets.zero,
          child: Stack(
            clipBehavior: Clip.none,
            // Stack contains the base static Column of texts and divider,
            // and overlays the character illustration globally at the bottom right.
            // This allows the character to draw ON TOP of the divider (Canva overlay).
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Clock Text Container (Left)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.md,
                      AppSpacing.md,
                      130, // Avoid overlapping the character on the right
                      AppSpacing.md,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: clockColor.withValues(alpha: 0.14),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.access_time_rounded,
                                size: 20,
                                color: clockColor,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              Formatters.time(now),
                              style: AppTypography.display.copyWith(
                                fontSize: 40,
                                fontWeight: FontWeight.w800,
                                height: 1.0,
                                letterSpacing: 0,
                                color: clockColor,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        // Aligning "Waktu Lokal" exactly under the start of time text
                        Padding(
                          padding: const EdgeInsets.only(
                            left: 50,
                          ), // 40 (icon width) + 10 (spacing)
                          child: Text(
                            'Waktu Lokal (WIB)',
                            style: AppTypography.bodySm.copyWith(
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Divider (drawn under the clock info)
                  const Divider(height: 1),

                  // Shift info row at the bottom
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.md,
                      AppSpacing.sm + 2,
                      AppSpacing.md,
                      AppSpacing.sm + 2,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: clockColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(
                                  AppRadius.md,
                                ),
                              ),
                              child: Icon(
                                Icons.calendar_today_rounded,
                                size: 16,
                                color: clockColor,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Shift Hari Ini',
                                  style: AppTypography.labelSm.copyWith(
                                    color: AppColors.onSurfaceVariant,
                                    letterSpacing: 0,
                                  ),
                                ),
                                Text(
                                  sh?.rangeLabel ?? 'Tidak ada shift',
                                  style: AppTypography.labelMd.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.onSurface,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        if (sh != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: clockColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(
                                AppRadius.full,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  sh!.workMode == WorkMode.wfo
                                      ? Icons.business_rounded
                                      : Icons.home_work_rounded,
                                  size: 13,
                                  color: clockColor,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  sh!.workMode.label,
                                  style: AppTypography.labelSm.copyWith(
                                    color: clockColor,
                                    letterSpacing: 0,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),

              // Character illustration overlay: Sits on the bottom-right corner,
              // overlapping the divider and drawing ON TOP values (Canva layer)
              Positioned(
                right: 12,
                bottom:
                    40, // sit right on top of the shift section divider boundary
                child: Image.asset(
                  'assets/images/clock_character.webp',
                  width: 110,
                  fit: BoxFit.contain,
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 360.ms, delay: 120.ms)
        .slideY(begin: 0.08, curve: Curves.easeOut);
  }
}

// ── Attendance Action Card (Stacked & Overlapped layout) ──────────────────
class _AttendanceActionCard extends StatelessWidget {
  const _AttendanceActionCard({required this.today});
  final dynamic today;

  static const _purple = Color(0xFF3B2E8C);

  @override
  Widget build(BuildContext context) {
    final hasCheckedIn = today.hasCheckedIn as bool;
    final hasCheckedOut = today.hasCheckedOut as bool;
    final isDark = AppColors.isDark;
    final completedColor = isDark ? AppColors.primary : _purple;

    final (statusColor, statusText, hint) = switch ((
      hasCheckedIn,
      hasCheckedOut,
    )) {
      (false, _) => (
        AppColors.primary,
        'Belum Check-in',
        'Jangan lupa absen sebelum jam masuk',
      ),
      (true, false) => (
        AppColors.success,
        'Sudah Check-in',
        'Selamat bekerja! Jangan lupa check-out nanti',
      ),
      (true, true) => (
        completedColor,
        'Absensi Selesai',
        'Kamu sudah check-in & check-out hari ini',
      ),
    };

    return SolidCard(
          entrance: false,
          padding: EdgeInsets.zero,
          gradient: isDark
              ? const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF151527), Color(0xFF10101C)],
                )
              : null,
          child: Stack(
            clipBehavior: Clip.none,
            // Stack manages top column texts and divider/button layouts,
            // and overlays the door illustration at the bottom right.
            // This aligns the door to overlap and sit on the button boundary box.
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Info (Left)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.md,
                      AppSpacing.md,
                      100, // Prevent overlap
                      AppSpacing.md,
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Large fingerprint icon container
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                statusColor.withValues(alpha: 0.18),
                                statusColor.withValues(alpha: 0.06),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(AppRadius.xl),
                          ),
                          child: Icon(
                            hasCheckedOut
                                ? Icons.check_circle_rounded
                                : hasCheckedIn
                                ? Icons.work_history_rounded
                                : Icons.fingerprint_rounded,
                            color: statusColor,
                            size: 30,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                statusText,
                                style: AppTypography.titleLg.copyWith(
                                  color: statusColor,
                                  fontWeight: FontWeight.w800,
                                  height: 1.1,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                hint,
                                style: AppTypography.bodySm.copyWith(
                                  color: AppColors.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Action button section at the bottom (has whitespace/divider)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.md,
                      0,
                      AppSpacing.md,
                      AppSpacing.md,
                    ),
                    child: hasCheckedOut
                        ? OutlinedButton.icon(
                            onPressed: null,
                            icon: const Icon(
                              Icons.check_circle_outline_rounded,
                            ),
                            label: const Text('Absensi Hari Ini Selesai'),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size.fromHeight(54),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                  AppRadius.xl,
                                ),
                              ),
                            ),
                          )
                        : !hasCheckedIn
                        ? _HeroActionButton(
                            glow: true,
                            onPressed: () =>
                                context.push(AppRoutes.checkinPrep),
                            icon: Icons.login_rounded,
                            label: 'Check-in Sekarang',
                            reserveArtworkSpace: true,
                          )
                        : _HeroActionButton(
                            glow: false,
                            onPressed: () => context.push(
                              '${AppRoutes.checkinPrep}?mode=checkout'
                              '&wm=${today.checkIn?.workMode?.name ?? "wfo"}',
                            ),
                            icon: Icons.logout_rounded,
                            label: 'Check-out Sekarang',
                            reserveArtworkSpace: true,
                          ),
                  ),
                ],
              ),

              // Door illustration alignment: sits flat at the bottom-right over the button row boundary
              if (!hasCheckedOut)
                Positioned(
                  right: 10,
                  bottom: 13,
                  child: Image.asset(
                    'assets/images/checkin_door.webp',
                    width: 112,
                    fit: BoxFit.contain,
                  ),
                ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 360.ms, delay: 200.ms)
        .slideY(begin: 0.08, curve: Curves.easeOut);
  }
}

class _HeroActionButton extends StatefulWidget {
  const _HeroActionButton({
    required this.onPressed,
    required this.icon,
    required this.label,
    required this.glow,
    this.reserveArtworkSpace = false,
  });

  final VoidCallback onPressed;
  final IconData icon;
  final String label;
  final bool glow;
  final bool reserveArtworkSpace;

  @override
  State<_HeroActionButton> createState() => _HeroActionButtonState();
}

class _HeroActionButtonState extends State<_HeroActionButton> {
  double _scale = 1.0;

  static const _purple = Color(0xFF3B2E8C);
  static const _purpleLight = Color(0xFF5B3FBF);

  @override
  Widget build(BuildContext context) {
    final isCheckOut = widget.icon == Icons.logout_rounded;
    final Color buttonColor = isCheckOut ? AppColors.accentRose : _purple;

    return Listener(
      onPointerDown: (_) => setState(() => _scale = 0.96),
      onPointerUp: (_) => setState(() => _scale = 1.0),
      onPointerCancel: (_) => setState(() => _scale = 1.0),
      child: AnimatedScale(
        scale: _scale,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: Container(
          width: double.infinity,
          height: 54,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.xl),
            gradient: isCheckOut
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: AppColors.accentGradient(buttonColor),
                  )
                : const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [_purpleLight, _purple],
                  ),
            boxShadow: widget.glow
                ? [
                    BoxShadow(
                      color: buttonColor.withValues(alpha: 0.38),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                      spreadRadius: -4,
                    ),
                  ]
                : null,
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: widget.onPressed,
              borderRadius: BorderRadius.circular(AppRadius.xl),
              child: Padding(
                padding: EdgeInsets.only(
                  left: widget.reserveArtworkSpace ? 42 : 0,
                  right: widget.reserveArtworkSpace ? 112 : 0,
                ),
                child: Row(
                  mainAxisAlignment: widget.reserveArtworkSpace
                      ? MainAxisAlignment.start
                      : MainAxisAlignment.center,
                  children: [
                    Icon(widget.icon, color: Colors.white, size: 20),
                    const SizedBox(width: AppSpacing.sm),
                    Flexible(
                      child: Text(
                        widget.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.bodyLg.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _QuickGrid extends StatelessWidget {
  const _QuickGrid();

  @override
  Widget build(BuildContext context) {
    final items = [
      (
        Icons.edit_calendar_rounded,
        'Ajukan Cuti',
        AppColors.accentViolet,
        AppRoutes.createLeave,
        true,
      ),
      (
        Icons.event_busy_rounded,
        'Status Cuti',
        AppColors.accentCyan,
        AppRoutes.leave,
        false,
      ),
      (
        Icons.calendar_month_rounded,
        'Jadwal',
        AppColors.accentGreen,
        AppRoutes.schedule,
        false,
      ),
      (
        Icons.history_rounded,
        'Riwayat',
        AppColors.primary,
        AppRoutes.history,
        false,
      ),
    ];

    return SolidCard(
          entrance: false,
          padding: const EdgeInsets.symmetric(
            vertical: AppSpacing.md,
            horizontal: AppSpacing.sm,
          ),
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++)
                Expanded(
                  child: _QuickItem(
                    index: i,
                    icon: items[i].$1,
                    label: items[i].$2,
                    color: items[i].$3,
                    onTap: () => items[i].$5
                        ? context.push(items[i].$4)
                        : context.go(items[i].$4),
                  ),
                ),
            ],
          ),
        )
        .animate(delay: 320.ms)
        .fadeIn(duration: 320.ms)
        .slideY(begin: 0.1, curve: Curves.easeOut);
  }
}

class _QuickItem extends StatefulWidget {
  const _QuickItem({
    required this.index,
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final int index;
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  State<_QuickItem> createState() => _QuickItemState();
}

class _QuickItemState extends State<_QuickItem> {
  double _scale = 1.0;

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => setState(() => _scale = 0.9),
      onPointerUp: (_) => setState(() => _scale = 1.0),
      onPointerCancel: (_) => setState(() => _scale = 1.0),
      child: AnimatedScale(
        scale: _scale,
        duration: const Duration(milliseconds: 120),
        child: InkWell(
          onTap: widget.onTap,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        widget.color.withValues(alpha: 0.20),
                        widget.color.withValues(alpha: 0.08),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                  child: Icon(widget.icon, color: widget.color, size: 24),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.label,
                  style: AppTypography.labelSm.copyWith(
                    color: AppColors.onSurface,
                    letterSpacing: 0,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Column(
        children: [
          Icon(Icons.cloud_off_rounded, size: 40, color: AppColors.outline),
          const SizedBox(height: AppSpacing.sm),
          Text(
            message,
            textAlign: TextAlign.center,
            style: AppTypography.bodyMd.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          FilledButton(onPressed: onRetry, child: const Text('Coba Lagi')),
        ],
      ),
    );
  }
}

// ── Face Enroll Banner (Clean 3D Alarm Clock Placement) ──────────────────
class _FaceEnrollBanner extends StatelessWidget {
  const _FaceEnrollBanner({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SolidCard(
      entrance: false,
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Row(
        children: [
          // Left 3D Alarm Clock image (Image #7)
          Container(
            width: 80,
            height: 80,
            margin: const EdgeInsets.all(AppSpacing.md),
            child: Image.asset(
              'assets/images/alarm_clock.webp',
              fit: BoxFit.contain,
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Daftarkan wajahmu',
                    style: AppTypography.titleLg.copyWith(
                      color: AppColors.onSurface,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Wajib sebelum bisa absen.\nHanya butuh beberapa detik.',
                    style: AppTypography.bodySm.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
