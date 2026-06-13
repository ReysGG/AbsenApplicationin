import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/page_background.dart';

/// Branded splash shown while the session is being restored.
/// Routing away is handled by the router redirect once auth status resolves.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: PageBackground(
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Logo: scale + blur-in entrance
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
                    child: Icon(
                      Icons.verified_outlined,
                      color: AppColors.onPrimary,
                      size: 48,
                    ),
                  )
                      .animate()
                      .scaleXY(
                        begin: 0.6,
                        end: 1.0,
                        duration: 600.ms,
                        curve: Curves.easeOutBack,
                      )
                      .fadeIn(duration: 500.ms)
                      .blurXY(begin: 12, end: 0, duration: 600.ms),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    AppConfig.appName,
                    style: AppTypography.display.copyWith(
                      color: AppColors.primary,
                    ),
                  )
                      .animate(delay: 250.ms)
                      .fadeIn(duration: 450.ms)
                      .slideY(begin: 0.4, curve: Curves.easeOut),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    AppConfig.appTagline,
                    style: AppTypography.bodyLg.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  )
                      .animate(delay: 400.ms)
                      .fadeIn(duration: 450.ms)
                      .slideY(begin: 0.4, curve: Curves.easeOut),
                ],
              ),
            ),
            // Lightweight animated loader (always animates, cheap)
            const Positioned(
              bottom: 64,
              left: 0,
              right: 0,
              child: Center(child: _PulsingDots()),
            ),
          ],
        ),
      ),
    );
  }
}

/// Three dots that pulse in sequence — a calmer alternative to a spinner.
class _PulsingDots extends StatelessWidget {
  const _PulsingDots();

  @override
  Widget build(BuildContext context) {
    Widget dot(int i) {
      return Container(
        width: 9,
        height: 9,
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
          .fadeIn(duration: 500.ms)
          .scaleXY(begin: 0.6, end: 1.0, duration: 500.ms, curve: Curves.easeInOut);
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [dot(0), dot(1), dot(2)],
    );
  }
}
