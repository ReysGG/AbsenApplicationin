---
name: flutter-modern-playful-redesign
description: Procedure for redesigning a Flutter app to "Modern Playful" style — gradient tokens, rounded components, per-screen polish, login card+illustration pattern, and safe incremental editing to avoid tool-leak failures.
source: auto-skill
extracted_at: '2026-06-22T11:30:00.000Z'
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

### Login screen — card + illustration layout

Proven pattern when user says "login looks bad": split the screen into two
vertically stacked sections above a scroll view:

1. **Illustration section** — logo pill (gradient) + character image above the card
2. **Card section** — `Container` with `boxShadow` + `border` (not `SolidCard`)
   and a gradient submit button

```dart
// Logo pill
Container(
  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
  decoration: BoxDecoration(
    gradient: LinearGradient(colors: AppColors.headerGradient, ...),
    borderRadius: BorderRadius.circular(AppRadius.full),
    boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.30),
        blurRadius: 20, offset: Offset(0, 8))],
  ),
  child: Row(children: [
    Icon(Icons.verified_rounded, color: Colors.white, size: 20),
    SizedBox(width: 6),
    Text(AppConfig.appName, style: AppTypography.titleLg.copyWith(
        color: Colors.white, fontWeight: FontWeight.w800)),
  ]),
)

// Illustration image (graceful fallback if asset missing)
Image.asset('assets/images/login_illustration.png',
  fit: BoxFit.contain,
  errorBuilder: (context, error, stackTrace) => const SizedBox.shrink())

// Card container (replaces SolidCard for login)
Container(
  decoration: BoxDecoration(
    color: AppColors.surface,
    borderRadius: BorderRadius.circular(AppRadius.xxl),
    border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.6)),
    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08),
        blurRadius: 24, offset: Offset(0, 8))],
  ),
  padding: const EdgeInsets.all(AppSpacing.xl),
  ...
)

// Gradient submit button (replaces solid color)
Container(
  height: 54,
  decoration: BoxDecoration(
    gradient: LinearGradient(colors: AppColors.headerGradient,
        begin: Alignment.topLeft, end: Alignment.bottomRight),
    borderRadius: BorderRadius.circular(AppRadius.xl),
    boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.30),
        blurRadius: 20, offset: Offset(0, 8))],
  ),
  alignment: Alignment.center,
  child: loading ? CircularProgressIndicator(...) : Row(children: [
    Icon(Icons.login_rounded, color: Colors.white),
    Text('Masuk', style: AppTypography.titleLg.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
  ]),
)
```

**Key rules for login redesign:**
- Remove all `fontFamily: 'Inter'` hardcoding from `TextFormField`'s `style:`
- Remove `SolidCard` wrapper — use plain `Container` for full decoration control
- `PageBackground` does not accept `showBlobs:` — remove that parameter
- Image `errorBuilder` signature: `(context, error, stackTrace)` — no underscores to avoid lint

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

## Token gotchas (what doesn't exist vs. what does)

| Tried | Reality |
|---|---|
| `AppSpacing.xxl` | ❌ — `AppSpacing` max is `xl` (32); `xxl` lives on `AppRadius` |
| `AppTypography.titleMd` | ❌ — use `AppTypography.titleLg` |
| `AppTypography.headingMd` | ❌ — use `AppTypography.headlineMd` |
| `AppColors.cardSurface` | ❌ — use `AppColors.surface` |
| `AppColors.headerGradient` | ✅ getter → `List<Color>`, dark-aware |
| `AppRadius.xxl` | ✅ = 24.0 |
| `AppRadius.full` | ✅ = 9999.0 (pills) |
| `SolidCard` for login | ⚠️ works but limits decoration — use plain `Container` instead |
| `PageBackground(showBlobs: true)` | ❌ — `PageBackground` takes only `child:` |

## Home screen redesign patterns (from user screenshot reference)

When the user provides a reference screenshot of a home screen and says "ubah jadi referensi ini",
apply these four changes in order:

### 1. Brand header — deep-indigo + blob decoratives

