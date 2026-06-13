import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Clean, flat card — solid white surface, hairline border, soft shadow.
///
/// (Previously a frosted-glass card with gradient fill + gloss highlight.
/// Flattened for a more professional, restrained look. The API is unchanged so
/// existing screens keep working; [useBlur]/[blurSigma] are now no-ops.)
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.onTap,
    this.blurSigma = 12.0,
    this.useBlur = false,
    this.borderRadius = AppRadius.xl,
    this.fillColor,
    this.animate = true,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final double blurSigma;
  final bool useBlur;
  final double borderRadius;
  final Color? fillColor;

  /// When true the card fades + slides in when first built.
  final bool animate;

  @override
  Widget build(BuildContext context) {
    Widget card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: fillColor ?? AppColors.surface,
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

    if (animate) {
      card = card
          .animate()
          .fadeIn(duration: 240.ms, curve: Curves.easeOut)
          .slideY(begin: 0.04, duration: 240.ms, curve: Curves.easeOut);
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

/// Retained for API compatibility with any remaining imports. Renders a plain
/// solid border stroke.
class GradientBoxBorder extends BoxBorder {
  const GradientBoxBorder({required this.gradient, required this.width});

  final Gradient gradient;
  final double width;

  @override
  BorderSide get bottom => BorderSide.none;
  @override
  BorderSide get top => BorderSide.none;
  @override
  bool get isUniform => true;
  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.all(width);

  @override
  ShapeBorder scale(double t) =>
      GradientBoxBorder(gradient: gradient, width: width * t);

  @override
  void paint(
    Canvas canvas,
    Rect rect, {
    TextDirection? textDirection,
    BoxShape shape = BoxShape.rectangle,
    BorderRadius? borderRadius,
  }) {
    final paint = Paint()
      ..strokeWidth = width
      ..style = PaintingStyle.stroke
      ..shader = gradient.createShader(rect);
    if (borderRadius != null) {
      canvas.drawRRect(borderRadius.toRRect(rect.deflate(width / 2)), paint);
    } else {
      canvas.drawRect(rect.deflate(width / 2), paint);
    }
  }
}
