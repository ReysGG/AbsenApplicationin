/**
 * lib/appVersion.ts
 *
 * Single source of truth for the displayed app version. Sourced from the
 * build-time env `NEXT_PUBLIC_APP_VERSION` (e.g. set from the package version
 * or the git tag in CI) instead of a hardcoded literal in the UI (audit §11).
 * Falls back to "dev" for local development.
 */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "dev";
