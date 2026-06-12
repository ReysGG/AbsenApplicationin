import 'package:flutter/material.dart';

/// AttendX color tokens — sourced from `DESIGN (1).md` and the mockup
/// (`ubahflutter.md`) Tailwind config. Centralized so every screen pulls from
/// a single source of truth.
abstract final class AppColors {
  /// Global state to switch color palette between Light and Dark mode.
  /// Set in the root widget before build.
  static bool isDark = false;

  // ── Light Theme Palette ──────────────────────────────────────────────────
  static const backgroundLight = Color(0xFFF9F9FF);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const surfaceDimLight = Color(0xFFD8D9E3);
  static const surfaceBrightLight = Color(0xFFF9F9FF);
  static const surfaceContainerLowestLight = Color(0xFFFFFFFF);
  static const surfaceContainerLowLight = Color(0xFFF2F3FD);
  static const surfaceContainerLight = Color(0xFFECEDF7);
  static const surfaceContainerHighLight = Color(0xFFE6E7F2);
  static const surfaceContainerHighestLight = Color(0xFFE1E2EC);

  static const onSurfaceLight = Color(0xFF191B23);
  static const onSurfaceVariantLight = Color(0xFF424754);
  static const inverseSurfaceLight = Color(0xFF2E3038);
  static const inverseOnSurfaceLight = Color(0xFFEFF0FA);

  static const outlineLight = Color(0xFF727785);
  static const outlineVariantLight = Color(0xFFC2C6D6);

  static const primaryLight = Color(0xFF0058BE);
  static const onPrimaryLight = Color(0xFFFFFFFF);
  static const primaryContainerLight = Color(0xFF2170E4);
  static const onPrimaryContainerLight = Color(0xFFFEFCFF);
  static const primaryFixedLight = Color(0xFFD8E2FF);
  static const primaryFixedDimLight = Color(0xFFADC6FF);
  static const onPrimaryFixedLight = Color(0xFF001A42);

  static const secondaryLight = Color(0xFF8127CF);
  static const onSecondaryLight = Color(0xFFFFFFFF);
  static const secondaryContainerLight = Color(0xFF9C48EA);
  static const onSecondaryContainerLight = Color(0xFFFFFBFF);
  static const secondaryFixedLight = Color(0xFFF0DBFF);
  static const secondaryFixedDimLight = Color(0xFFDDB7FF);

  static const tertiaryLight = Color(0xFF924700);
  static const onTertiaryLight = Color(0xFFFFFFFF);
  static const tertiaryContainerLight = Color(0xFFB75B00);

  static const errorLight = Color(0xFFBA1A1A);
  static const onErrorLight = Color(0xFFFFFFFF);
  static const errorContainerLight = Color(0xFFFFDAD6);
  static const onErrorContainerLight = Color(0xFF93000A);

  static const successLight = Color(0xFF2E7D32);
  static const pendingLight = Color(0xFFED6C02);

  static const surfaceVariantLight = Color(0xFFE1E2EC);
  static const surfaceTintLight = Color(0xFF005AC2);

  static const auroraBlueLight = Color(0xFFA9C9FF);
  static const auroraPurpleLight = Color(0xFFD9B8FF);
  static const auroraPinkLight = Color(0xFFFFC9E3);
  static const auroraMintLight = Color(0xFFB8F2E6);
  static const auroraPeachLight = Color(0xFFFFD9B8);

  static const glassFillLight = Color(0xCCFFFFFF);
  static const glassFillStrongLight = Color(0xE6FFFFFF);
  static const glassBorderLight = Color(0x99FFFFFF);
  static const glassBorderSoftLight = Color(0x33FFFFFF);
  static const glassShadowLight = Color(0x1A1B2A4A);
  static const glassHighlightLight = Color(0x66FFFFFF);

