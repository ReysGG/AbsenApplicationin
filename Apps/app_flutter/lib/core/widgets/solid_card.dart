import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// The single flat card primitive for AttendX: a solid token surface with a
/// hairline border and one soft ambient shadow. Corporate-Modern — flat, not
/// frosted (no blur, no gradient). See DESIGN.md.
class SolidCard extends StatelessWidget {
  const SolidCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.onTap,
    this.borderRadius = AppRadius.xxl,
    this.entrance = true,
    this.color,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final double borderRadius;
  final bool entrance;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    Widget card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? AppColors.surface,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          // Tight key shadow — gives a crisp edge/contact.
          BoxShadow(
            color: AppColors.cardShadow,
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
          // Wide soft ambient — the premium "float".
          BoxShadow(
            color: AppColors.cardShadowAmbient,
            blurRadius: 24,
            offset: const Offset(0, 10),
            spreadRadius: -6,
          ),
        ],
      ),
      child: child,
    );

    if (entrance) {
      card = card
          .animate()
          .fadeIn(duration: 280.ms, curve: Curves.easeOut)
          .slideY(begin: 0.05, duration: 280.ms, curve: Curves.easeOut);
    }

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(borderRadius),
        onTap: onTap,
        child: card,
      ),
    );
  }
}
