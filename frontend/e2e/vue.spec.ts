import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('new game page loads', async ({ page }) => {
    await page.goto('/new-game')
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('locale', 'fr'))
  })

  test('navigates from home to new game and back', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Nouvelle partie' }).click()
    await expect(page).toHaveURL('/new-game')
    await expect(page.locator('h1')).toHaveText('Nouvelle partie')

    await page.getByRole('link', { name: 'Retour' }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Locale', () => {
  test('defaults to browser language when no locale is stored', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('locale'))
    await page.goto('/')
    // Playwright default browser language is en-US
    await expect(page.locator('h1')).toHaveText('Chess Game')
  })

  test('switches locale from EN to FR', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('locale', 'en'))
    await page.goto('/')
    await expect(page.locator('h1')).toHaveText('Chess Game')

    await page.getByRole('button', { name: 'FR' }).click()
    await expect(page.locator('h1')).toHaveText("Jeu d'échecs")
  })

  test('persists locale after reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'FR' }).click()
    await expect(page.locator('h1')).toHaveText("Jeu d'échecs")

    await page.reload()
    await expect(page.locator('h1')).toHaveText("Jeu d'échecs")
  })
})
