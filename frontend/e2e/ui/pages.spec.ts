import { test, expect } from '@playwright/test'

// Force English locale for predictable text assertions across all viewports.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('locale', 'en'))
})

test.describe('Home page', () => {
  test('renders title and play button', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveText('Chess')
    await expect(page.getByRole('link', { name: 'New Game' })).toBeVisible()
  })
})

test.describe('New game page', () => {
  test('renders title and start button', async ({ page }) => {
    await page.goto('/new-game')
    await expect(page.locator('h1')).toHaveText('New Game')
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible()
  })
})