  // ── Dark Theme Palette ───────────────────────────────────────────────────
  static const backgroundDark = Color(0xFF07080B);
  static const surfaceDark = Color(0xFF0F111A);
  static const surfaceDimDark = Color(0xFF0B0C12);
  static const surfaceBrightDark = Color(0xFF161824);
  static const surfaceContainerLowestDark = Color(0xFF090A0E);
  static const surfaceContainerLowDark = Color(0xFF121420);
  static const surfaceContainerDark = Color(0xFF171A2B);
  static const surfaceContainerHighDark = Color(0xFF1F2338);
  static const surfaceContainerHighestDark = Color(0xFF272B45);

  static const onSurfaceDark = Color(0xFFF0F2FA);
  static const onSurfaceVariantDark = Color(0xFF9EA5C0);
  static const inverseSurfaceDark = Color(0xFFE1E2EC);
  static const inverseOnSurfaceDark = Color(0xFF191B23);

  static const outlineDark = Color(0xFF8A93B2);
  static const outlineVariantDark = Color(0xFF3E445F);

  static const primaryDark = Color(0xFF3B82F6);
  static const onPrimaryDark = Color(0xFFFFFFFF);
  static const primaryContainerDark = Color(0xFF1E3A8A);
  static const onPrimaryContainerDark = Color(0xFFD8E2FF);
  static const primaryFixedDark = Color(0xFF1E3A8A);
  static const primaryFixedDimDark = Color(0xFF3B82F6);
  static const onPrimaryFixedDark = Color(0xFFD8E2FF);

  static const secondaryDark = Color(0xFFB845FF);
  static const onSecondaryDark = Color(0xFFFFFFFF);
  static const secondaryContainerDark = Color(0xFF581C87);
  static const onSecondaryContainerDark = Color(0xFFF0DBFF);
  static const secondaryFixedDark = Color(0xFF581C87);
  static const secondaryFixedDimDark = Color(0xFFB845FF);

  static const tertiaryDark = Color(0xFFF59E0B);
  static const onTertiaryDark = Color(0xFF1E1B4B);
  static const tertiaryContainerDark = Color(0xFF78350F);

  static const errorDark = Color(0xFFFF5252);
  static const onErrorDark = Color(0xFFFFFFFF);
  static const errorContainerDark = Color(0xFF93000A);
  static const onErrorContainerDark = Color(0xFFFFDAD6);

  static const successDark = Color(0xFF10B981);
  static const pendingDark = Color(0xFFF59E0B);

  static const surfaceVariantDark = Color(0xFF1F2338);
  static const surfaceTintDark = Color(0xFF3B82F6);

  static const auroraBlueDark = Color(0xFF0F2244);
  static const auroraPurpleDark = Color(0xFF280F44);
  static const auroraPinkDark = Color(0xFF440F2D);
  static const auroraMintDark = Color(0xFF0F4432);
  static const auroraPeachDark = Color(0xFF442D0F);

  static const glassFillDark = Color(0xCC0D0F19);
  static const glassFillStrongDark = Color(0xE6080910);
  static const glassBorderDark = Color(0x26FFFFFF);
  static const glassBorderSoftDark = Color(0x0FFFFFFF);
  static const glassShadowDark = Color(0x66000000);
  static const glassHighlightDark = Color(0x1EFFFFFF);

  // ── Dynamic Getters ──────────────────────────────────────────────────────
  static Color get background => isDark ? backgroundDark : backgroundLight;
  static Color get surface => isDark ? surfaceDark : surfaceLight;
  static Color get surfaceDim => isDark ? surfaceDimDark : surfaceDimLight;
  static Color get surfaceBright => isDark ? surfaceBrightDark : surfaceBrightLight;
  static Color get surfaceContainerLowest => isDark ? surfaceContainerLowestDark : surfaceContainerLowestLight;
  static Color get surfaceContainerLow => isDark ? surfaceContainerLowDark : surfaceContainerLowLight;
  static Color get surfaceContainer => isDark ? surfaceContainerDark : surfaceContainerLight;
  static Color get surfaceContainerHigh => isDark ? surfaceContainerHighDark : surfaceContainerHighLight;
  static Color get surfaceContainerHighest => isDark ? surfaceContainerHighestDark : surfaceContainerHighestLight;

