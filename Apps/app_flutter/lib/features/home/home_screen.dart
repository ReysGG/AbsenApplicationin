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
import '../../shared/models/shift.dart';
import '../auth/auth_controller.dart';
import 'home_controller.dart';

/// Home dashboard — clean, structured layout:
///   header → "Waktu Saat Ini" card → "Status Hari Ini" card → Layanan Mandiri.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authProfileProvider);
    final homeAsync = ref.watch(homeDataProvider);
    final fullName = profile?.firstName ?? '';
    final initial = fullName.isNotEmpty ? fullName.characters.first : 'A';

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(homeDataProvider.future),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            _Header(
              firstName: fullName,
              initial: initial,
              onBell: () => context.push(AppRoutes.notifications),
            ),
            Transform.translate(
              offset: const Offset(0, -24),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.md,
                  0,
                  AppSpacing.md,
                  120,
                ),
                child: Column(
                  children: [
                    if (profile?.faceEnrolled == false) ...[
                      _FaceEnrollBanner(
                        onTap: () => context.push(AppRoutes.faceEnroll),
                      ),
                      const SizedBox(height: AppSpacing.md),
                    ],
                    _MinuteTicker(
                      builder: (context, now) => _TimeCard(
                        now: now,
                        shift: homeAsync.maybeWhen(
                          data: (d) => d.shift,
                          orElse: () => null,
                        ),
                        status: _statusOf(homeAsync),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    homeAsync.when(
                      loading: () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                      error: (e, _) => _ErrorState(
                        message: e.toString(),
                        onRetry: () => ref.refresh(homeDataProvider),
                      ),
                      data: (data) =>
                          _StatusCard(today: data.today, shift: data.shift),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    _ServicesSection(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// (hasCheckedIn, hasCheckedOut) → null while loading/error.
  _AttendanceStatus? _statusOf(AsyncValue<HomeData> async) {
    return async.maybeWhen(
      data: (d) => _statusFor(d.today.hasCheckedIn, d.today.hasCheckedOut),
      orElse: () => null,
    );
  }
}

// ── Shared status model ──────────────────────────────────────────────────────

class _AttendanceStatus {
  const _AttendanceStatus({
    required this.color,
    required this.label,
    required this.hint,
    required this.icon,
    required this.done,
  });
  final Color color;
  final String label;
  final String hint;
  final IconData icon;
  final bool done;
}

_AttendanceStatus _statusFor(bool hasIn, bool hasOut) {
  if (!hasIn) {
    return _AttendanceStatus(
      color: AppColors.error,
      label: 'Belum Check-in',
      hint: 'Jangan lupa absen sebelum jam masuk',
      icon: Icons.fingerprint_rounded,
      done: false,
    );
  }
  if (!hasOut) {
    return _AttendanceStatus(
      color: AppColors.success,
      label: 'Sudah Check-in',
      hint: 'Selamat bekerja! Jangan lupa check-out nanti',
      icon: Icons.work_history_rounded,
      done: false,
    );
  }
  return _AttendanceStatus(
    color: AppColors.primary,
    label: 'Absensi Selesai',
    hint: 'Kamu sudah check-in & check-out hari ini',
    icon: Icons.check_circle_rounded,
    done: true,
  );
}

// ── Header band ──────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({
    required this.firstName,
    required this.initial,
    required this.onBell,
  });

  final String firstName;
  final String initial;
  final VoidCallback onBell;

  String _motivasi(DateTime now) {
    final h = now.hour;
    if (h < 11) return 'Semangat pagi ini! ☀️';
    if (h < 15) return 'Semangat bekerja hari ini! 👋';
    if (h < 18) return 'Tetap semangat sore ini! 💪';
    return 'Istirahat yang cukup ya! 🌙';
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final top = MediaQuery.of(context).padding.top;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: AppColors.brandGradient,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        top + AppSpacing.md,
        AppSpacing.md,
        AppSpacing.xl + AppSpacing.md,
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.45),
                width: 2,
              ),
            ),
            child: Text(
              initial,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 20,
                fontFamily: AppTypography.fontFamily,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text.rich(
                  TextSpan(
                    text: '${Formatters.greeting(now)}, ',
                    style: AppTypography.bodyMd.copyWith(
                      color: Colors.white.withValues(alpha: 0.85),
                    ),
                    children: [
                      TextSpan(
                        text: firstName.isEmpty ? 'Karyawan' : firstName,
                        style: AppTypography.titleLg.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _motivasi(now),
                  style: AppTypography.bodySm.copyWith(
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
          _BellButton(onTap: onBell),
        ],
      ),
    );
  }
}

class _BellButton extends StatelessWidget {
  const _BellButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.18),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: const Padding(
          padding: EdgeInsets.all(10),
          child: Badge(
            smallSize: 8,
            child: Icon(
              Icons.notifications_none_rounded,
              color: Colors.white,
              size: 22,
            ),
          ),
        ),
      ),
    );
  }
}

