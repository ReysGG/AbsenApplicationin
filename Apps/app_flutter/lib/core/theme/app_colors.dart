import 'package:flutter/material.dart';

/// AttendX color tokens — sourced from `DESIGN (1).md` and the mockup
/// (`ubahflutter.md`) Tailwind config. Centralized so every screen pulls from
/// a single source of truth.
abstract final class AppColors {
  // Surfaces & background
  static const background = Color(0xFFF9F9FF);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceDim = Color(0xFFD8D9E3);
  static const surfaceBright = Color(0xFFF9F9FF);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const surfaceContainerLow = Color(0xFFF2F3FD);
  static const surfaceContainer = Color(0xFFECEDF7);
  static const surfaceContainerHigh = Color(0xFFE6E7F2);
  static const surfaceContainerHighest = Color(0xFFE1E2EC);

  static const onSurface = Color(0xFF191B23);
  static const onSurfaceVariant = Color(0xFF424754);
  static const inverseSurface = Color(0xFF2E3038);
  static const inverseOnSurface = Color(0xFFEFF0FA);

  static const outline = Color(0xFF727785);
  static const outlineVariant = Color(0xFFC2C6D6);

  // Primary
  static const primary = Color(0xFF0058BE);
  static const onPrimary = Color(0xFFFFFFFF);
  static const primaryContainer = Color(0xFF2170E4);
  static const onPrimaryContainer = Color(0xFFFEFCFF);
  static const primaryFixed = Color(0xFFD8E2FF);
  static const primaryFixedDim = Color(0xFFADC6FF);
  static const onPrimaryFixed = Color(0xFF001A42);

  // Secondary (role accent / purple)
  static const secondary = Color(0xFF8127CF);
  static const onSecondary = Color(0xFFFFFFFF);
  static const secondaryContainer = Color(0xFF9C48EA);
  static const onSecondaryContainer = Color(0xFFFFFBFF);
  static const secondaryFixed = Color(0xFFF0DBFF);
  static const secondaryFixedDim = Color(0xFFDDB7FF);

  // Tertiary
  static const tertiary = Color(0xFF924700);
  static const onTertiary = Color(0xFFFFFFFF);
  static const tertiaryContainer = Color(0xFFB75B00);

  // Semantic / status
  static const error = Color(0xFFBA1A1A);
  static const onError = Color(0xFFFFFFFF);
  static const errorContainer = Color(0xFFFFDAD6);
  static const onErrorContainer = Color(0xFF93000A);

  static const success = Color(0xFF2E7D32);
  static const pending = Color(0xFFED6C02);

  static const surfaceVariant = Color(0xFFE1E2EC);
  static const surfaceTint = Color(0xFF005AC2);
}
