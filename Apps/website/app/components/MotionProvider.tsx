"use client";

/**
 * MotionProvider — wraps the app once with <MotionConfig reducedMotion="user">
 *
 * This makes every Framer Motion / motion/react animation in the entire app
 * automatically respect the user's OS "Reduce Motion" accessibility setting
 * (System Preferences → Accessibility → Reduce Motion on macOS/iOS, or
 *  Settings → Accessibility → Remove Animations on Android/Windows).
 *
 * Canonical fix for: react-doctor/require-reduced-motion (WCAG 2.3.3)
 * Docs: https://react.doctor/docs/rules/react-doctor/require-reduced-motion
 */
import { MotionConfig } from "motion/react";

export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
