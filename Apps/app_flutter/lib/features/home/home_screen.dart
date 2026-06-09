import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../shared/models/enums.dart';
import '../../shared/models/shift.dart';
import '../auth/auth_controller.dart';
import 'home_controller.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late Timer _clock;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _clock.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(authControllerProvider).profile;
    final homeAsync = ref.watch(homeDataProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: AppSpacing.md,
        title: Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: AppColors.surfaceContainerHigh,
              child: Text(
                profile?.firstName.characters.first ?? 'A',
                style: AppTypography.labelMd.copyWith(color: AppColors.primary),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Text('AttendX',
                style: AppTypography.headlineLgMobile
                    .copyWith(color: AppColors.primary)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Badge(
              smallSize: 8,
              child: Icon(Icons.notifications_outlined),
            ),
            onPressed: () => context.push(AppRoutes.notifications),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(homeDataProvider.future),
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            // Greeting
            Text('${Formatters.greeting(_now)}, ${profile?.firstName ?? ''}',
                style: AppTypography.headlineLgMobile),
            const SizedBox(height: AppSpacing.xs),
            Text(Formatters.fullDate(_now),
                style: AppTypography.bodyMd
                    .copyWith(color: AppColors.onSurfaceVariant)),
            const SizedBox(height: AppSpacing.lg),

            homeAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => _ErrorState(
                message: e.toString(),
                onRetry: () => ref.refresh(homeDataProvider),
              ),
              data: (data) => Column(
                children: [
                  _ClockShiftCard(now: _now, shift: data.shift),
                  const SizedBox(height: AppSpacing.md),
                  _AttendanceActionCard(today: data.today),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),
            Text('Akses Cepat',
                style: AppTypography.labelMd
                    .copyWith(color: AppColors.onSurfaceVariant)),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                _QuickLink(
                  icon: Icons.history,
                  label: 'Riwayat',
                  color: AppColors.primary,
                  onTap: () => context.go(AppRoutes.history),
                ),
                const SizedBox(width: AppSpacing.sm),
                _QuickLink(
                  icon: Icons.post_add,
                  label: 'Pengajuan',
                  color: AppColors.secondary,
                  onTap: () => context.go(AppRoutes.leave),
                ),
                const SizedBox(width: AppSpacing.sm),
                _QuickLink(
                  icon: Icons.calendar_month,
                  label: 'Jadwal',
                  color: AppColors.success,
                  onTap: () => context.go(AppRoutes.schedule),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ClockShiftCard extends StatelessWidget {
  const _ClockShiftCard({required this.now, required this.shift});
  final DateTime now;
  final Shift? shift;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SHIFT HARI INI',
                      style: AppTypography.labelSm
                          .copyWith(color: AppColors.onSurfaceVariant)),
                  const SizedBox(height: 2),
                  Text(shift?.rangeLabel ?? '—',
                      style: AppTypography.headlineMd),
                ],
              ),
              if (shift != null)
                StatusBadge(
                  label: shift!.workMode.label,
                  color: AppColors.primary,
                  icon: shift!.workMode == WorkMode.wfo
                      ? Icons.business
                      : Icons.home_work_outlined,
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: AppColors.surfaceContainerHigh),
            ),
            child: Column(
              children: [
                Text(Formatters.time(now),
                    style: AppTypography.display
                        .copyWith(color: AppColors.primary)),
                Text('Waktu Lokal (WIB)',
                    style: AppTypography.bodyMd
                        .copyWith(color: AppColors.onSurfaceVariant)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AttendanceActionCard extends StatelessWidget {
  const _AttendanceActionCard({required this.today});
  final dynamic today; // TodayAttendance

  @override
  Widget build(BuildContext context) {
    final hasCheckedIn = today.hasCheckedIn as bool;
    final hasCheckedOut = today.hasCheckedOut as bool;

    final (statusColor, statusText, hint) = switch ((hasCheckedIn, hasCheckedOut)) {
      (false, _) => (
          AppColors.pending,
          'Belum Check-in',
          'Jangan lupa absen sebelum jam masuk',
        ),
      (true, false) => (
          AppColors.success,
          'Sudah Check-in',
          'Selamat bekerja! Jangan lupa check-out nanti',
        ),
      (true, true) => (
          AppColors.primary,
          'Absensi Selesai',
          'Kamu sudah check-in & check-out hari ini',
        ),
    };

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: statusColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(statusText,
                  style: AppTypography.labelMd.copyWith(color: statusColor)),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(hint,
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: AppSpacing.md),
          if (!hasCheckedIn)
            FilledButton.icon(
              onPressed: () => context.push(AppRoutes.checkinPrep),
              icon: const Icon(Icons.login),
              label: const Text('Check-in Sekarang'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
            )
          else if (!hasCheckedOut)
            FilledButton.icon(
              onPressed: () => context.push(AppRoutes.checkinPrep),
              icon: const Icon(Icons.logout),
              label: const Text('Check-out Sekarang'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
                backgroundColor: AppColors.tertiaryContainer,
              ),
            )
          else
            OutlinedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Absensi Hari Ini Selesai'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
            ),
        ],
      ),
    );
  }
}

class _QuickLink extends StatelessWidget {
  const _QuickLink({
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
    return Expanded(
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        child: Column(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: color.withValues(alpha: 0.1),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(label,
                style: AppTypography.labelSm
                    .copyWith(color: AppColors.onSurface, letterSpacing: 0)),
          ],
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
          const Icon(Icons.cloud_off, size: 40, color: AppColors.outline),
          const SizedBox(height: AppSpacing.sm),
          Text(message,
              textAlign: TextAlign.center,
              style: AppTypography.bodyMd
                  .copyWith(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: AppSpacing.sm),
          FilledButton(onPressed: onRetry, child: const Text('Coba Lagi')),
        ],
      ),
    );
  }
}
