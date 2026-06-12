import 'package:flutter/material.dart';

/// Wraps a child with a subtle press-scale microinteraction. The child shrinks
/// slightly while pressed and springs back on release.
///
/// [onTap] is optional — when null the widget is "visual only" and just adds
/// the press-scale feel on top of a child that already handles its own taps
/// (e.g. a [FloatingActionButton] with its own `onPressed`). When provided,
/// [onTap] fires on a completed tap.
///
/// Keep [scale] close to 1.0 so it stays premium, not bouncy.
class Pressable extends StatefulWidget {
  const Pressable({
    super.key,
    required this.child,
    this.onTap,
    this.scale = 0.96,
    this.duration = const Duration(milliseconds: 120),
  });

  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  final Duration duration;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (_down != v) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onTapDown: (_) => _set(true),
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _down ? widget.scale : 1.0,
        duration: widget.duration,
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
