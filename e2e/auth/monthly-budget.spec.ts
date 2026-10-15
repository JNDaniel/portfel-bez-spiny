import { test, expect, Page } from '@playwright/test';
import { PASSWORD, register, setLimit, signIn, signOut, uniqueEmail } from './auth-helpers';

const heroLimit = (page: Page) => page.locator('[data-testid=hero-limit]');

// The empty state is also true right after the identity wipe; wait for the account's own load.
const budgetsLoaded = (page: Page) =>
  page.waitForResponse(
    (r) => r.url().includes('/rest/v1/monthly_budgets') && r.request().method() === 'GET' && r.ok(),
  );

test.describe('Portfel Bez Spiny — prywatny limit miesięczny', () => {
  test('1. Limit is persistent and belongs to the account', async ({ page, browser }) => {
    const email = uniqueEmail();
    await register(page, email);
    await setLimit(page, '3100');
    await expect(heroLimit(page)).toHaveText('3100 zł');

    await setLimit(page, '3200');
    await expect(heroLimit(page)).toHaveText('3200 zł');

    await page.reload();
    await expect(heroLimit(page)).toHaveText('3200 zł');

    const fresh = await browser.newContext();
    try {
      const other = await fresh.newPage();
      await other.goto('/login');
      await signIn(other, email, PASSWORD);
      await expect(other).toHaveURL(/\/dashboard$/);
      await expect(heroLimit(other)).toHaveText('3200 zł');
    } finally {
      await fresh.close();
    }
  });

  test('2. Two accounts in one tab do not see each other limits', async ({ page }) => {
    const emailA = uniqueEmail();
    const emailB = uniqueEmail();

    await register(page, emailA);
    await setLimit(page, '3100');
    await signOut(page);

    const loadedB = budgetsLoaded(page);
    await register(page, emailB);
    await loadedB;
    await expect(page.getByRole('button', { name: 'Ustaw limit miesięczny' })).toBeVisible();
    await expect(page.locator('[data-testid=safe-to-spend]')).toHaveText('—');
    await setLimit(page, '2000');
    await expect(heroLimit(page)).toHaveText('2000 zł');
    await signOut(page);

    await signIn(page, emailA, PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(heroLimit(page)).toHaveText('3100 zł');
  });

  test('3. Signing out in another tab resets the state', async ({ context }) => {
    const emailA = uniqueEmail();
    const emailB = uniqueEmail();

    // B must exist before the scenario: register in a separate context.
    const setup = await context.browser()!.newContext();
    try {
      const p = await setup.newPage();
      await register(p, emailB);
    } finally {
      await setup.close();
    }

    const page1 = await context.newPage();
    await register(page1, emailA);
    await setLimit(page1, '3100');
    await expect(heroLimit(page1)).toHaveText('3100 zł');

    const page2 = await context.newPage();
    await page2.goto('/dashboard');
    await expect(heroLimit(page2)).toHaveText('3100 zł');

    await signOut(page1);
    await expect(page2).toHaveURL(/\/login$/);

    const loadedB = budgetsLoaded(page2);
    await signIn(page2, emailB, PASSWORD);
    await loadedB;
    await expect(page2).toHaveURL(/\/dashboard$/);
    await expect(page2.getByRole('button', { name: 'Ustaw limit miesięczny' })).toBeVisible();
    await expect(page2.locator('[data-testid=safe-to-spend]')).toHaveText('—');
  });
});
