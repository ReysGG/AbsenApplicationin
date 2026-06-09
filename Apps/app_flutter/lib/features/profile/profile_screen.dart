import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/status_badge.dart';
import '../auth/auth_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authControllerProvider).profile;

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          // Profile header bento
          AppCard(
            child: Column(
              children: [
                Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: AppColors.primaryFixed,
                      child: Text(
                        profile?.firstName.characters.first ?? 'A',
                        style: AppTypography.display
                            .copyWith(color: AppColors.primary),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.check,
                          size: 14, color: AppColors.onPrimary),
                    ),
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

          // Menu
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _MenuTile(
                  icon: Icons.sync,
                  label: 'Sinkronisasi Offline',
                  onTap: () => context.push(AppRoutes.syncStatus),
                ),
                const Divider(height: 1),
                _MenuTile(
                  icon: Icons.notifications_outlined,
                  label: 'Notifikasi',
                  onTap: () => context.push(AppRoutes.notifications),
                ),
                const Divider(height: 1),
                _MenuTile(
                  icon: Icons.help_outline,
                  label: 'Bantuan',
                  onTap: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          OutlinedButton.icon(
            onPressed: () => _confirmLogout(context, ref),
            icon: const Icon(Icons.logout, color: AppColors.error),
            label: const Text('Keluar',
                style: TextStyle(color: AppColors.error)),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              side: const BorderSide(color: AppColors.error),
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
        content: const Text('Kamu perlu masuk kembali untuk melakukan absensi.'),
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

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.onSurfaceVariant),
      title: Text(label, style: AppTypography.labelMd),
      trailing: const Icon(Icons.chevron_right, color: AppColors.outline),
      onTap: onTap,
    );
  }
}
