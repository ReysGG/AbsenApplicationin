# Accessibility Notes — AttendX Web Dashboard

## Forms

- All form inputs use semantic `<label>` elements with `htmlFor` linked to the input `id`.
- Error messages are rendered with `role="alert"` so screen readers announce them immediately.
- Inputs carry `aria-invalid` when validation fails and `aria-describedby` pointing to the
  error paragraph, providing additional context to assistive technologies.
- Password hint text is linked via `aria-describedby` in the account page.

## Status Indicators

- Status badges (AttendanceStatus, EmploymentStatus, LeaveStatus) always include a **text
  label** alongside colour — colour is never the sole indicator of meaning.
  Example: a "Terlambat" badge uses both an amber background and the word "Terlambat".

## Keyboard Navigation

- All interactive elements (buttons, links, form controls) are natively focusable and
  reachable via `Tab`.
- Disabled navigation items in the sidebar use `aria-disabled="true"` and
  `aria-label="… (tidak tersedia)"` instead of being removed from the DOM, so keyboard
  users are aware of their existence.
- Modal dialogs / drawers implement focus trapping where relevant.

## ARIA Landmarks

- The sidebar uses `<nav aria-label="Navigasi utama">`.
- The mobile drawer uses `<aside aria-label="Menu navigasi mobile">`.
- Main content is wrapped in `<main>`.

## Language

- The root `<html>` element has `lang="id"` (Indonesian) set in `app/layout.tsx`.
- This enables screen readers to use the correct voice/language engine.

## Colour Contrast

- Text and UI colours use Tailwind's `slate` / `gray` palette which meets WCAG AA
  contrast ratio (≥ 4.5 : 1 for normal text, ≥ 3 : 1 for large text) under default
  configurations.

## Alerts & Live Regions

- Server error messages and success notifications use `role="alert"` or `role="status"`
  to ensure they are announced by screen readers without requiring focus.

---

> **Note:** Full WCAG 2.1 AA validation requires manual testing with assistive technologies
> (NVDA, VoiceOver, JAWS) and an expert accessibility review. The patterns above are
> designed to meet WCAG AA requirements but automated tooling alone is not sufficient for
> complete validation.
