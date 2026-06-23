import 'package:flutter/material.dart';

/// AttendX color tokens — redesigned to a vibrant/playful royal purple theme.
/// Centralized so every screen pulls from a single source of truth.
abstract final class AppColors {
  /// Global state to switch color palette between Light and Dark mode.
  /// Set in the root widget before build.
  static bool isDark = false;

  // ── Light Theme Palette (Royal Purple & Indigo) ──────────────────────────
  static const backgroundLight       = Color(0xFFF7F8FB);
  static const surfaceLight          = Color(0xFFFFFFFF);
  static const surfaceDimLight       = Color(0xFFE2E4EB);
  static const surfaceBrightLight    = Color(0xFFF9FAFC);
  static const surfaceContainerLowestLight  = Color(0xFFFFFFFF);
  static const surfaceContainerLowLight     = Color(0xFFF1F3FA);
  static const surfaceContainerLight        = Color(0xFFE8ECF5);
  static const surfaceContainerHighLight    = Color(0xFFDFE4F0);
  static const surfaceContainerHighestLight = Color(0xFFD5DCEB);

  static const onSurfaceLight        = Color(0xFF161726);
  static const onSurfaceVariantLight = Color(0xFF555770);
  static const inverseSurfaceLight   = Color(0xFF2C2D3B);
  static const inverseOnSurfaceLight = Color(0xFFF1F2F9);

  static const outlineLight          = Color(0xFF7E809A);
  static const outlineVariantLight   = Color(0xFFD2D4EA);

  static const primaryLight            = Color(0xFF5B3FBF); // Vibrant Royal Purple
  static const onPrimaryLight          = Color(0xFFFFFFFF);
  static const primaryContainerLight   = Color(0xFF3B2E8C); // Deep indigo-purple
  static const onPrimaryContainerLight = Color(0xFFE5DEFF);
  static const primaryFixedLight       = Color(0xFFE5DEFF);
  static const primaryFixedDimLight    = Color(0xFFC7B8FF);
  static const onPrimaryFixedLight     = Color(0xFF1B0066);

  static const secondaryLight          = Color(0xFF7C3AED); // Secondary Purple
  static const onSecondaryLight        = Color(0xFFFFFFFF);
  static const secondaryContainerLight = Color(0xFFF3E8FF);
  static const onSecondaryContainerLight = Color(0xFF6B21A8);
  static const secondaryFixedLight     = Color(0xFFF3E8FF);
  static const secondaryFixedDimLight  = Color(0xFFE9D5FF);

  static const tertiaryLight          = Color(0xFF0D9488); // Teal
  static const onTertiaryLight        = Color(0xFFFFFFFF);
  static const tertiaryContainerLight = Color(0xFFCCFBF1);

  static const errorLight            = Color(0xFFE11D48); // Rose red
  static const onErrorLight          = Color(0xFFFFFFFF);
  static const errorContainerLight   = Color(0xFFFFE4E6);
  static const onErrorContainerLight = Color(0xFF881337);

  static const successLight = Color(0xFF10B981);
  static const pendingLight = Color(0xFFF59E0B);

  static const surfaceVariantLight = Color(0xFFE5DEFF);
  static const surfaceTintLight    = Color(0xFF5B3FBF);

  // ── Dark Theme Palette (Deep Neon Purple & Charcoal) ─────────────────────
  static const backgroundDark             = Color(0xFF09090E);
  static const surfaceDark                = Color(0xFF12121E);
  static const surfaceDimDark             = Color(0xFF0D0D15);
  static const surfaceBrightDark          = Color(0xFF1B1B2C);
  static const surfaceContainerLowestDark = Color(0xFF07070A);
  static const surfaceContainerLowDark    = Color(0xFF171727);
  static const surfaceContainerDark       = Color(0xFF1E1E34);
  static const surfaceContainerHighDark   = Color(0xFF262640);
  static const surfaceContainerHighestDark= Color(0xFF2E2E4C);

  static const onSurfaceDark        = Color(0xFFF2F2FA);
  static const onSurfaceVariantDark = Color(0xFFAEB2D0);
  static const inverseSurfaceDark   = Color(0xFFE5DEFF);
  static const inverseOnSurfaceDark = Color(0xFF12121E);

  static const outlineDark        = Color(0xFF8C8FA6);
  static const outlineVariantDark = Color(0xFF383857);

