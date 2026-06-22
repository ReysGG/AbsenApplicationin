import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The app's page background — a soft vertical wash behind scrollable content
/// ([AppColors.pageGradient]). Modern Playful: a gentle gradient (not flat) that
/// adapts to light/dark mode. Wrap a screen body with this and set the Scaffold
/// background to transparent.
class PageBackground extends StatelessWidget {
  const PageBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: AppColors.pageGradient,
        ),
      ),
      child: child,
    );
  }
}
