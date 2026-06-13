import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Staggered entrance wrapper: fades + slides its [child] in, optionally after
/// [delay].
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
    this.duration = const Duration(milliseconds: 320),
  });

  final Widget child;
  final Duration delay;
  final double slideBegin;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    return child
        .animate(delay: delay)
        .fadeIn(duration: duration, curve: Curves.easeOut)
        .slideY(begin: slideBegin, duration: duration, curve: Curves.easeOut);
  }
}
