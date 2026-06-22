import 'package:flutter/material.dart';

import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// Pill-shaped status badge: a soft tinted gradient of [color] with solid
/// colored text/icon and a subtle border. Modern Playful component.
class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.icon,
    this.filled = false,
  });

  final String label;
  final Color color;
  final IconData? icon;

  /// When true, renders a solid filled pill (color bg + white text/icon)
  /// instead of the default translucent gradient. Use for high-emphasis
  /// statuses (e.g. "Terlambat", "Absen").
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final textColor = filled ? Colors.white : color;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm + 2,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        gradient: filled
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  color,
                  Color.lerp(color, Colors.black, 0.15)!,
                ],
              )
            : LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  color.withValues(alpha: 0.16),
                  color.withValues(alpha: 0.08),
                ],
              ),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: filled ? null : Border.all(color: color.withValues(alpha: 0.24)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: AppTypography.labelSm.copyWith(
              color: textColor,
              letterSpacing: 0.2,
              fontWeight: filled ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