// ── "Waktu Saat Ini" card ────────────────────────────────────────────────────

class _TimeCard extends StatelessWidget {
  const _TimeCard({required this.now, required this.shift, required this.status});

  final DateTime now;
  final Shift? shift;
  final _AttendanceStatus? status;

  @override
  Widget build(BuildContext context) {
    final s = status;
    final startLabel = shift?.startLabel ?? '08:00';
    return SolidCard(
      entrance: false,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: 5,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.access_time_rounded,
                          size: 18,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        'Waktu Saat Ini',
                        style: AppTypography.bodySm.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        Formatters.time(now),
                        style: AppTypography.display.copyWith(
                          fontSize: 38,
                          height: 1.0,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: _Chip(
                          label: 'WIB',
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today_rounded,
                        size: 14,
                        color: AppColors.onSurfaceVariant,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          Formatters.fullDate(now),
                          style: AppTypography.bodySm.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            VerticalDivider(width: 1, color: AppColors.outlineVariant),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: 4,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (s != null) ...[
                    _StatusPill(color: s.color, label: s.label),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      s.done
                          ? 'Absensi hari ini selesai'
                          : 'Masuk sebelum $startLabel WIB',
                      style: AppTypography.labelMd.copyWith(
                        color: AppColors.onSurface,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ] else
                    Text(
                      'Memuat status…',
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
    );
  }
}

// ── "Status Hari Ini" card ───────────────────────────────────────────────────

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.today, required this.shift});

  final dynamic today;
  final Shift? shift;

  @override
  Widget build(BuildContext context) {
    final hasIn = today.hasCheckedIn as bool;
    final hasOut = today.hasCheckedOut as bool;
    final s = _statusFor(hasIn, hasOut);
    final modeLabel = shift?.workMode.label ?? 'WFO';

    return SolidCard(
      entrance: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(
                  Icons.badge_rounded,
                  size: 18,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Status Hari Ini',
                style: AppTypography.titleLg.copyWith(
                  color: AppColors.onSurface,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              _Chip(
                label: modeLabel,
                color: AppColors.primary,
                icon: modeLabel == 'WFH'
                    ? Icons.home_work_rounded
                    : Icons.business_rounded,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          // Status banner
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm + 2),
            decoration: BoxDecoration(
              color: s.color.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: s.color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Icon(s.icon, color: s.color, size: 26),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.label,
                        style: AppTypography.titleLg.copyWith(
                          color: s.color,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        s.hint,
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
          const SizedBox(height: AppSpacing.md),
          // Primary action
          if (s.done)
            OutlinedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.check_circle_outline_rounded),
              label: const Text('Absensi Hari Ini Selesai'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
              ),
            )
          else
            _ActionButton(
              checkout: hasIn,
              onPressed: () {
                if (!hasIn) {
                  context.push(AppRoutes.checkinPrep);
                } else {
                  final wm = today.checkIn?.workMode?.name ?? 'wfo';
                  context.push(
                    '${AppRoutes.checkinPrep}?mode=checkout&wm=$wm',
                  );
                }
              },
            ),
          const SizedBox(height: AppSpacing.sm),
          const Divider(height: AppSpacing.md),
          _InfoRow(
            icon: Icons.schedule_rounded,
            title: shift?.rangeLabel ?? 'Belum ada shift',
            subtitle: 'Jam kerja hari ini',
            onTap: () => context.go(AppRoutes.schedule),
          ),
          const Divider(height: AppSpacing.md),
          _InfoRow(
            icon: modeLabel == 'WFH'
                ? Icons.home_work_rounded
                : Icons.business_rounded,
            title: '$modeLabel · ${shift?.name ?? 'Lokasi kerja'}',
            subtitle: 'Mode & lokasi kerja',
            onTap: () => context.go(AppRoutes.schedule),
          ),
          const Divider(height: AppSpacing.md),
          _InfoRow(
            icon: Icons.logout_rounded,
            title: 'Jam pulang: ${shift?.endLabel ?? '--:--'} WIB',
            subtitle: 'Sesuai jadwal shift',
            onTap: () => context.go(AppRoutes.schedule),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 320.ms).slideY(begin: 0.06, curve: Curves.easeOut);
  }
}

class _ActionButton extends StatefulWidget {
  const _ActionButton({required this.checkout, required this.onPressed});
  final bool checkout;
  final VoidCallback onPressed;

  @override
  State<_ActionButton> createState() => _ActionButtonState();
}

class _ActionButtonState extends State<_ActionButton> {
  double _scale = 1.0;

  @override
  Widget build(BuildContext context) {
    final checkout = widget.checkout;
    final colors = checkout
        ? AppColors.accentGradient(AppColors.accentRose)
        : AppColors.headerGradient;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => setState(() => _scale = 0.97),
      onTapUp: (_) => setState(() => _scale = 1.0),
      onTapCancel: () => setState(() => _scale = 1.0),
      onTap: widget.onPressed,
      child: AnimatedScale(
        scale: _scale,
        duration: const Duration(milliseconds: 110),
        child: Container(
          width: double.infinity,
          height: 54,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.xl),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: colors,
            ),
            boxShadow: [
              BoxShadow(
                color: (checkout ? AppColors.accentRose : AppColors.primary)
                    .withValues(alpha: 0.32),
                blurRadius: 18,
                offset: const Offset(0, 8),
                spreadRadius: -4,
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                checkout ? Icons.logout_rounded : Icons.login_rounded,
                color: Colors.white,
                size: 20,
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                checkout ? 'Check-out Sekarang' : 'Check-in Sekarang',
                style: AppTypography.bodyLg.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(icon, size: 18, color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.labelMd.copyWith(
                      color: AppColors.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: AppTypography.bodySm.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: AppColors.outline,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Layanan Mandiri ──────────────────────────────────────────────────────────

class _ServicesSection extends StatelessWidget {
  const _ServicesSection();

  @override
  Widget build(BuildContext context) {
    final items = <(IconData, String, Color, String, bool)>[
      (
        Icons.edit_calendar_rounded,
        'Ajukan Cuti',
        AppColors.accentViolet,
        AppRoutes.createLeave,
        true,
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
      (
        Icons.event_busy_rounded,
        'Status Cuti',
        AppColors.accentCyan,
        AppRoutes.leave,
        false,
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Layanan Mandiri',
              style: AppTypography.titleLg.copyWith(
                color: AppColors.onSurface,
                fontWeight: FontWeight.w800,
              ),
            ),
            TextButton(
              onPressed: () => context.go(AppRoutes.leave),
              child: const Text('Lihat semua'),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        Row(
          children: [
            for (final it in items)
              Expanded(
                child: _QuickItem(
                  icon: it.$1,
                  label: it.$2,
                  color: it.$3,
                  onTap: () => it.$5 ? context.push(it.$4) : context.go(it.$4),
                ),
              ),
          ],
        ),
      ],
    ).animate(delay: 120.ms).fadeIn(duration: 320.ms);
  }
}

class _QuickItem extends StatelessWidget {
  const _QuickItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        child: Column(
          children: [
            Container(
              width: 54,
              height: 54,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: AppColors.outlineVariant),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.labelSm.copyWith(
                color: AppColors.onSurface,
                letterSpacing: 0,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Small reusable bits ──────────────────────────────────────────────────────

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color, this.icon});
  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
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

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.labelSm.copyWith(
                color: color,
                letterSpacing: 0,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Live minute ticker ───────────────────────────────────────────────────────

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

// ── Error + face-enroll banner ───────────────────────────────────────────────

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

class _FaceEnrollBanner extends StatelessWidget {
  const _FaceEnrollBanner({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SolidCard(
      entrance: false,
      onTap: onTap,
      color: AppColors.pending.withValues(alpha: 0.10),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.pending.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(Icons.face_retouching_natural_rounded,
                color: AppColors.pending),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Daftarkan wajahmu',
                  style: AppTypography.labelMd.copyWith(
                    color: AppColors.onSurface,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  'Wajib sebelum bisa absen. Hanya butuh beberapa detik.',
                  style: AppTypography.bodySm.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, color: AppColors.onSurfaceVariant),
        ],
      ),
    );
  }
}
