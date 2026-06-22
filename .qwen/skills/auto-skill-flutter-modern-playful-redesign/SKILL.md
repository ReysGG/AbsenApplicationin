---
name: flutter-modern-playful-redesign
description: Procedure for redesigning a Flutter app to "Modern Playful" style — gradient tokens, rounded components, per-screen polish, and safe incremental editing to avoid tool-leak failures.
source: auto-skill
extracted_at: '2026-06-22T06:46:20.045Z'
---

# Flutter "Modern Playful" Redesign Procedure

## Context
Learned from a multi-session redesign of the AttendX Flutter app. The session
involved heavy use of `Edit` tools that occasionally "leaked" (tool call rendered
as raw text instead of executing). The approach below is battle-tested against
those failure modes.

---

## Phase order

1. **Foundation tokens first** — colors, typography, spacing/radius, ThemeData.
   Every screen pulls from these, so one change fans out everywhere automatically.
2. **Core widgets second** — `SolidCard`, `BrandHeader`, `StatusBadge`,
   `PageBackground`, bottom nav. These are reused across all screens.
3. **Screens last, one at a time** — verify with `flutter analyze` after each.
4. **Full analyze + debug build** at the very end.

---

## Token recipe (Modern Playful)

### Colors (`app_colors.dart`)
- Primary: `#4F46E5` (indigo-600 light) / `#818CF8` (dark)
- Brand gradient 3-stop: `#6366F1 → #7C3AED → #4F46E5`
- `accentGradient(Color c)` helper: `[c, Color.lerp(c, primary, 0.3)]`
- `softGlow(Color c)` → returns `Color` (wrap in `BoxShadow` at call site)
- `headerGradient` getter: dark-aware 3-stop list
- Page bg: `#F5F6FB` light / `#0B0B12` dark

### Typography (`app_typography.dart`)
- Family: `'PlusJakartaSans'` (variable font, single TTF asset)
- `display` w800, headings w700, body w400/w500
- Heading `letterSpacing` −0.5 to −1

### Radius (`app_spacing.dart`)
```dart
sm = 8, md = 12, lg = 16, xl = 20, xxl = 24, xxxl = 28, full = 9999
```

---

## Common Modern Playful patterns

### Gradient rounded-square icon container
```dart
Container(
  width: 44, height: 44,
  decoration: BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topLeft, end: Alignment.bottomRight,
      colors: [tint.withValues(alpha: 0.20), tint.withValues(alpha: 0.08)],
    ),
    borderRadius: BorderRadius.circular(AppRadius.lg),
  ),
  child: Icon(icon, color: tint, size: 22),
)
```

### Gradient pill chip (FilterChip / badge)
```dart
decoration: BoxDecoration(
  gradient: selected ? LinearGradient(colors: AppColors.headerGradient) : null,
  color: selected ? null : AppColors.surface,
  borderRadius: BorderRadius.circular(AppRadius.full),
  boxShadow: selected ? [BoxShadow(color: AppColors.softGlow(AppColors.primary), blurRadius: 12, offset: Offset(0,4), spreadRadius: -3)] : null,
)
```

### Hero card gradient
```dart
decoration: BoxDecoration(
  gradient: LinearGradient(colors: AppColors.headerGradient),
  borderRadius: BorderRadius.circular(AppRadius.xxl),
  boxShadow: [BoxShadow(color: AppColors.softGlow(AppColors.brandMid), blurRadius: 24, offset: Offset(0,10), spreadRadius: -6)],
)
```

### StatusBadge `filled` variant
Add `filled` param: when true → solid gradient bg + white text (w700).
Use for high-emphasis statuses (e.g. `late`, `absent`).

### softGlow usage
`softGlow` returns a `Color`. Always wrap it:
```dart
boxShadow: condition ? [
  BoxShadow(
    color: AppColors.softGlow(buttonColor),
    blurRadius: 20, offset: Offset(0, 8), spreadRadius: -4,
  ),
] : null,
```

---

## Safe editing strategy (avoid tool-leak failures)

When using an AI coding agent prone to tool-call leaks:

1. **One `Edit` call per turn** — never batch multiple edits in one message.
2. **Short, unique `old_string`** — anchor on 1–3 unique lines; avoid huge blocks.
3. **Read the file first** before any Edit (required after compact/session reset).
4. **Verify with Grep after each Edit** — Grep rarely leaks; confirms the edit landed.
5. **Use `write_file` for full rewrites** instead of many small Edits on heavily
   changed files — one big write beats 10 risky edits.
6. **Run `flutter analyze <file>` per screen** before moving to the next one.
   Catches type errors (e.g. `softGlow` returning `Color` instead of `List<BoxShadow>`) immediately.

---

## Verification checklist per screen

- [ ] No hardcoded `fontFamily: 'Inter'` (use `AppTypography.*` or theme default)
- [ ] No raw `circular(N)` literals — all use `AppRadius.*`
- [ ] No hardcoded `Color(0x...)` — all use `AppColors.*`
- [ ] `BoxShape.circle` only for true circles (avatars, dots); icons use rounded-square
- [ ] `flutter analyze` passes with no issues

## Final verification
```powershell
& 'C:\flutter\bin\flutter.bat' analyze          # No issues found
& 'C:\flutter\bin\flutter.bat' build apk --debug  # Built app-debug.apk
```
