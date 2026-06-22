import 'package:flutter/material.dart';

/// AttendX typography scale (Plus Jakarta Sans) — the Modern Playful type
/// family. Variable font, so a single asset covers every weight; the named
/// styles below keep a consistent, readable scale across the app.
abstract final class AppTypography {
  /// Public so screens can reference the family instead of hardcoding a string.
  static const fontFamily = 'Plus Jakarta Sans';
  static const _family = fontFamily;

  static const display = TextStyle(
    fontFamily: _family,
    fontSize: 32,
    height: 40 / 32,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.02 * 32,
  );

  static const headlineLg = TextStyle(
    fontFamily: _family,
    fontSize: 24,
    height: 32 / 24,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.01 * 24,
  );

  static const headlineMd = TextStyle(
    fontFamily: _family,
    fontSize: 20,
    height: 28 / 20,
    fontWeight: FontWeight.w600,
  );

  static const titleLg = TextStyle(
    fontFamily: _family,
    fontSize: 18,
    height: 24 / 18,
    fontWeight: FontWeight.w600,
  );

  static const bodyLg = TextStyle(
    fontFamily: _family,
    fontSize: 16,
    height: 24 / 16,
    fontWeight: FontWeight.w400,
  );

  static const bodyMd = TextStyle(
    fontFamily: _family,
    fontSize: 14,
    height: 20 / 14,
    fontWeight: FontWeight.w400,
  );

  static const bodySm = TextStyle(
    fontFamily: _family,
    fontSize: 12,
    height: 16 / 12,
    fontWeight: FontWeight.w400,
  );

  static const labelMd = TextStyle(
    fontFamily: _family,
    fontSize: 12,
    height: 16 / 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.01 * 12,
  );

  static const labelSm = TextStyle(
    fontFamily: _family,
    fontSize: 10,
    height: 12 / 10,
    fontWeight: FontWeight.w600,
  );
}
