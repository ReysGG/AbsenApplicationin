import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/brand_header.dart';
import '../../core/widgets/pressable.dart';
import '../../core/widgets/solid_card.dart';
import '../../core/widgets/status_badge.dart';
import '../auth/auth_controller.dart';
import '../shell/main_shell.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authProfileProvider);
    final themeMode = ref.watch(themeModeProvider);
    final isDarkMode =
        themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);
    final firstName = profile?.firstName ?? '';
    final profileInitial = firstName.isNotEmpty
        ? firstName.characters.first
        : 'A';

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: Column(
        children: [
          BrandHeader(
            title: 'Profil',
            subtitle: profile?.workspaceName ?? 'AttendX',
            trailing: BrandHeaderAction(
              icon: Icons.settings_rounded,
              onTap: () => _showComingSoon(
                context,
                title: 'Pengaturan',
                message:
                    'Pengaturan lengkap sedang disiapkan. Untuk sekarang, gunakan menu pengaturan di halaman ini.',
              ),
              tooltip: 'Pengaturan',
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.md,
                AppSpacing.md,
                MainShellLayout.bottomContentPadding(context),
              ),
              children: [
                // ── Profile header ──────────────────────────────────────────
                SolidCard(
                  glowColor: AppColors.primary,
                  child: Column(
                    children: [
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          // Avatar with a playful brand-gradient ring.
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: AppColors.headerGradient,
                              ),
                            ),
                            padding: const EdgeInsets.all(3),
                            child: CircleAvatar(
                              radius: 42,
                              backgroundColor: AppColors.primaryFixed,
                              child: Text(
                                profileInitial,
                                style: AppTypography.display.copyWith(
                                  color: AppColors.brandMid,
                                ),
                              ),
                            ),
                          ),
                          // Verified check badge — pops in.
                          Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: AppColors.success,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: AppColors.surface,
                                    width: 2,
                                  ),
                                ),
                                child: const Icon(
                                  Icons.check_rounded,
                                  size: 14,
                                  color: Colors.white,
                                ),
                              )
                              .animate()
                              .scaleXY(
                                begin: 0,
                                delay: 350.ms,
                                duration: 400.ms,
                                curve: Curves.easeOutBack,
                              )
                              .fadeIn(duration: 200.ms, delay: 350.ms),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        profile?.fullName ?? '-',
                        style: AppTypography.headlineMd,
                      ),
                      Text(
                        profile?.position ?? '-',
                        style: AppTypography.bodyMd.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      StatusBadge(
                        label: profile?.faceEnrolled == true
                            ? 'Wajah Terdaftar'
                            : 'Wajah Belum Terdaftar',
                        color: profile?.faceEnrolled == true
                            ? AppColors.success
                            : AppColors.pending,
                        icon: Icons.face_rounded,
                      ),
                      if (profile?.faceEnrolled != true) ...[
                        const SizedBox(height: AppSpacing.sm),
                        FilledButton.icon(
                          onPressed: () => context.push(AppRoutes.faceEnroll),
                          icon: const Icon(
                            Icons.face_retouching_natural_rounded,
                          ),
                          label: const Text('Daftarkan Wajah Sekarang'),
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(44),
                          ),
                        ),
                      ] else ...[
                        const SizedBox(height: AppSpacing.sm),
                        TextButton.icon(
                          onPressed: () => context.push(AppRoutes.faceEnroll),
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Daftarkan Ulang Wajah'),
                        ),
                      ],
                      const SizedBox(height: AppSpacing.sm),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Informasi Pribadi ──────────────────────────────────────
                Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(
                            left: AppSpacing.xs,
                            bottom: AppSpacing.xs,
                          ),
                          child: Text(
                            'Informasi Pribadi',
                            style: AppTypography.titleLg.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppColors.onSurface,
                            ),
                          ),
                        ),
                        SolidCard(
                          child: Column(
                            children: [
                              _info('Email Utama', profile?.email ?? '-'),
                              const Divider(height: AppSpacing.md),
                              _info('Nomor Telepon', '+62 812-3456-7890'),
                            ],
                          ),
                        ),
                      ],
                    )
                    .animate(delay: 60.ms)
                    .fadeIn(duration: 320.ms)
                    .slideY(begin: 0.06, curve: Curves.easeOut),
                const SizedBox(height: AppSpacing.md),

                // ── Informasi Karyawan ──────────────────────────────────────
                Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(
                            left: AppSpacing.xs,
                            bottom: AppSpacing.xs,
                          ),
                          child: Text(
                            'Informasi Karyawan',
                            style: AppTypography.titleLg.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppColors.onSurface,
                            ),
                          ),
                        ),
                        SolidCard(
                          child: Column(
                            children: [
                              _info('Departemen', profile?.department ?? '-'),
                              const Divider(height: AppSpacing.md),
                              _info('Posisi', profile?.position ?? '-'),
                              const Divider(height: AppSpacing.md),
                              _info(
                                'Kode Karyawan',
                                profile?.employeeCode ?? '-',
                              ),
                              const Divider(height: AppSpacing.md),
                              _info(
                                'Perusahaan',
                                profile?.workspaceName ?? '-',
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                    .animate(delay: 120.ms)
                    .fadeIn(duration: 320.ms)
                    .slideY(begin: 0.06, curve: Curves.easeOut),
                const SizedBox(height: AppSpacing.md),

                // ── Pengaturan ──────────────────────────────────────────────
                Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(
                            left: AppSpacing.xs,
                            bottom: AppSpacing.xs,
                          ),
                          child: Text(
                            'Pengaturan',
                            style: AppTypography.titleLg.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppColors.onSurface,
                            ),
                          ),
                        ),
                        SolidCard(
                          entrance: false,
                          padding: EdgeInsets.zero,
                          child: Column(
                            children: [
                              ListTile(
                                leading: _SettingLeading(
                                  icon: isDarkMode
                                      ? Icons.dark_mode_rounded
                                      : Icons.light_mode_rounded,
                                  tint: AppColors.accentViolet,
                                ),
                                title: const Text(
                                  'Mode Gelap',
                                  style: AppTypography.labelMd,
                                ),
                                subtitle: Text(
                                  isDarkMode ? 'Aktif' : 'Nonaktif',
                                  style: AppTypography.bodySm.copyWith(
                                    color: AppColors.onSurfaceVariant,
                                  ),
                                ),
                                trailing: Switch(
                                  value: isDarkMode,
                                  onChanged: (value) {
                                    ref
                                        .read(themeModeProvider.notifier)
                                        .setThemeMode(
                                          value
                                              ? ThemeMode.dark
                                              : ThemeMode.light,
                                        );
                                  },
                                  activeThumbColor: AppColors.primary,
                                ),
                                splashColor: AppColors.surfaceContainerLow,
                              ),
                              const Divider(height: 1),
                              ListTile(
                                leading: _SettingLeading(
                                  icon: Icons.security_rounded,
                                  tint: AppColors.primary,
                                ),
                                title: const Text(
                                  'Kunci Aplikasi (Sidik Jari / PIN)',
                                  style: AppTypography.labelMd,
                                ),
                                trailing: Switch(
                                  value: ref
                                      .watch(authControllerProvider)
                                      .isAppLockEnabled,
                                  onChanged: (value) async {
                                    await ref
                                        .read(authControllerProvider.notifier)
                                        .setAppLockEnabled(value);
                                  },
                                  activeThumbColor: AppColors.primary,
                                ),
                                splashColor: AppColors.surfaceContainerLow,
                              ),
                              const Divider(height: 1),
                              ListTile(
                                leading: _SettingLeading(
                                  icon: Icons.password_rounded,
                                  tint: AppColors.primary,
                                ),
                                title: const Text(
                                  'Ganti Kata Sandi',
                                  style: AppTypography.labelMd,
                                ),
                                trailing: Icon(
                                  Icons.chevron_right_rounded,
                                  color: AppColors.outline,
                                ),
                                onTap: () =>
                                    context.push(AppRoutes.changePassword),
                                splashColor: AppColors.surfaceContainerLow,
                              ),
                              const Divider(height: 1),
                              ListTile(
                                leading: _SettingLeading(
                                  icon: Icons.sync_rounded,
                                  tint: AppColors.accentCyan,
                                ),
                                title: const Text(
                                  'Sinkronisasi Offline',
                                  style: AppTypography.labelMd,
                                ),
                                trailing: Icon(
                                  Icons.chevron_right_rounded,
                                  color: AppColors.outline,
                                ),
                                onTap: () => context.push(AppRoutes.syncStatus),
                                splashColor: AppColors.surfaceContainerLow,
                              ),
                              const Divider(height: 1),
                              ListTile(
                                leading: _SettingLeading(
                                  icon: Icons.notifications_rounded,
                                  tint: AppColors.accentViolet,
                                ),
                                title: const Text(
                                  'Notifikasi',
                                  style: AppTypography.labelMd,
                                ),
                                trailing: Icon(
                                  Icons.chevron_right_rounded,
                                  color: AppColors.outline,
                                ),
                                onTap: () =>
                                    context.push(AppRoutes.notifications),
                                splashColor: AppColors.surfaceContainerLow,
                              ),
                              const Divider(height: 1),
                              ListTile(
                                leading: _SettingLeading(
                                  icon: Icons.help_rounded,
                                  tint: AppColors.accentGreen,
                                ),
                                title: const Text(
                                  'Bantuan',
                                  style: AppTypography.labelMd,
                                ),
                                trailing: Icon(
                                  Icons.chevron_right_rounded,
                                  color: AppColors.outline,
                                ),
                                onTap: () => showDialog<void>(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    title: const Text('Bantuan'),
                                    content: const Text(
                                      'Butuh bantuan terkait absensi, cuti, atau '
                                      'akun Anda? Hubungi admin/HR perusahaan Anda, '
                                      'atau email tim AttendX di '
                                      'support@attendx.app.',
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(ctx),
                                        child: const Text('Tutup'),
                                      ),
                                    ],
                                  ),
                                ),
                                splashColor: AppColors.surfaceContainerLow,
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                    .animate(delay: 180.ms)
                    .fadeIn(duration: 320.ms)
                    .slideY(begin: 0.06, curve: Curves.easeOut),
                const SizedBox(height: AppSpacing.md),

                // ── Logout ──────────────────────────────────────────────────
                Pressable(
                      child: OutlinedButton.icon(
                        onPressed: () => _confirmLogout(context, ref),
                        icon: Icon(
                          Icons.logout_rounded,
                          color: AppColors.error,
                        ),
                        label: Text(
                          'Keluar',
                          style: TextStyle(color: AppColors.error),
                        ),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          backgroundColor: AppColors.surface,
                          side: BorderSide(color: AppColors.error),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.xl),
                          ),
                        ),
                      ),
                    )
                    .animate(delay: 240.ms)
                    .fadeIn(duration: 320.ms, curve: Curves.easeOut)
                    .slideY(
                      begin: 0.06,
                      duration: 320.ms,
                      curve: Curves.easeOut,
                    ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showComingSoon(
    BuildContext context, {
    required String title,
    required String message,
  }) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Tutup'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Keluar dari akun?'),
        content: const Text(
          'Kamu perlu masuk kembali untuk melakukan absensi.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authControllerProvider.notifier).logout();
    }
  }

  Widget _info(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTypography.bodyMd.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: AppTypography.labelMd,
          ),
        ),
      ],
    ),
  );
}

/// A colorful rounded icon container for settings list rows (Modern Playful).
class _SettingLeading extends StatelessWidget {
  const _SettingLeading({required this.icon, required this.tint});
  final IconData icon;
  final Color tint;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [tint.withValues(alpha: 0.18), tint.withValues(alpha: 0.08)],
        ),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Icon(icon, size: 20, color: tint),
    );
  }
}
