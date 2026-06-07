---
name: AttendX Workspace
colors:
  surface: '#f9f9ff'
  surface-dim: '#d8d9e3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fd'
  surface-container: '#ecedf7'
  surface-container-high: '#e6e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#424754'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#eff0fa'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#8127cf'
  on-secondary: '#ffffff'
  secondary-container: '#9c48ea'
  on-secondary-container: '#fffbff'
  tertiary: '#924700'
  on-tertiary: '#ffffff'
  tertiary-container: '#b75b00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#f9f9ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  gutter: 1.5rem
  sidebar_width: 260px
  topbar_height: 64px
---

## Brand & Style

The design system is engineered for **AttendX Workspace**, focusing on precision, high-trust, and professional efficiency. It serves a tenant-level SaaS environment where data clarity and administrative speed are paramount.

The visual style is **Corporate Modern**, characterized by:
- **Clarity over Decoration:** High whitespace and a disciplined grid ensure that complex attendance data remains legible and actionable.
- **Systematic Reliability:** A neutral base palette allows functional accents (Status colors) to communicate information instantly without cognitive overload.
- **Functional Professionalism:** The interface feels institutional yet modern, utilizing subtle shadows and refined borders to establish a clear information hierarchy.

## Colors

The palette is rooted in a "Clean Slate" philosophy. The background uses a cool slate tint to reduce eye strain during long working sessions, while primary surfaces remain pure white to denote importance.

- **Primary Accent (#3B82F6):** Used for primary actions, active navigation states, and focus indicators.
- **Role Accent (#A855F7):** Reserved for administrative or elevated permissions to distinguish them from standard user tasks.
- **Semantic Palette:** Green, Yellow, and Red are strictly reserved for status communication (e.g., Present, Late, Absent).
- **Interactive States:** Use a 10% opacity overlay of the primary color for hover states on light surfaces, and a darkened shade for button active states.

## Typography

This design system utilizes **Inter** exclusively to leverage its systematic, utilitarian nature. It is optimized for screen readability and high-density data.

- **Headlines:** Use tighter letter spacing and semi-bold weights to create a strong visual anchor for page titles.
- **Data Tables:** Use `body-md` for row content to maximize information density while maintaining legibility.
- **Labels:** `label-sm` is used for category headers and table headers, always in uppercase with increased letter spacing to differentiate from interactive text.

## Layout & Spacing

The layout follows a **Fluid Grid** model with fixed structural containers for navigation. 

- **Sidebar:** Fixed at 260px. It should be persistent on desktop and collapsible into a drawer on mobile devices.
- **Topbar:** Fixed at 64px. It contains global search, notifications, and profile management.
- **Content Area:** Utilizes a 12-column grid. On desktop, the horizontal margins are 24px (`lg`). On mobile, margins reduce to 16px (`md`).
- **Spacing Rhythm:** Based on a 4px (0.25rem) baseline. Use `md` (16px) for internal card padding and `lg` (24px) for spacing between major sections.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a focused workspace hierarchy.

- **Level 0 (Background):** #F8FAFC. The lowest layer.
- **Level 1 (Cards/Sheets):** White surface with a 1px border (#E2E8F0) and a subtle shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)`.
- **Level 2 (Dropdowns/Modals):** White surface with a more pronounced shadow to indicate temporary overlay: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`.
- **Interactions:** Elements should not "lift" on hover; instead, use subtle background color shifts to maintain the flat, professional SaaS aesthetic.

## Shapes

The shape language is "Soft-Square," balancing approachable curves with professional structure.

- **Standard Elements:** Buttons and Input fields use `rounded-lg` (8px).
- **Containers:** Cards and Modals use `rounded-xl` (12px) to soften the large surface areas.
- **Functional Elements:** Status badges and avatars use the `full` (pill) setting to distinguish them from structural UI components like buttons.

## Components

- **Sidebar Navigation:** Items have a height of 40px. Active state features a 4px blue left border, a light blue background (#EFF6FF), and blue text (#3B82F6). Icons should use Material Symbols Outlined.
- **Buttons:** 
    - *Primary:* Blue-600 background, white text. 
    - *Secondary:* White background, Gray-200 border, Gray-700 text.
- **Status Badges:** Pill-shaped with 10% opacity background of the status color and 100% opacity text. Include a 1px border of the status color at 20% opacity.
- **Cards:** White background, 1px Gray-200 border, 12px corner radius. Internal padding should be a consistent 24px.
- **Data Tables:**
    - Header: Gray-50 background, uppercase bold text, 1px bottom border.
    - Rows: White background, 1px bottom border (#E2E8F0).
    - Hover: Apply #F1F5F9 background to the entire row.
- **Input Fields:** 1px Gray-200 border, 8px radius. On focus, transition to 1px Primary Blue border with a 3px light blue outer glow.