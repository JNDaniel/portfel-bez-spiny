import { test, expect } from '@playwright/test';

test.describe('Portfel Bez Spiny — E2E UI & Gesture Flow', () => {

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
    await page
      .getByRole('dialog', { name: 'Dodaj nowy wydatek' })
      .getByRole('button', { name: 'Dodaj wydatek' })
      .click();

    // Check if new transaction is in the list
    await expect(page.getByText('Kawiarnia Costa')).toBeVisible();
  });

  test('3. Should show only the MVP surface with Safe-to-Spend above the fold', async ({ page }) => {
    // Demo-only actions must not render
    for (const name of ['Test Push z Banku', 'Skaner Paragonów', 'Głos AI', 'Subskrypcje', 'Radar Zachcianek']) {
      await expect(page.getByRole('button', { name })).toHaveCount(0);
    }
    await expect(page.getByRole('button', { name: /Analizuj cały/ })).toHaveCount(0);

    // Safe-to-Spend visible without scrolling
    await expect(page.getByText('Bezpiecznie na dziś:')).toBeInViewport();

    // Header button on desktop, FAB on mobile
    await expect(
      page.getByRole('button', { name: 'Dodaj wydatek' }).filter({ visible: true }).first()
    ).toBeVisible();
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
});
