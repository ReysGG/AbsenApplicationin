/**
 * e2e/auth.spec.ts
 *
 * E2E tests for authentication flows.
 *
 * These tests verify structure and behaviour without requiring a live backend;
 * they run against the Next.js dev/production server only.
 *
 * Requirements: 18.10
 */

import { test, expect } from '@playwright/test'

// ── Login page renders correctly ──────────────────────────────────────────────

test('login page renders correctly', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Masuk ke akun Anda' })).toBeVisible()
  await expect(page.getByLabel('Email kerja')).toBeVisible()
  await expect(page.getByLabel('Kata sandi')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Masuk ke dashboard' })).toBeVisible()
})

// ── Invalid login shows generic error (no email enumeration) ─────────────────

test('invalid login shows generic error', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email kerja').fill('invalid@test.com')
  // Fill password using the label that matches the visible "Password" label
  await page.getByLabel('Kata sandi').fill('wrongpassword123')
  await page.getByRole('button', { name: 'Masuk ke dashboard' }).click()
  // Error should be generic — must not reveal whether the email exists (R1.2)
  await expect(page.getByRole('alert')).toContainText('tidak valid')
})

// ── Protected routes redirect to login when unauthenticated ──────────────────

test('protected /workspace/overview redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/workspace/overview')
  await expect(page).toHaveURL(/.*login.*/)
})

test('protected /workspace/attendance redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/workspace/attendance')
  await expect(page).toHaveURL(/.*login.*/)
})

test('protected /workspace/workforce redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/workspace/workforce')
  await expect(page).toHaveURL(/.*login.*/)
})

// ── Forgot-password page renders ─────────────────────────────────────────────

test('forgot-password page renders correctly', async ({ page }) => {
  await page.goto('/forgot-password')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByRole('button', { name: /Kirim/i })).toBeVisible()
})
