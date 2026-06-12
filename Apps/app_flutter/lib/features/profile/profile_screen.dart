import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/brand_header.dart';
import '../../core/widgets/pressable.dart';
import '../../core/widgets/solid_card.dart';
import '../../core/widgets/status_badge.dart';
import '../auth/auth_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authControllerProvider).profile;



    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: Column(
        children: [
          BrandHeader(
            title: 'Profil',
            subtitle: profile?.workspaceName ?? 'AttendX',
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                  AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xl),
              children: [
                // ── Profile header ──────────────────────────────────────────
                SolidCard(
                  child: Column(
                    children: [
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          // Avatar with subtle brand ring/glow.
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  AppColors.brandStart,
                                  AppColors.brandEnd,
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      AppColors.brandMid.withValues(alpha: 0.25),
                                  blurRadius: 24,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            padding: const EdgeInsets.all(3),
                            child: CircleAvatar(
                              radius: 40,
                              backgroundColor: AppColors.primaryFixed,
                              child: Text(
                                profile?.firstName.characters.first ?? 'A',
                                style: AppTypography.display
                                    .copyWith(color: AppColors.brandMid),
                              ),
                            ),
                          ),
                          // Verified check badge — pops in.
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle,
                              border:
                                  Border.all(color: Colors.white, width: 2),
                            ),
                            child: const Icon(Icons.check,
                                size: 14, color: Colors.white),
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
                      Text(profile?.fullName ?? '-',
                          style: AppTypography.headlineMd),
                      Text(profile?.position ?? '-',
                          style: AppTypography.bodyMd
                              .copyWith(color: AppColors.onSurfaceVariant)),
                      const SizedBox(height: AppSpacing.sm),
                      StatusBadge(
                        label: profile?.faceEnrolled == true
                            ? 'Wajah Terdaftar'
                            : 'Wajah Belum Terdaftar',
                        color: profile?.faceEnrolled == true
                            ? AppColors.success
                            : AppColors.pending,
                        icon: Icons.face,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      const Divider(),
                      _info('Kode Karyawan', profile?.employeeCode ?? '-'),
                      _info('Email', profile?.email ?? '-'),
                      _info('Divisi', profile?.department ?? '-'),
                      _info('Perusahaan', profile?.workspaceName ?? '-'),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Menu ────────────────────────────────────────────────────
                SolidCard(
                  entrance: false,
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      ListTile(
                        leading: Icon(Icons.security, color: AppColors.onSurfaceVariant),
                        title: const Text('Kunci Aplikasi (Sidik Jari / PIN)', style: AppTypography.labelMd),
                        trailing: Switch(
                          value: ref.watch(authControllerProvider).isAppLockEnabled,
                          onChanged: (value) async {
                            await ref.read(authControllerProvider.notifier).setAppLockEnabled(value);
                          },
                          activeThumbColor: AppColors.primary,
                        ),
                        splashColor: AppColors.surfaceContainerLow,
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Icon(Icons.sync, color: AppColors.onSurfaceVariant),
                        title: const Text('Sinkronisasi Offline', style: AppTypography.labelMd),
                        trailing: Icon(Icons.chevron_right, color: AppColors.outline),
                        onTap: () => context.push(AppRoutes.syncStatus),
                        splashColor: AppColors.surfaceContainerLow,
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Icon(Icons.notifications_outlined, color: AppColors.onSurfaceVariant),
                        title: const Text('Notifikasi', style: AppTypography.labelMd),
                        trailing: Icon(Icons.chevron_right, color: AppColors.outline),
                        onTap: () => context.push(AppRoutes.notifications),
                        splashColor: AppColors.surfaceContainerLow,
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Icon(Icons.help_outline, color: AppColors.onSurfaceVariant),
                        title: const Text('Bantuan', style: AppTypography.labelMd),
                        trailing: Icon(Icons.chevron_right, color: AppColors.outline),
                        onTap: () {},
                        splashColor: AppColors.surfaceContainerLow,
                      ),
                    ],
                  ),
                )
                    .animate(delay: 120.ms)
                    .fadeIn(duration: 320.ms)
                    .slideY(begin: 0.06, curve: Curves.easeOut),
                const SizedBox(height: AppSpacing.md),

                // ── Logout ──────────────────────────────────────────────────
                Pressable(
                  child: OutlinedButton.icon(
                    onPressed: () => _confirmLogout(context, ref),
                    icon: Icon(Icons.logout, color: AppColors.error),
                    label: Text('Keluar',
                        style: TextStyle(color: AppColors.error)),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                      backgroundColor: Colors.white,
                      side: BorderSide(color: AppColors.error),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                      ),
                    ),
                  ),
                )
                    .animate(delay: 200.ms)
                    .fadeIn(duration: 320.ms, curve: Curves.easeOut)
                    .slideY(begin: 0.06, duration: 320.ms, curve: Curves.easeOut),
              ],
            ),
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
        content:
            const Text('Kamu perlu masuk kembali untuk melakukan absensi.'),
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
            Text(label,
                style: AppTypography.bodyMd
                    .copyWith(color: AppColors.onSurfaceVariant)),
            Flexible(
              child: Text(value,
                  textAlign: TextAlign.right, style: AppTypography.labelMd),
            ),
          ],
        ),
      );
}


