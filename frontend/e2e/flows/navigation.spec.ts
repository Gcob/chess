import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('locale', 'fr'))
})

test.describe('Navigation', () => {
  test('navigates from home to new game and back', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Nouvelle partie' }).click()
    await expect(page).toHaveURL('/new-game')
    await expect(page.locator('h1')).toHaveText('Nouvelle partie')

    await page.getByRole('link', { name: 'Retour' }).click()
    await expect(page).toHaveURL('/')
  })
})
