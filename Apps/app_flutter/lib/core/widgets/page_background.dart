import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The app's flat page background — a calm, neutral surface
/// ([AppColors.pageBg]) behind scrollable content. Corporate Modern: no
/// gradient or glow (see DESIGN.md). Wrap a screen body with this and set the
/// Scaffold background to transparent.
class PageBackground extends StatelessWidget {
  const PageBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.pageBg,
      child: child,
    );
  }
}
