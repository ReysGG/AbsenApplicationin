import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/page_background.dart';

/// Onboarding / welcome screen shown to unauthenticated users before login.
/// Self-registration is disabled (accounts are created by HR), so there is no
/// "Daftar" button — only "Masuk".
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: PageBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              children: [
                const Spacer(),
                // Hero illustration (asset with graceful icon fallback).
                Container(
                  width: 240,
                  height: 240,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppColors.primary.withValues(alpha: 0.14),
                        AppColors.primary.withValues(alpha: 0.04),
                      ],
                    ),
                  ),
                  child: Image.asset(
                    'assets/images/welcome_hero.png',
                    width: 200,
                    height: 200,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => Icon(
                      Icons.fingerprint_rounded,
                      size: 120,
                      color: AppColors.primary,
                    ),
                  ),
                ).animate().fadeIn(duration: 500.ms).scaleXY(
                      begin: 0.85,
                      end: 1.0,
                      curve: Curves.easeOutBack,
                    ),
                const SizedBox(height: AppSpacing.xl),
                Text(
                  'Absensi Digital,\nLebih Mudah & Aman',
                  textAlign: TextAlign.center,
                  style: AppTypography.display.copyWith(
                    color: AppColors.onSurface,
                    fontSize: 28,
                    height: 1.2,
                  ),
                ).animate(delay: 120.ms).fadeIn(duration: 360.ms).slideY(
                      begin: 0.1,
                      curve: Curves.easeOut,
                    ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Catat kehadiran dengan verifikasi wajah & lokasi, '
                  'ajukan cuti, dan pantau jadwal dalam satu aplikasi.',
                  textAlign: TextAlign.center,
                  style: AppTypography.bodyMd.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ).animate(delay: 200.ms).fadeIn(duration: 360.ms),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () => context.go(AppRoutes.login),
                    icon: const Icon(Icons.login_rounded),
                    label: const Text('Masuk'),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(54),
                    ),
                  ),
                ).animate(delay: 280.ms).fadeIn(duration: 360.ms).slideY(
                      begin: 0.2,
                      curve: Curves.easeOut,
                    ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Akun dibuat oleh admin/HR perusahaan Anda.',
                  textAlign: TextAlign.center,
                  style: AppTypography.labelSm.copyWith(
                    color: AppColors.outline,
                    letterSpacing: 0,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '${AppConfig.appName} • ${AppConfig.appTagline}',
                  textAlign: TextAlign.center,
                  style: AppTypography.labelSm.copyWith(
                    color: AppColors.outline,
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
