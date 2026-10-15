import { test, expect } from '@playwright/test';
import { PASSWORD, register, signIn, signOut, uniqueEmail } from './auth-helpers';

test.describe('Portfel Bez Spiny — logowanie', () => {
  test('Unauthenticated visitor is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Zaloguj się' })).toBeVisible();
  });

  test('Register, restore session after reload, sign out', async ({ page }) => {
    await register(page, uniqueEmail());
    await expect(page.locator('[data-testid=safe-to-spend]')).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('[data-testid=safe-to-spend]')).toBeVisible();

    await signOut(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Sign in with an existing account and redirect away from login', async ({ page }) => {
    const email = uniqueEmail();
    await register(page, email);
    await signOut(page);

    await signIn(page, email, PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('Wrong password shows an error', async ({ page }) => {
    const email = uniqueEmail();
    await register(page, email);
    await signOut(page);

    await signIn(page, email, 'zle-haslo-999');

    await expect(page.locator('[data-testid=auth-error]')).toHaveText(
      'Nieprawidłowy email lub hasło.',
    );
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Registering an existing email shows an error', async ({ page }) => {
    const email = uniqueEmail();
    await register(page, email);
    await signOut(page);

    await page.goto('/register');
    await page.locator('#auth-email').fill(email);
    await page.locator('#auth-password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Załóż konto' }).click();

    await expect(page.locator('[data-testid=auth-error]')).toHaveText(
      'Konto z tym adresem już istnieje.',
    );
  });
});
