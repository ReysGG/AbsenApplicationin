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
    this.borderRadius = AppRadius.xl,
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
          BoxShadow(
            color: AppColors.cardShadow,
            blurRadius: 16,
            offset: const Offset(0, 3),
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
