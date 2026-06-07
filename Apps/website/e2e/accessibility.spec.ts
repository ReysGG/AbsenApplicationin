/**
 * e2e/accessibility.spec.ts
 *
 * Basic accessibility E2E tests — verify semantic form structure and ARIA
 * attributes on key public pages without requiring a live backend.
 *
 * Requirements: 18.10, 19.2–19.8
 */

import { test, expect } from '@playwright/test'

// ── Login page ────────────────────────────────────────────────────────────────

test('login page has proper form labels', async ({ page }) => {
  await page.goto('/login')
  // Inputs must be labelled
  const emailInput = page.getByLabel('Email')
  await expect(emailInput).toBeVisible()
  const passwordInput = page.getByLabel('Password')
  await expect(passwordInput).toBeVisible()
})

test('login page submit button has accessible name', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible()
})

test('login page email validation error uses role=alert', async ({ page }) => {
  await page.goto('/login')
  // Submit with an invalid email to trigger client-side validation
  await page.getByLabel('Email').fill('bukan-email')
  await page.getByLabel('Password').fill('password1A')
  await page.getByRole('button', { name: 'Masuk' }).click()
  // The error paragraph must carry role="alert"
  const alert = page.locator('[role="alert"]').first()
  await expect(alert).toBeVisible()
})

// ── Forgot-password page ──────────────────────────────────────────────────────

test('forgot-password page has proper structure', async ({ page }) => {
  await page.goto('/forgot-password')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByRole('button', { name: /Kirim/i })).toBeVisible()
})

test('forgot-password page email field is type=email', async ({ page }) => {
  await page.goto('/forgot-password')
  const emailInput = page.getByLabel('Email')
  await expect(emailInput).toHaveAttribute('type', 'email')
})

// ── HTML lang attribute ───────────────────────────────────────────────────────

test('root html element has lang=id', async ({ page }) => {
  await page.goto('/login')
  const lang = await page.evaluate(() => document.documentElement.lang)
  expect(lang).toBe('id')
})
