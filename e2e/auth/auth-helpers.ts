import { expect, Page } from '@playwright/test';

export const PASSWORD = 'Haslo-testowe-123';

export const uniqueEmail = () =>
  `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

export async function register(page: Page, email: string) {
  await page.goto('/register');
  await page.locator('#auth-email').fill(email);
  await page.locator('#auth-password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Załóż konto' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Wyloguj' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function signIn(page: Page, email: string, password: string) {
  await page.locator('#auth-email').fill(email);
  await page.locator('#auth-password').fill(password);
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
}

export async function setLimit(page: Page, amount: string) {
  await page.getByRole('button', { name: /limit miesięczny/ }).click();
  await page.locator('#budget-limit-amount').fill(amount);
  await page.getByRole('button', { name: 'Zapisz limit' }).click();
  await expect(page.locator('#budget-limit-amount')).toHaveCount(0);
}
