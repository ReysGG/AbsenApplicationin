import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_spacing.dart';

/// Crisp white card with a soft, tight shadow — the Talenta/Lark "HR app"
/// surface. Solid (not translucent), strong contrast, subtle elevation.
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
        color: color ?? Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: const Color(0xFFE8EAF0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F172B4D),
            blurRadius: 16,
            offset: Offset(0, 3),
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
