import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Frosted-glass card with a translucent gradient fill, gradient border, and a
/// subtle top-edge highlight for the "glossy" look.
///
/// Performance: by default this uses a cheap translucent gradient fill (NO
/// per-card backdrop blur), so it stays smooth even in long lists. Set
/// [useBlur] true for a true backdrop-blur on a single hero card only.
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

  /// True = real backdrop blur (expensive). Reserve for a single hero card.
  final bool useBlur;
  final double borderRadius;
  final Color? fillColor;

  /// When true the card fades + slides in when first built.
  final bool animate;

  @override
  Widget build(BuildContext context) {
    final inner = Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        // Frosted translucent gradient — reads as glass without a blur pass.
        gradient: fillColor == null
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.glassFillStrong,
                  AppColors.glassFill,
                ],
              )
            : null,
        color: fillColor,
        border: GradientBoxBorder(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.glassBorder,
              AppColors.glassBorderSoft,
            ],
          ),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.glassShadow,
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Top-edge gloss highlight
          Positioned(
            top: 0,
            left: 8,
            right: 8,
            height: 1,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    AppColors.glassHighlight,
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Padding(padding: padding, child: child),
        ],
      ),
    );

    Widget card = RepaintBoundary(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: useBlur
            ? BackdropFilter(
                filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
                child: inner,
              )
            : inner,
      ),
    );

    if (animate) {
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
        splashColor: AppColors.glassFill,
        highlightColor: AppColors.glassFillStrong.withValues(alpha: 0.1),
        child: card,
      ),
    );
  }
}

/// A [BoxBorder] that renders a gradient stroke.
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
