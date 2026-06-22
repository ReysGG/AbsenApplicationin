import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'pressable.dart';

/// Brand header band used across screens for a consistent look. Modern Playful:
/// a soft diagonal brand gradient, rounded bottom corners, and a gentle colored
/// lift. Carries a title, optional back button, optional subtitle, and an
/// optional trailing action.
///
/// Pair with a transparent Scaffold over [PageBackground].
class BrandHeader extends StatelessWidget {
  const BrandHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.showBack = false,
    this.onBack,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final bool showBack;
  final VoidCallback? onBack;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    final tr = trailing;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(
          AppSpacing.md, top + AppSpacing.md, AppSpacing.md, AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: AppColors.headerGradient,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(AppRadius.xxl),
          bottomRight: Radius.circular(AppRadius.xxl),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.softGlow(AppColors.brandStart),
            blurRadius: 24,
            offset: const Offset(0, 10),
            spreadRadius: -8,
          ),
        ],
      ),
      child: Row(
        children: [
          if (showBack)
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.xs),
              child: Material(
                color: Colors.white.withValues(alpha: 0.18),
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: onBack ?? () => Navigator.of(context).maybePop(),
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.arrow_back_ios_new_rounded,
                        color: Colors.white, size: 18),
                  ),
                ),
              ),
            ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: AppTypography.headlineMd.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    )),
                if (subtitle != null)
                  Text(subtitle!,
                      style: AppTypography.bodySm.copyWith(
                        color: Colors.white.withValues(alpha: 0.88),
                      )),
              ],
            ),
          ),
          // ignore: use_null_aware_elements
          if (tr != null) tr,
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 350.ms)
        .slideY(begin: -0.15, curve: Curves.easeOut);
  }
}

/// A round translucent icon button for use as a [BrandHeader] trailing action.
class BrandHeaderAction extends StatelessWidget {
  const BrandHeaderAction({
    super.key,
    required this.icon,
    required this.onTap,
    this.tooltip,
    this.badge = false,
  });

  final IconData icon;
  final VoidCallback onTap;

  /// Accessibility label / hover hint. Icon-only buttons must describe their
  /// action for screen readers (see DESIGN.md a11y principles).
  final String? tooltip;
  final bool badge;

  @override
  Widget build(BuildContext context) {
    final inner = Icon(icon, color: Colors.white, size: 22);
    Widget button = Pressable(
      child: Material(
        color: Colors.white.withValues(alpha: 0.18),
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: badge ? Badge(smallSize: 8, child: inner) : inner,
          ),
        ),
      ),
    );
    final label = tooltip;
    if (label != null) {
      button = Tooltip(
        message: label,
        child: Semantics(button: true, label: label, child: button),
      );
    }
    return button;
  }
}
