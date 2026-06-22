import 'package:flutter/material.dart';

/// AttendX color tokens — sourced from `DESIGN (1).md` and the mockup
/// (`ubahflutter.md`) Tailwind config. Centralized so every screen pulls from
/// a single source of truth.
abstract final class AppColors {
  /// Global state to switch color palette between Light and Dark mode.
  /// Set in the root widget before build.
  static bool isDark = false;

  // ── Light Theme Palette ──────────────────────────────────────────────────
  static const backgroundLight = Color(0xFFF8F9FA);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const surfaceDimLight = Color(0xFFD9DADB);
  static const surfaceBrightLight = Color(0xFFF8F9FA);
  static const surfaceContainerLowestLight = Color(0xFFFFFFFF);
  static const surfaceContainerLowLight = Color(0xFFF3F4F5);
  static const surfaceContainerLight = Color(0xFFEDEEEF);
  static const surfaceContainerHighLight = Color(0xFFE7E8E9);
  static const surfaceContainerHighestLight = Color(0xFFE1E3E4);

  static const onSurfaceLight = Color(0xFF191C1D);
  static const onSurfaceVariantLight = Color(0xFF434654);
  static const inverseSurfaceLight = Color(0xFF2E3132);
  static const inverseOnSurfaceLight = Color(0xFFF0F1F2);

  static const outlineLight = Color(0xFF737685);
  static const outlineVariantLight = Color(0xFFC3C6D6);

  static const primaryLight = Color(0xFF003D9B);
  static const onPrimaryLight = Color(0xFFFFFFFF);
  static const primaryContainerLight = Color(0xFF0052CC);
  static const onPrimaryContainerLight = Color(0xFFC4D2FF);
  static const primaryFixedLight = Color(0xFFDAE2FF);
  static const primaryFixedDimLight = Color(0xFFB2C5FF);
  static const onPrimaryFixedLight = Color(0xFF001848);

  static const secondaryLight = Color(0xFF4C5E83);
  static const onSecondaryLight = Color(0xFFFFFFFF);
  static const secondaryContainerLight = Color(0xFFBFD2FD);
  static const onSecondaryContainerLight = Color(0xFF475A7E);
  static const secondaryFixedLight = Color(0xFFD7E2FF);
  static const secondaryFixedDimLight = Color(0xFFB4C7F1);

  static const tertiaryLight = Color(0xFF004E32);
  static const onTertiaryLight = Color(0xFFFFFFFF);
  static const tertiaryContainerLight = Color(0xFF006844);

  static const errorLight = Color(0xFFBA1A1A);
  static const onErrorLight = Color(0xFFFFFFFF);
  static const errorContainerLight = Color(0xFFFFDAD6);
  static const onErrorContainerLight = Color(0xFF93000A);

  static const successLight = Color(0xFF10B981);
  static const pendingLight = Color(0xFFF59E0B);

  static const surfaceVariantLight = Color(0xFFE1E2EC);
  static const surfaceTintLight = Color(0xFF005AC2);

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
  static const onSurfaceVariantDark = Color(0xFFAEB6D0);
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

  // ── Brand header band (subtle premium gradient — deep, not flashy) ───────
  static const brandStart = Color(0xFF0A5BDB);
  static const brandMid = Color(0xFF0052CC);
  static const brandEnd = Color(0xFF003D9B);
  /// Two-stop hero gradient used on brand headers (top-left → bottom-right).
  static const List<Color> brandGradient = [brandStart, brandEnd];
  static Color get pageBg => isDark ? backgroundDark : const Color(0xFFF6F7F9);

  // ── Modern Playful gradients (theme-aware) ───────────────────────────────
  /// Soft page backdrop: a gentle vertical wash behind scrollable content.
  /// Light = near-white → faint cool tint; dark = two deep blue-greys.
  static List<Color> get pageGradient => isDark
      ? const [Color(0xFF0B0C12), Color(0xFF10131F)]
      : const [Color(0xFFF7F8FB), Color(0xFFEDF1FB)];

  /// Header / hero gradient that adapts to the active mode (diagonal).
  static List<Color> get headerGradient => isDark
      ? const [Color(0xFF1B3A86), Color(0xFF0C1E54)]
      : const [brandStart, brandEnd];

  /// Cheerful 2-stop gradient from any accent (e.g. a status or category hue).
  /// Used for hero icon containers and pill fills.
  static List<Color> accentGradient(Color c) => [
        Color.lerp(c, Colors.white, isDark ? 0.10 : 0.18)!,
        Color.lerp(c, Colors.black, isDark ? 0.18 : 0.04)!,
      ];

  /// Soft colored glow shadow keyed to an accent — the playful "lift" under a
  /// hero card/button. Subtle by design (low alpha) to stay tasteful.
  static Color softGlow(Color c) =>
      c.withValues(alpha: isDark ? 0.34 : 0.26);

  // ── Flat card tokens (clean enterprise surfaces) ─────────────────────────
  static Color get cardBorder =>
      isDark ? const Color(0xFF272B45) : const Color(0xFFE8EAF0);
  static Color get cardShadow =>
      isDark ? const Color(0x33000000) : const Color(0x12172B4D);

  /// Soft, wide ambient shadow paired with [cardShadow] for layered premium
  /// depth (the diffuse "float" under a card).
  static Color get cardShadowAmbient =>
      isDark ? const Color(0x4D000000) : const Color(0x14172B4D);

  // ── Accent / category palette ────────────────────────────────────────────
  // Functional hues for categorizing items (home quick-action tiles, leave
  // types). Each carries category meaning, not decoration. `accentViolet`
  // matches the workspace secondary (#8127CF). Single value — app ships light.
  static const accentViolet = Color(0xFF8127CF);
  static const accentCyan = Color(0xFF0891B2);
  static const accentGreen = Color(0xFF0E9F6E);
  static const accentRose = Color(0xFFE11D48);
}
