import { test, expect } from '@playwright/test'

test.describe('Locale', () => {
  test('defaults to browser language when no locale is stored', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('locale'))
    await page.goto('/')
    // Playwright default browser locale is en-US → resolves to 'en'
    await expect(page.locator('h1')).toHaveText('Chess')
  })

  test('switches locale from EN to FR', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('locale', 'en'))
    await page.goto('/')
    await expect(page.locator('h1')).toHaveText('Chess')

    await page.getByRole('button', { name: 'FR' }).click()
    await expect(page.locator('h1')).toHaveText('Échecs')
  })

  test('persists locale after reload', async ({ page }) => {
    // No addInitScript here — it would re-run on reload and overwrite the persisted locale.
    // Playwright browser locale is en-US, so the initial load resolves to 'en'.
    await page.goto('/')
    await page.getByRole('button', { name: 'FR' }).click()
    await expect(page.locator('h1')).toHaveText('Échecs')

    await page.reload()
    await expect(page.locator('h1')).toHaveText('Échecs')
  })
})
