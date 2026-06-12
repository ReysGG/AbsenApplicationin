import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Animated aurora background — soft pastel glows that drift slowly behind the
/// UI. Uses cheap [RadialGradient] blobs (NOT per-frame [ImageFilter.blur]),
/// so it stays smooth on mid-range phones. Radial gradients with a transparent
/// outer stop are already soft-edged, so no blur filter is needed.
class AuroraBackground extends StatefulWidget {
  const AuroraBackground({
    super.key,
    required this.child,
    this.intensity = 1.0,
  });

  final Widget child;

  /// 0..1 — scales glow opacity. Lower this if a device feels heavy.
  final double intensity;

  @override
  State<AuroraBackground> createState() => _AuroraBackgroundState();
}

class _AuroraBackgroundState extends State<AuroraBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    // One slow controller drives all blobs at different phases — far cheaper
    // than three controllers + a full-screen blur filter.
    _c = AnimationController(vsync: this, duration: const Duration(seconds: 18))
      ..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: RepaintBoundary(
            child: AnimatedBuilder(
              animation: _c,
              builder: (context, _) {
                return CustomPaint(
                  painter: _AuroraPainter(
                    t: _c.value,
                    intensity: widget.intensity,
                  ),
                );
              },
            ),
          ),
        ),
        widget.child,
      ],
    );
  }
}

class _AuroraPainter extends CustomPainter {
  _AuroraPainter({required this.t, required this.intensity});

  final double t; // 0..1 loop
  final double intensity;

  // A blob: base alignment, drift radius, colour, size factor, phase.
  static final _blobs = [
    _Blob(-0.7, -0.7, AppColors.auroraBlue, 0.95, 0.0),
    _Blob(0.8, -0.5, AppColors.auroraPurple, 1.05, 0.33),
    _Blob(0.6, 0.8, AppColors.auroraPink, 0.85, 0.6),
    _Blob(-0.7, 0.7, AppColors.auroraMint, 0.8, 0.85),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    // Base wash
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = AppColors.background,
    );

    final twoPi = 6.28318530718;
    for (final b in _blobs) {
      final phase = (t + b.phase) * twoPi;
      // Gentle elliptical drift around the base alignment.
      final dx = b.ax + 0.18 * _cos(phase);
      final dy = b.ay + 0.18 * _sin(phase * 0.9);
      final center = Offset(
        (dx + 1) / 2 * size.width,
        (dy + 1) / 2 * size.height,
      );
      final radius = size.shortestSide * 0.55 * b.scale;
      final paint = Paint()
        ..shader = RadialGradient(
          colors: [
            b.color.withValues(alpha: 0.45 * intensity),
            b.color.withValues(alpha: 0.0),
          ],
          stops: const [0.0, 1.0],
        ).createShader(Rect.fromCircle(center: center, radius: radius));
      canvas.drawCircle(center, radius, paint);
    }
  }

  // Cheap trig without importing dart:math everywhere.
  double _cos(double x) => _sin(x + 1.5707963);
  double _sin(double x) {
    // Normalize to [-pi, pi]
    const pi = 3.14159265359;
    x = x % (2 * pi);
    if (x > pi) x -= 2 * pi;
    if (x < -pi) x += 2 * pi;
    // Bhaskara approximation — plenty accurate for visuals.
    final b = 4 / pi;
    final c = -4 / (pi * pi);
    final y = b * x + c * x * (x < 0 ? -x : x);
    return y;
  }

  @override
  bool shouldRepaint(_AuroraPainter old) =>
      old.t != t || old.intensity != intensity;
}

class _Blob {
  const _Blob(this.ax, this.ay, this.color, this.scale, this.phase);
  final double ax;
  final double ay;
  final Color color;
  final double scale;
  final double phase;
}
