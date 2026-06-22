import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'animated_entrance.dart';

/// Standard error state for failed async loads: a calm icon, a human-readable
/// message, and a retry action. Use this instead of dumping a raw exception
/// string to the user (see DESIGN.md — every state is handled).
class AppErrorState extends StatelessWidget {
  const AppErrorState({
    super.key,
    this.title = 'Gagal memuat data',
    this.message = 'Periksa koneksi Anda lalu coba lagi.',
    this.onRetry,
  });

  final String title;
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: AnimatedEntrance(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.error.withValues(alpha: 0.18),
                      AppColors.error.withValues(alpha: 0.08),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
                child: Icon(Icons.cloud_off_rounded,
                    color: AppColors.error, size: 30),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                title,
                style: AppTypography.titleLg,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                message,
                style: AppTypography.bodyMd
                    .copyWith(color: AppColors.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
              if (onRetry != null) ...[
                const SizedBox(height: AppSpacing.lg),
                FilledButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text('Coba lagi'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
