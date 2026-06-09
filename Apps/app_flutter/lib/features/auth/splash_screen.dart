import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

/// Branded splash shown while the session is being restored.
/// Routing away is handled by the router redirect once auth status resolves.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Stack(
        children: [
          // Decorative blurred blobs
          Positioned(
            top: -96,
            right: -96,
            child: _blob(AppColors.primaryFixedDim),
          ),
          Positioned(
            bottom: -96,
            left: -96,
            child: _blob(AppColors.secondaryFixedDim),
          ),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(AppRadius.xl),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x33004191),
                        blurRadius: 24,
                        offset: Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.verified_outlined,
                    color: AppColors.onPrimary,
                    size: 48,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(AppConfig.appName, style: AppTypography.display.copyWith(
                  color: AppColors.primary,
                )),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  AppConfig.appTagline,
                  style: AppTypography.bodyLg.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const Positioned(
            bottom: 64,
            left: 0,
            right: 0,
            child: Center(
              child: SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(strokeWidth: 3),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _blob(Color color) => Container(
        width: 256,
        height: 256,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.2),
          shape: BoxShape.circle,
        ),
      );
}
