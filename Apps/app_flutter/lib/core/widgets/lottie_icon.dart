import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

/// Thin wrapper around a bundled Lottie asset with sensible defaults.
///
/// Bundled assets live in `assets/anim/`:
///   - success.json  — checkmark celebration (play once)
///   - empty.json     — empty-state illustration (loop)
///   - loading.json   — loader (loop)
class LottieIcon extends StatelessWidget {
  const LottieIcon(
    this.asset, {
    super.key,
    this.size = 120,
    this.repeat = true,
    this.controller,
  });

  /// e.g. `LottieIcon.success` constant below, or any `assets/anim/x.json`.
  final String asset;
  final double size;
  final bool repeat;
  final AnimationController? controller;

  static const success = 'assets/anim/success.json';
  static const empty = 'assets/anim/empty.json';
  static const loading = 'assets/anim/loading.json';

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Lottie.asset(
        asset,
        repeat: repeat,
        controller: controller,
        fit: BoxFit.contain,
        // Graceful fallback if an asset is missing/corrupt.
        errorBuilder: (context, error, stack) =>
            const SizedBox.shrink(),
      ),
    );
  }
}
