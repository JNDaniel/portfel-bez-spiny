import { test, expect, Page } from '@playwright/test';

type Classification = 'Codzienny' | 'Zachcianka' | 'Okazjonalny';

async function setLimit(page: Page, amount: string) {
  await page.getByRole('button', { name: /limit miesięczny/ }).click();
  await page.locator('#budget-limit-amount').fill(amount);
  await page.getByRole('button', { name: 'Zapisz limit' }).click();
  await expect(page.locator('#budget-limit-amount')).toHaveCount(0);
}

async function addExpense(
  page: Page,
  title: string,
  amount: string,
  classification?: Classification,
) {
  await page
    .getByRole('button', { name: 'Dodaj wydatek' })
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Dodaj nowy wydatek' });
  await page.getByPlaceholder('np. Biedronka, Paliwo, Restauracja').fill(title);
  await page.getByPlaceholder('0.00').fill(amount);
  if (classification) {
    await dialog.getByRole('button', { name: classification }).click();
  }
  await dialog.getByRole('button', { name: 'Dodaj wydatek' }).click();
  await expect(dialog).toHaveCount(0);
}

const row = (page: Page, title: string) => page.locator('ion-item-sliding', { hasText: title });

test.describe('Portfel Bez Spiny — E2E UI & Gesture Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-12T10:00:00'));
    await page.goto('/');
  });

  test('1. Should start empty without a limit', async ({ page }) => {
    await expect(page.getByText('Budżet', { exact: true })).toBeVisible();
    await expect(page.getByText('wykorzystano budżetu')).toBeVisible();
    await expect(page.getByText('WYDANO', { exact: true })).toBeVisible();
    await expect(page.getByText('LIMIT', { exact: true })).toBeVisible();
    await expect(page.getByText('POZOSTAŁO', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ustaw limit miesięczny' })).toBeVisible();
    await expect(page.locator('[data-testid=safe-to-spend]')).toHaveText('—');
    await expect(page.getByText('Brak wydatków w tym miesiącu').first()).toBeVisible();
  });

  test('2. Should open add expense modal and create a new transaction', async ({ page }) => {
    await setLimit(page, '3100');

    await page
      .getByRole('button', { name: 'Dodaj wydatek' })
      .filter({ visible: true })
      .first()
      .click();
    await page.getByPlaceholder('np. Biedronka, Paliwo, Restauracja').fill('Kawiarnia Costa');
    await page.getByPlaceholder('0.00').fill('28.50');
    await page
      .getByPlaceholder('np. „głodny po treningu”, „farba do salonu”')
      .fill('Kawa i ciastko');
    await page
      .getByRole('dialog', { name: 'Dodaj nowy wydatek' })
      .getByRole('button', { name: 'Dodaj wydatek' })
      .click();

    const created = row(page, 'Kawiarnia Costa');
    await expect(created).toBeVisible();
    await expect(created.locator('[data-testid=tx-classification]')).toHaveText('Codzienny');
    await expect(created.getByText('-28,50 zł')).toBeVisible();
  });

  test('3. Should show only the MVP surface with Safe-to-Spend above the fold', async ({
    page,
  }) => {
    for (const name of [
      'Test Push z Banku',
      'Skaner Paragonów',
      'Głos AI',
      'Subskrypcje',
      'Radar Zachcianek',
    ]) {
      await expect(page.getByRole('button', { name })).toHaveCount(0);
    }
    await expect(page.getByRole('button', { name: /Analizuj cały/ })).toHaveCount(0);

    await expect(page.getByText('Bezpiecznie na dziś:')).toBeInViewport();

    await expect(
      page.getByRole('button', { name: 'Dodaj wydatek' }).filter({ visible: true }).first(),
    ).toBeVisible();
  });

  test('4. Occasional spending stays outside the limit, warning and Safe-to-Spend', async ({
    page,
  }) => {
    await setLimit(page, '3100');
    await addExpense(page, 'Zakupy tygodniowe', '500');
    await addExpense(page, 'Kino', '100', 'Zachcianka');
    await addExpense(page, 'Bilety lotnicze', '4000', 'Okazjonalny');

    await expect(page.locator('[data-testid=hero-spent]')).toHaveText('600 zł');
    await expect(page.locator('[data-testid=hero-occasional]')).toHaveText(
      '+ 4000 zł okazji poza limitem',
    );
    await expect(page.locator('[data-testid=hero-remaining]')).toHaveText('2500 zł');
    await expect(page.locator('[data-testid=safe-to-spend]')).toHaveText('125 zł/dzień');
    await expect(page.getByText('19%')).toBeVisible();

    const everyday = page.locator('[data-testid=classification-everyday]');
    await expect(everyday).toContainText('500 zł');
    await expect(everyday).toContainText('11%');
    const want = page.locator('[data-testid=classification-want]');
    await expect(want).toContainText('100 zł');
    await expect(want).toContainText('2%');
    const occasional = page.locator('[data-testid=classification-occasional]');
    await expect(occasional).toContainText('4000 zł');
    await expect(occasional).toContainText('87%');
    await expect(occasional).toContainText('poza limitem');
    await expect(page.locator('[data-testid=classification-total]')).toHaveText('Razem: 4600 zł');

    await expect(page.getByText('Bezpiecznie na dziś:')).toBeInViewport();
  });

  test('5. Moving an everyday expense into a folder makes it occasional', async ({ page }) => {
    await setLimit(page, '3100');
    await addExpense(page, 'Hotel Kioto', '900');
    await expect(page.locator('[data-testid=hero-spent]')).toHaveText('900 zł');

    await page.getByRole('button', { name: 'Nowy folder' }).click();
    await page.locator('#budget-create-folder-name').fill('Wycieczka Japonia');
    await page.getByRole('button', { name: 'Utwórz folder' }).click();
    await page.getByRole('button', { name: 'Wszystkie transakcje' }).click();

    const hotel = row(page, 'Hotel Kioto');
    await hotel.getByRole('button', { name: /Hotel Kioto/ }).click();
    await hotel.locator('select').selectOption({ index: 1 });

    await expect(hotel.locator('[data-testid=tx-classification]')).toHaveText('Okazjonalny');
    await expect(page.locator('[data-testid=hero-spent]')).toHaveText('0 zł');
    await expect(page.locator('[data-testid=hero-occasional]')).toContainText('900');

    await page.getByRole('button', { name: '🇯🇵 Wycieczka Japonia' }).click();
    await expect(page.getByText('Suma w folderze:')).toBeVisible();
    await page.getByRole('button', { name: 'Pokaż wszystkie' }).click();

    await hotel.locator('select').selectOption('');
    await expect(hotel.locator('[data-testid=tx-classification]')).toHaveText('Okazjonalny');
  });

  test('6. Should keep the limit and expenses after reload', async ({ page }) => {
    await setLimit(page, '3100');
    await addExpense(page, 'Kawiarnia Costa', '28.50');

    await page.reload();

    await expect(row(page, 'Kawiarnia Costa')).toBeVisible();
    await expect(page.locator('[data-testid=hero-limit]')).toHaveText('3100 zł');
  });

  test('7. Should apply the limit from the current month forward only', async ({ page }) => {
    await setLimit(page, '3100');

    await page.getByTitle('Poprzedni miesiąc').click();
    await expect(page.getByText('Wrzesień 2026')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ustaw limit miesięczny' })).toBeVisible();

    await page.getByTitle('Następny miesiąc').click();
    await expect(page.getByText('Październik 2026')).toBeVisible();
  });

  test('8. A closed month without a limit shows no daily allowance', async ({ page }) => {
    await page.getByTitle('Poprzedni miesiąc').click();

    await expect(page.locator('[data-testid=month-result]')).toHaveText(
      'Brak limitu w tym miesiącu',
    );
    await expect(page.getByText('Bezpiecznie na dziś:')).toHaveCount(0);
  });

  test('9. A closed month over the limit shows the overspend', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-20T10:00:00'));
    await page.reload();
    await setLimit(page, '1000');
    await addExpense(page, 'Naprawa auta', '1200');

    await page.clock.setFixedTime(new Date('2026-10-12T10:00:00'));
    await page.reload();
    await page.getByTitle('Poprzedni miesiąc').click();

    await expect(page.getByText('Wrzesień 2026')).toBeVisible();
    await expect(page.locator('[data-testid=month-result]')).toHaveText('Przekroczono o 200 zł');

    await page.getByTitle('Następny miesiąc').click();
    await expect(page.getByText('Bezpiecznie na dziś:')).toBeVisible();
  });
});

test.describe('Portfel Bez Spiny — midnight rollover', () => {
  test('10. Keeps the viewed month and closes it after midnight', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-31T23:58:00') });
    await page.goto('/');
    await setLimit(page, '3100');
    await addExpense(page, 'Kolacja', '50');

    await page.clock.fastForward('03:00');

    await expect(page.getByText('Październik 2026')).toBeVisible();
    await expect(page.locator('[data-testid=month-result]')).toBeVisible();
    await expect(row(page, 'Kolacja')).toContainText('Wczoraj, 23:58');
    await expect(page.getByTitle('Następny miesiąc')).toBeEnabled();

    await page.getByTitle('Następny miesiąc').click();
    await expect(page.getByText('Listopad 2026')).toBeVisible();
    await expect(page.getByText('Bezpiecznie na dziś:')).toBeVisible();
  });
});
