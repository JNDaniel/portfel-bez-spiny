import { test, expect } from '@playwright/test';

test.describe('Portfel Bez Spiny — tryb local bez logowania', () => {
  test('11. Login and register redirect to the dashboard in local mode', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/register');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('button', { name: 'Wyloguj' })).toHaveCount(0);
  });
});