Replace the flat `brandGradient` header with a deep-purple gradient and decorative
`Stack`-based circles (blobs) in the top-right corner. Use `clipBehavior: Clip.hardEdge`
on the outer `Container` so blobs don't overflow the rounded corners.

```dart
Container(
  clipBehavior: Clip.hardEdge,
  decoration: BoxDecoration(
    gradient: const LinearGradient(
      begin: Alignment.topLeft, end: Alignment.bottomRight,
      colors: [Color(0xFF3B2E8C), Color(0xFF1A1060)],     // deep indigo-purple
    ),
    borderRadius: const BorderRadius.only(
      bottomLeft: Radius.circular(AppRadius.xxl),
      bottomRight: Radius.circular(AppRadius.xxl),
    ),
    boxShadow: [BoxShadow(
      color: const Color(0xFF3B2E8C).withValues(alpha: 0.35),
      blurRadius: 24, offset: const Offset(0, 10),
    )],
  ),
  child: Stack(children: [
    // blob 1 — large, partially off-screen right
    Positioned(right: -30, top: -20, child: Container(
      width: 140, height: 140,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: 0.07),
      ),
    )),
    // blob 2 — smaller, inset
    Positioned(right: 30, top: 30, child: Container(
      width: 90, height: 90,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: 0.05),
      ),
    )),
    // actual content Padding here...
  ]),
)
```

- Avatar size: **56×56** (border: 2px white 45% alpha, bg: white 18% alpha, text 22px w800)
- Add a **motivational subtitle** below the name: time-aware (`h < 10` → "Selamat pagi ☀️",
  `h < 15` → "Semangat bekerja hari ini! 👋", `h < 18` → "Tetap semangat sore ini! 💪",
  else → "Istirahat yang baik ya! 🌙") in `bodySm` at 11px, white 65% alpha.

### 2. Clock card — Row layout with character illustration on the right

Change `_ClockShiftCard` from a centered `Column` to a `Row`: clock details on the
**left** (Expanded), character illustration image on the **right** (fixed size box).
Use `SolidCard(padding: EdgeInsets.zero)` and wrap content in manual `Padding`.

#### ⚠️ Fixing "floating" illustration (image not grounded to bottom of card)

A common bug: the illustration appears to "float" in mid-air rather than sitting at
the card's bottom edge. This happens because `Row` with `crossAxisAlignment.end`
doesn't know its own height when children use dynamic padding.

**Fix — always use `IntrinsicHeight` wrapper + `Align` on the image:**

```dart
IntrinsicHeight(                          // ← tells Row its true height
  child: Padding(
    padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, 0, 0),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.end,  // ← snap children to bottom
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),  // ← push text up
            child: Column(/* clock content */),
          ),
        ),
        // Image: NO fixed SizedBox height — let IntrinsicHeight drive it
        Align(
          alignment: Alignment.bottomCenter,
          child: Image.asset(
            'assets/images/clock_character.png',
            width: 120,                     // only width constraint
            fit: BoxFit.fitWidth,           // height scales from width
            alignment: Alignment.bottomCenter,
          ),
        ),
      ],
    ),
  ),
),
```

**Key rules:**
- Wrap the entire top-section `Padding+Row` in `IntrinsicHeight` — without it,
  `CrossAxisAlignment.end` has no reference height and images float in the center.
- Do **NOT** use `SizedBox(width: W, height: H)` around the image — the fixed height
  creates a sub-box the image floats inside. Use `width:` only on `Image.asset`.
- Use `fit: BoxFit.fitWidth` (not `BoxFit.contain`) so the image fills horizontally
  and its natural aspect ratio determines height — no gaps.
- The text `Expanded` child needs `Padding(bottom: AppSpacing.md)` so the text
  appears vertically centered relative to the taller illustration, while both
  anchored at `crossAxisAlignment.end` (card bottom).
- Apply identically to any other card with a side illustration (e.g. check-in card).

