import process from 'node:process'
import {defineConfig, devices} from '@playwright/test'

export default defineConfig({
  timeout: 30 * 1000,
  expect: {timeout: 5000},
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: !!process.env.CI,
  },
  projects: [
    // ── UI tests — page/component integrity ──────────────────────────────────
    // Validates that pages and major UI elements render and are visible.
    // Runs on desktop, mobile, and tablet to cover responsive layouts.
    {name: 'ui-desktop', testDir: './e2e/ui', use: {...devices['Desktop Chrome']}},
    {name: 'ui-mobile', testDir: './e2e/ui', use: {...devices['Pixel 5']}},
    {name: 'ui-tablet', testDir: './e2e/ui', use: {...devices['iPad (gen 7)']}},

    // ── Feature tests — behaviors and expected state ──────────────────────────
    // Tests feature-level behaviors that require a real browser (locale, theme, etc.).
    // Chrome only — cross-browser coverage is handled by E2E flow tests.
    {name: 'features', testDir: './e2e/features', use: {...devices['Desktop Chrome']}},

    // ── E2E flows — full user scenarios ──────────────────────────────────────
    // Tests complete user journeys end-to-end across all supported browsers.
    {name: 'flows-chromium', testDir: './e2e/flows', use: {...devices['Desktop Chrome']}},
    {name: 'flows-firefox', testDir: './e2e/flows', use: {...devices['Desktop Firefox']}},
    {name: 'flows-webkit', testDir: './e2e/flows', use: {...devices['Desktop Safari']}},
  ],
  webServer: {
    command: process.env.CI ? 'npm run preview' : 'npm run dev',
    port: process.env.CI ? 4173 : 5173,
    reuseExistingServer: !process.env.CI,
  },
})
