import 'package:flutter/material.dart';

import '../theme/app_spacing.dart';
import 'glass_card.dart';

/// Backward-compatible wrapper: forwards to [GlassCard].
/// All existing usages of AppCard now get the glassmorphic look for free.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.onTap,
    this.animate = true,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final bool animate;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: padding,
      onTap: onTap,
      animate: animate,
      child: child,
    );
  }
}
