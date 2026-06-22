import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Staggered entrance wrapper: fades + slides (+ a subtle scale) its [child]
/// in, optionally after [delay].
///
/// Use this instead of calling `.animate()` directly on widgets that expose
/// their own `animate`/`entrance` member (which would shadow the
/// flutter_animate extension). Because [child] is typed as a plain [Widget]
/// here, the `.animate()` extension resolves correctly.
class AnimatedEntrance extends StatelessWidget {
  const AnimatedEntrance({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.slideBegin = 0.06,
    this.duration = const Duration(milliseconds: 340),
    this.curve = Curves.easeOutCubic,
    this.scaleBegin = 0.98,
  });

  final Widget child;
  final Duration delay;
  final double slideBegin;
  final Duration duration;
  final Curve curve;

  /// Starting scale for a gentle "pop". 1.0 disables the scale entirely.
  final double scaleBegin;

  @override
  Widget build(BuildContext context) {
    var anim = child
        .animate(delay: delay)
        .fadeIn(duration: duration, curve: Curves.easeOut)
        .slideY(begin: slideBegin, duration: duration, curve: curve);
    if (scaleBegin != 1.0) {
      anim = anim.scaleXY(
        begin: scaleBegin,
        end: 1.0,
        duration: duration,
        curve: curve,
      );
    }
    return anim;
  }
}
