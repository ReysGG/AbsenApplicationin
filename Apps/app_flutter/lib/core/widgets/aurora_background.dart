import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Plain, flat neutral background.
///
/// (Previously an animated pastel "aurora". Replaced with a calm flat surface
/// for a cleaner, more professional enterprise look — no gradients or glow.)
/// The widget API is kept so screens don't need to change.
class AuroraBackground extends StatelessWidget {
  const AuroraBackground({
    super.key,
    required this.child,
    this.intensity = 1.0,
  });

  final Widget child;

  /// Retained for API compatibility; no longer used.
  final double intensity;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.pageBg,
      child: child,
    );
  }
}
