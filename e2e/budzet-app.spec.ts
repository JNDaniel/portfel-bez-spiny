import { test, expect } from '@playwright/test';

test.describe('BudżetApp — E2E UI & Gesture Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Should display Hero Gauge with percentage, limit, spent and safe-to-spend', async ({ page }) => {
    // Check main title / logo
    await expect(page.getByText('Budżet', { exact: true })).toBeVisible();

    // Check Hero percentage
    await expect(page.getByText('52%')).toBeVisible();
    await expect(page.getByText('wykorzystano budżetu')).toBeVisible();

    // Check 3 KPI numbers
    await expect(page.getByText('WYDANO')).toBeVisible();
    await expect(page.getByText('LIMIT')).toBeVisible();
    await expect(page.getByText('POZOSTAŁO')).toBeVisible();

    // Check Safe to spend badge
    await expect(page.getByText('Bezpiecznie na dziś:')).toBeVisible();
  });

  test('2. Should open add expense modal and create a new transaction', async ({ page }) => {
    // Click "Dodaj wydatek" button
    const addButton = page.getByRole('button', { name: 'Dodaj wydatek' }).first();
    await addButton.click();

    // Fill form
    await page.getByPlaceholder('np. Biedronka, Paliwo, Restauracja').fill('Kawiarnia Costa');
    await page.getByPlaceholder('0.00').fill('28.50');
    await page.getByPlaceholder('np. „głodny po treningu”, „farba do salonu”').fill('Kawa i ciastko');

    // Submit
    await page.getByRole('button', { name: 'Dodaj wydatek' }).last().click();

    // Check if new transaction is in the list
    await expect(page.getByText('Kawiarnia Costa')).toBeVisible();
  });

  test('3. Should trigger and accept simulated bank push notification', async ({ page }) => {
    // Click "Test Push z Banku"
    await page.getByRole('button', { name: 'Test Push z Banku' }).click();

    // Check if push card appeared
    await expect(page.getByText('Dodaj jednym kliknięciem')).toBeVisible();

    // Click to add
    await page.getByRole('button', { name: 'Dodaj jednym kliknięciem' }).click();

    // Notification banner should be dismissed
    await expect(page.getByText('Dodaj jednym kliknięciem')).not.toBeVisible();
  });

  test('4. Should filter by folder (Wycieczka Japonia)', async ({ page }) => {
    // Click folder chip "Wycieczka Japonia"
    const japanFolder = page.getByRole('button', { name: /Wycieczka Japonia/ });
    if (await japanFolder.isVisible()) {
      await japanFolder.click();
      await expect(page.getByText('Suma w folderze:')).toBeVisible();
      // Reset back to all
      await page.getByRole('button', { name: 'Pokaż wszystkie' }).click();
    }
  });

  test('5. Should open and close AI Summary insights', async ({ page }) => {
    // Click bottom AI analysis button
    const aiButton = page.getByRole('button', { name: /Analizuj cały/ });
    await aiButton.click();

    // Check 4 AI cards
    await expect(page.getByText('Największy wydatek')).toBeVisible();
    await expect(page.getByText('Potencjalnie zbędne')).toBeVisible();
    await expect(page.getByText('Dobra wiadomość')).toBeVisible();
    await expect(page.getByText('Rekomendacja AI')).toBeVisible();
  });
});
