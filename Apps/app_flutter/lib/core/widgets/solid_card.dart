import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// The card primitive for AttendX: a token surface with a hairline border and
/// soft shadows. Modern Playful — rounder by default, with optional [gradient]
/// fill and an optional soft colored [glowColor] for hero cards.
class SolidCard extends StatelessWidget {
  const SolidCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.onTap,
    this.borderRadius = AppRadius.xxl,
    this.entrance = true,
    this.color,
    this.gradient,
    this.glowColor,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final double borderRadius;
  final bool entrance;
  final Color? color;

  /// Optional gradient fill (overrides [color]) for hero/feature cards.
  final Gradient? gradient;

  /// Optional accent — adds a soft colored glow shadow under the card.
  final Color? glowColor;

  @override
  Widget build(BuildContext context) {
    final glow = glowColor;
    Widget card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null ? (color ?? AppColors.surface) : null,
        gradient: gradient,
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
          // Optional cheerful colored glow for hero cards.
          if (glow != null)
            BoxShadow(
              color: AppColors.softGlow(glow),
              blurRadius: 28,
              offset: const Offset(0, 12),
              spreadRadius: -10,
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
