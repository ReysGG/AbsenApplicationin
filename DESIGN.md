---
name: Inovasi Corporate SaaS
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#44474d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777e'
  outline-variant: '#c5c6cd'
  surface-tint: '#515f78'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0d1c32'
  on-primary-container: '#76849f'
  inverse-primary: '#b9c7e4'
  secondary: '#006875'
  on-secondary: '#ffffff'
  secondary-container: '#00e3fd'
  on-secondary-container: '#00616d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b9c7e4'
  on-primary-fixed: '#0d1c32'
  on-primary-fixed-variant: '#39475f'
  secondary-fixed: '#9cf0ff'
  secondary-fixed-dim: '#00daf3'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
---

## Brand & Style

The brand personality is established as **authoritative, innovative, and highly precise**. It balances the legacy of corporate stability with the agility of modern technology. The target audience includes enterprise stakeholders, digital transformation officers, and high-growth operations teams who require a sense of reliability and cutting-edge performance.

The design style is a blend of **Modern Corporate** and **Glassmorphism**. It utilizes a "Layered Intelligence" approach: deep navy primary tones provide a grounded foundation, while translucent surfaces and vibrant cyan accents suggest transparency and technical sophistication. The aesthetic remains clean and minimalist to reduce cognitive load in data-heavy SaaS environments, while "floating" elements and backdrop blurs add a sense of modern depth.

## Colors

The palette is anchored by **Navy (#0A192F)**, used for primary navigation, deep backgrounds, and high-level headings to convey trust. **Cyan (#00E5FF)** serves as the high-energy accent for calls to action and interactive states, cutting through the neutral base to draw attention to critical user paths.

**Emerald Green (#10B981)** is reserved strictly for success states and positive growth metrics. The background utilizes a layered approach of **White (#FFFFFF)** for active cards and **Light Gray (#F8FAFC)** for the application canvas to create subtle structural contrast.

## Typography

This design system uses a dual-font strategy to balance character with utility. **Plus Jakarta Sans** is the display face, used for all headings to provide a modern, friendly yet professional geometric touch. It is set with tighter letter-spacing in larger sizes to maintain a premium "editorial" look.

**Inter** is utilized for all body copy, inputs, and UI labels. Its neutral, high-legibility structure ensures that complex data and long-form dashboard text remain readable at all sizes. For technical data or status labels, use the `label-sm` style with increased tracking for clarity.

## Layout & Spacing

The layout follows a **12-column fluid grid** for desktop, transitioning to a **4-column grid** on mobile. A strict **8px base unit** governs all spatial relationships. 

- **Desktop (1440px+):** Large 40px margins with 24px gutters. Dashboard sidebars are fixed at 280px, with the main content area fluidly expanding.
- **Tablet (768px - 1439px):** Margins reduce to 24px. Sidebar collapses into a rail or hamburger menu.
- **Mobile (<767px):** Margins reduce to 16px. Vertical stacking is enforced for all card-based components.

Padding within cards and containers should be generous (24px to 32px) to maintain the minimalist, airy corporate aesthetic.

## Elevation & Depth

Depth is achieved through a combination of **Ambient Shadows** and **Glassmorphism**. Surfaces do not rely on heavy borders but rather on subtle tonal shifts and soft, multi-layered shadows.

- **Level 1 (Base Cards):** A very soft shadow (0px 4px 20px rgba(10, 25, 47, 0.05)) with a 1px border in `#E2E8F0`.
- **Level 2 (Floating Elements/Dropdowns):** Increased diffusion (0px 12px 32px rgba(10, 25, 47, 0.1)).
- **Level 3 (Modals/Overlays):** Deepest shadow with a backdrop-blur of `12px` and a semi-transparent white fill (`rgba(255, 255, 255, 0.8)`). 

Use "Glassmorphism" selectively for navigation bars and overlay panels to create a sense of verticality and modern tech-sophistication.

## Shapes

The shape language is defined by large, inviting radii that soften the corporate edge of the Navy palette. 

- **Standard UI Elements:** (Buttons, Inputs, Small Cards) use a **12px (`rounded-md`)** radius.
- **Primary Containers:** (Main dashboard cards, Hero sections) use a **24px (`rounded-xl`)** radius.
- **Interactive States:** Subtle 2px inner borders (rings) are used during focus states, specifically in Cyan to indicate activity.

## Components

### Buttons
- **Primary:** Navy background, White text, 12px radius. On hover, background shifts to Cyan with Navy text for a high-contrast state change.
- **Ghost:** Transparent background with a 1px Cyan border. Used for secondary actions.

### Cards
- **Dashboard Cards:** White background, 24px radius, 1px border in `#E2E8F0`. Header sections within cards should have a subtle bottom border.
- **Floating Mockups:** Apply a `24px` radius and a `backdrop-filter: blur(10px)` with a Level 2 shadow to create the "floating" SaaS product effect.

### Input Fields
- **Default:** Light Gray (#F8FAFC) fill with a 12px radius. Transitions to White with a 2px Cyan border on focus. Labels are Inter Medium, 14px.

### Chips & Status
- **Success:** Emerald Green background (10% opacity) with Emerald Green text.
- **Action:** Cyan background (10% opacity) with Navy text.
- Shape: Fully rounded (pill) for status indicators; 8px rounded for category tags.

### Lists
- Clean rows with 16px vertical padding. Use a subtle `#F8FAFC` background hover state. Icons should be monochrome Navy or Cyan to maintain the technical focus.