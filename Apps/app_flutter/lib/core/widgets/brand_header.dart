import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Corporate brand header band (Talenta/Lark style) used across screens for a
/// consistent look. A blue gradient band with a title, optional back button,
/// optional subtitle, and an optional trailing action.
///
/// Pair with [BrandScaffold] which sets the neutral [AppColors.pageBg].
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
          AppSpacing.md, top + AppSpacing.md, AppSpacing.md, 20),
      decoration: const BoxDecoration(
        color: AppColors.brandMid,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(18),
          bottomRight: Radius.circular(18),
        ),
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
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Inter')),
                if (subtitle != null)
                  Text(subtitle!,
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 13,
                          fontFamily: 'Inter')),
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
    Widget button = Material(
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