  static const primaryDark            = Color(0xFF8B7AE5); // Bright pastel purple
  static const onPrimaryDark          = Color(0xFFFFFFFF);
  static const primaryContainerDark   = Color(0xFF3B2E8C);
  static const onPrimaryContainerDark = Color(0xFFE5DEFF);
  static const primaryFixedDark       = Color(0xFF3B2E8C);
  static const primaryFixedDimDark    = Color(0xFF8B7AE5);
  static const onPrimaryFixedDark     = Color(0xFFE5DEFF);

  static const secondaryDark            = Color(0xFFC084FC); // Pastel secondary purple
  static const onSecondaryDark          = Color(0xFFFFFFFF);
  static const secondaryContainerDark   = Color(0xFF581C87);
  static const onSecondaryContainerDark = Color(0xFFF3E8FF);
  static const secondaryFixedDark       = Color(0xFF581C87);
  static const secondaryFixedDimDark    = Color(0xFFC084FC);

  static const tertiaryDark            = Color(0xFF2DD4BF);
  static const onTertiaryDark          = Color(0xFF115E59);
  static const tertiaryContainerDark   = Color(0xFF134E4A);

  static const errorDark            = Color(0xFFFB7185);
  static const onErrorDark          = Color(0xFFFFFFFF);
  static const errorContainerDark   = Color(0xFF881337);
  static const onErrorContainerDark = Color(0xFFFFE4E6);

  static const successDark = Color(0xFF34D399);
  static const pendingDark = Color(0xFFFBBF24);

  static const surfaceVariantDark = Color(0xFF262640);
  static const surfaceTintDark    = Color(0xFF8B7AE5);

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

  // ── Brand header band (Vibrant Royal Purple Gradient) ─────────────────────
  static const brandStart = Color(0xFF5B3FBF);
  static const brandMid   = Color(0xFF3B2E8C);
  static const brandEnd   = Color(0xFF1A1060);

  /// Two-stop gradient used for brand headers (Royal Purple to Deep Night Purple).
  static List<Color> get brandGradient => isDark
      ? const [Color(0xFF3B2E8C), Color(0xFF1A1060)]
      : const [Color(0xFF5B3FBF), Color(0xFF3B2E8C)];

  static Color get pageBg => isDark ? backgroundDark : const Color(0xFFF5F6FA);

  // ── Modern Playful gradients (theme-aware) ───────────────────────────────
  /// Soft page backdrop: a gentle vertical wash behind scrollable content.
  static List<Color> get pageGradient => isDark
      ? const [Color(0xFF09090E), Color(0xFF12121E)]
      : const [Color(0xFFF5F6FA), Color(0xFFE8ECF5)];

  /// Header / hero gradient that adapts to the active mode (diagonal).
  static List<Color> get headerGradient => isDark
      ? const [Color(0xFF3B2E8C), Color(0xFF1A1060)]
      : const [Color(0xFF5B3FBF), Color(0xFF3B2E8C)];

  /// Bottom navigation gradient (from Image #2 concept: vibrant modern gradient on primary active tab)
  static List<Color> get navActiveGradient => const [
        Color(0xFF5B3FBF),
        Color(0xFF7C3AED),
      ];

  /// Cheerful 2-stop gradient from any accent (e.g. a status or category hue).
  static List<Color> accentGradient(Color c) => [
        Color.lerp(c, Colors.white, isDark ? 0.10 : 0.18)!,
        Color.lerp(c, Colors.black, isDark ? 0.18 : 0.04)!,
      ];

  /// Soft colored glow shadow keyed to an accent — the playful "lift" under a
  /// hero card/button.
  static Color softGlow(Color c) =>
      c.withValues(alpha: isDark ? 0.34 : 0.26);

  // ── Flat card tokens (clean enterprise surfaces with rounded feel) ───────
  static Color get cardBorder =>
      isDark ? const Color(0xFF27273F) : const Color(0xFFEBEBF5);
  static Color get cardShadow =>
      isDark ? const Color(0x33000000) : const Color(0x0E2C2260); // Shadow with low alpha purple tint in light mode

  /// Soft, wide ambient shadow paired with [cardShadow] for layered premium depth.
  static Color get cardShadowAmbient =>
      isDark ? const Color(0x4D000000) : const Color(0x112C2260);

  // ── Accent / category palette ────────────────────────────────────────────
  static const accentViolet = Color(0xFF8B5CF6);
  static const accentCyan   = Color(0xFF06B6D4);
  static const accentGreen  = Color(0xFF10B981);
  static const accentRose   = Color(0xFFF43F5E);
}