```dart
SolidCard(
  entrance: false,
  padding: EdgeInsets.zero,
  child: Column(children: [
    Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, 0, AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                // circular icon clock badge (40×40, purple bg)
                Container(width: 40, height: 40,
                  decoration: BoxDecoration(shape: BoxShape.circle,
                    color: _purple.withValues(alpha: 0.10)),
                  child: Icon(Icons.access_time_rounded, size: 20, color: _purple)),
                const SizedBox(width: 10),
                // Large time text, left-aligned
                Text(Formatters.time(now), style: AppTypography.display.copyWith(
                  fontSize: 40, fontWeight: FontWeight.w800,
                  letterSpacing: -1.5, color: _purple)),
              ]),
              Text('Waktu Lokal (WIB)', style: AppTypography.bodySm.copyWith(
                color: AppColors.onSurfaceVariant)),
            ],
          )),
          // Character illustration — right side
          SizedBox(width: 110, height: 100,
            child: Image.asset('assets/images/login_illustration.png',
              fit: BoxFit.contain, alignment: Alignment.bottomRight)),
        ],
      ),
    ),
    const Divider(height: 1),
    // Shift row with rounded-square icon badge + WFO chip
    Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.md),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Row(children: [
          Container(width: 32, height: 32,
            decoration: BoxDecoration(color: _purple.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(AppRadius.md)),
            child: Icon(Icons.calendar_today_rounded, size: 16, color: _purple)),
          const SizedBox(width: AppSpacing.sm),
          // "Shift Hari Ini" label + rangeLabel
        ]),
        // WFO pill chip: purple bg 10% + purple text
      ]),
    ),
  ]),
)
```

If a dedicated character asset is not yet available, reuse `assets/images/login_illustration.png`
as a temporary placeholder and note it to the user so they can generate a custom one.

### 3. Check-in / attendance card — fingerprint icon + illustration

- Use `Icons.fingerprint_rounded` (size 30) instead of `Icons.touch_app_rounded`
- Icon container: **56×56**, `AppRadius.xl` corners, gradient from `statusColor`
- Add a small illustration (`Image.asset`, 80×80) on the right of the status row,
  hidden when `hasCheckedOut` (no space needed when done)
- Wrap status row + button in separate `Padding` blocks (card uses `padding: EdgeInsets.zero`)
- Status text style: `AppTypography.titleLg` w800 (was `labelMd` — upgrade for emphasis)

### 4. Hero action button — brand-matched gradient

When the app's brand is deep-indigo/purple, change the check-in button from `AppColors.primary`
(blue) to a matching purple gradient:

```dart
static const _purple = Color(0xFF3B2E8C);
static const _purpleLight = Color(0xFF5B3FBF);

// In button decoration:
gradient: isCheckOut
    ? LinearGradient(colors: AppColors.accentGradient(AppColors.accentRose), ...)
    : const LinearGradient(colors: [_purpleLight, _purple], ...),
```

Use `AppRadius.xl` (not `AppRadius.lg`) on the button for softer, more "playful" corners.
Shadow alpha: 0.38 for purple (slightly stronger than the standard `softGlow` helper).

### 5. Face enroll banner — larger illustration-style layout

Replace the compact 44px icon row with a banner-style card:
- Icon container: **80×80**, `AppRadius.xl`, `pending` color 12% bg
- Icon: `Icons.alarm_rounded` size 40 (matches the reference's clock illustration feel)
- Text: `titleLg` w800 for the heading (`AppTypography.titleLg`, not `labelMd`)
- Arrow: `Icons.arrow_forward_ios_rounded` size 16 in a right-side `Padding`
- Card uses `SolidCard(padding: EdgeInsets.zero)` — manually pad the `Row` children

### SolidCard zero-padding pattern

When a card needs custom internal layout (illustration bleeding to edge, dividers
full-width, etc.), pass `padding: EdgeInsets.zero` to `SolidCard` and add `Padding`
widgets per-section inside:

```dart
SolidCard(
  entrance: false,
  padding: EdgeInsets.zero,   // ← remove default padding
  child: Column(children: [
    Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, 0, AppSpacing.sm),
      child: Row(/* illustration row */),
    ),
    const Divider(height: 1),
    Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: /* action button */,
    ),
  ]),
)
```

---

## Final verification
```powershell
& 'C:\flutter\bin\flutter.bat' analyze          # No issues found
& 'C:\flutter\bin\flutter.bat' build apk --debug  # Built app-debug.apk
```