  static Color get onSurface => isDark ? onSurfaceDark : onSurfaceLight;
  static Color get onSurfaceVariant => isDark ? onSurfaceVariantDark : onSurfaceVariantLight;
  static Color get inverseSurface => isDark ? inverseSurfaceDark : inverseSurfaceLight;
  static Color get inverseOnSurface => isDark ? inverseOnSurfaceDark : inverseOnSurfaceLight;

  static Color get outline => isDark ? outlineDark : outlineLight;
  static Color get outlineVariant => isDark ? outlineVariantDark : outlineVariantLight;

  static Color get primary => isDark ? primaryDark : primaryLight;
  static Color get onPrimary => isDark ? onPrimaryDark : onPrimaryLight;
  static Color get primaryContainer => isDark ? primaryContainerDark : primaryContainerLight;
  static Color get onPrimaryContainer => isDark ? onPrimaryContainerDark : onPrimaryContainerLight;
  static Color get primaryFixed => isDark ? primaryFixedDark : primaryFixedLight;
  static Color get primaryFixedDim => isDark ? primaryFixedDimDark : primaryFixedDimLight;
  static Color get onPrimaryFixed => isDark ? onPrimaryFixedDark : onPrimaryFixedLight;

  static Color get secondary => isDark ? secondaryDark : secondaryLight;
  static Color get onSecondary => isDark ? onSecondaryDark : onSecondaryLight;
  static Color get secondaryContainer => isDark ? secondaryContainerDark : secondaryContainerLight;
  static Color get onSecondaryContainer => isDark ? onSecondaryContainerDark : onSecondaryContainerLight;
  static Color get secondaryFixed => isDark ? secondaryFixedDark : secondaryFixedLight;
  static Color get secondaryFixedDim => isDark ? secondaryFixedDimDark : secondaryFixedDimLight;

  static Color get tertiary => isDark ? tertiaryDark : tertiaryLight;
  static Color get onTertiary => isDark ? onTertiaryDark : onTertiaryLight;
  static Color get tertiaryContainer => isDark ? tertiaryContainerDark : tertiaryContainerLight;

  static Color get error => isDark ? errorDark : errorLight;
  static Color get onError => isDark ? onErrorDark : onErrorLight;
  static Color get errorContainer => isDark ? errorContainerDark : errorContainerLight;
  static Color get onErrorContainer => isDark ? onErrorContainerDark : onErrorContainerLight;

  static Color get success => isDark ? successDark : successLight;
  static Color get pending => isDark ? pendingDark : pendingLight;

  static Color get surfaceVariant => isDark ? surfaceVariantDark : surfaceVariantLight;
  static Color get surfaceTint => isDark ? surfaceTintDark : surfaceTintLight;

  static Color get auroraBlue => isDark ? auroraBlueDark : auroraBlueLight;
  static Color get auroraPurple => isDark ? auroraPurpleDark : auroraPurpleLight;
  static Color get auroraPink => isDark ? auroraPinkDark : auroraPinkLight;
  static Color get auroraMint => isDark ? auroraMintDark : auroraMintLight;
  static Color get auroraPeach => isDark ? auroraPeachDark : auroraPeachLight;

  static Color get glassFill => isDark ? glassFillDark : glassFillLight;
  static Color get glassFillStrong => isDark ? glassFillStrongDark : glassFillStrongLight;
  static Color get glassBorder => isDark ? glassBorderDark : glassBorderLight;
  static Color get glassBorderSoft => isDark ? glassBorderSoftDark : glassBorderSoftLight;
  static Color get glassShadow => isDark ? glassShadowDark : glassShadowLight;
  static Color get glassHighlight => isDark ? glassHighlightDark : glassHighlightLight;

  // ── Brand gradient (Talenta/Lark-style corporate header band) ────────────
  static const brandStart = Color(0xFF0B5FD6);
  static const brandMid = Color(0xFF2170E4);
  static const brandEnd = Color(0xFF5B8DEF);
  static Color get pageBg => isDark ? backgroundDark : const Color(0xFFF4F6FB);
}
