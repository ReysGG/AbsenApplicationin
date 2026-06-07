/**
 * e2e/dashboard.spec.ts
 *
 * E2E tests for dashboard navigation — verifies workspace route protection
 * when the user is not authenticated.
 *
 * Requirements: 18.10
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard navigation (unauthenticated)', () => {
  test('redirects /workspace to /login', async ({ page }) => {
    await page.goto('/workspace')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('redirects /workspace/attendance to /login', async ({ page }) => {
    await page.goto('/workspace/attendance')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('redirects /workspace/workforce to /login', async ({ page }) => {
    await page.goto('/workspace/workforce')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('redirects /workspace/leave to /login', async ({ page }) => {
    await page.goto('/workspace/leave')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('redirects /workspace/reports to /login', async ({ page }) => {
    await page.goto('/workspace/reports')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('redirects /workspace/settings to /login', async ({ page }) => {
    await page.goto('/workspace/settings')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('redirects /workspace/account to /login', async ({ page }) => {
    await page.goto('/workspace/account')
    await expect(page).toHaveURL(/.*login.*/)
  })
})
