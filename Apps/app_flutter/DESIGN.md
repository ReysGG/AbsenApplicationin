# Design Direction — AttendX Mobile

The source of truth for the Flutter app's look and feel. Derived from the
workspace-wide `DESIGN (1).md` ("AttendX Workspace", Corporate Modern) and
adapted for a focused, single-hand mobile employee app. Values here mirror the
tokens in `lib/core/theme/` — keep them in sync.

## Theme
**Corporate Modern** — clean, high-trust, professional. Clarity over decoration:
generous whitespace, a disciplined 4px rhythm, flat surfaces with hairline
borders and a single soft ambient shadow. The interface should feel
institutional yet modern (think Talenta / Lark / Stripe dashboard), never
playful or decorative.

Modes: **light only** (primary). The app is locked to light mode in `app.dart`
so a phone's system dark setting can't render half-tuned dark surfaces. A dark
palette exists in tokens but is not shipped; do not rely on it.

## Stack (detected)
- Framework: Flutter + Dart (SDK ^3.11), Material 3 (`useMaterial3: true`)
- State / routing: Riverpod + go_router
- Networking: dio
- Motion: flutter_animate, lottie, rive (used sparingly, see Motion)
- Maps: flutter_map (OpenStreetMap tiles)
- Fonts: **Inter** (bundled asset, weights 400/500/600/700)
- Icons: Material (`Icons.*`, prefer the `_outlined` variants for inactive)

## Color tokens (light — `AppColors`)
Background / page: `#F8F9FA` (scaffold) · `#F6F7F9` (`pageBg` behind cards)
Surface (cards/sheets): `#FFFFFF`
Card border (hairline): `#E8EAF0` · Card shadow: `#172B4D` @ 6% (`0x0F172B4D`)
Foreground: `#191C1D` · Muted foreground: `#434654`
Outline / outline-variant: `#737685` / `#C3C6D6`
**Primary** (corporate blue): `#0052CC` (brand band + actions), deep `#003D9B`
for high-emphasis text-on-light; on-primary `#FFFFFF`. Kept as the existing blue
family for consistency across the shipped app (not re-hued to the doc's #3B82F6).
Secondary (supporting blue): `#4C5E83`. The doc's purple "role accent" is for the
admin **web** dashboard only — the mobile employee app does not use it.
Semantic — success `#10B981` · pending/warning `#F59E0B` · error `#BA1A1A`
All text/surface pairs must meet WCAG AA (§ verify with contrast before shipping
new pairs). State is never signalled by color alone — pair with icon + label.

## Typography (`AppTypography`, Inter)
Type scale (size / line-height / weight):
- display 32 / 40 / 700 (tight tracking)
- headlineLg 24 / 32 / 600
- headlineMd 20 / 28 / 600
- titleLg 18 / 24 / 600
- bodyLg 16 / 24 / 400
- bodyMd 14 / 20 / 400  ← default body
- bodySm 12 / 16 / 400
- labelMd 12 / 16 / 500
- labelSm 10 / 12 / 600 (category/section labels)
One scale only — never type a one-off font size into a widget.

## Spacing & layout (`AppSpacing`)
4px baseline. Scale: xs 4 · sm 8 · md 16 · lg 24 · xl 32 · gutter 16.
- Screen horizontal margin: `md` (16).
- Card internal padding: `md` (16) default; `lg` (24) for spacious detail cards.
- Spacing between major sections: `lg` (24).
- Single-column, content scrolls; design for small phones first, tolerate large
  screens (cap content width / center where it would otherwise stretch).

## Shape & depth (`AppRadius`)
Soft-square: sm 4 · md 8 · **lg 12** (buttons, inputs, chips wells) · **xl 16**
(cards, sheets, map) · full (badges, avatars, nav pills).
Depth is restrained and flat: **one** ambient shadow on cards
(`blur 16, y+3, navy @ 6%`) over a 1px border. No elevation change on press —
use a subtle background/scale shift instead. **No glassmorphism, no blur, no
gradients.**

## Motion
Durations 120–350ms, ease-out curves; respect reduced-motion intent (keep it
subtle). Allowed: card fade/slide-in on first build (~240–280ms), press-scale
(`Pressable`, ~0.96), nav pill slide + icon bounce, lottie/rive for
loading/empty/success states. Motion communicates, it doesn't decorate.

## Principles & non-goals
- **Flat, not frosted.** Solid token surfaces + hairline border + one soft
  shadow. No `BackdropFilter`/blur, no translucent "glass" fills.
- **No gradients / no aurora.** Color comes from the palette and carries meaning.
- **Tokens, not magic values.** Every color/size/space/radius comes from
  `AppColors` / `AppSpacing` / `AppRadius` / `AppTypography`. No raw hex or
  one-off sizes in feature widgets.
- **One card.** A single flat card primitive (`SolidCard`); don't fork new card
  styles per screen.
- **Every state.** Loading (skeleton/lottie), empty (what + why + next action),
  error (human message + retry), success, disabled — not just the happy path.
- **Accessible.** Real semantics, `tooltip`/`Semantics` labels on icon-only
  buttons, AA contrast, ≥44px touch targets, visible focus.
- **Real content.** Indonesian UI copy, real labels — no lorem, no emoji as UI.
- References (inspiration, not to clone): Mekari Talenta, Lark, Linear, Stripe.
