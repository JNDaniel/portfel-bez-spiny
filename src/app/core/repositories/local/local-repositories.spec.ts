import { TestBed } from '@angular/core/testing';

import { NewExpense } from '../../models/finance.model';
import { LocalExpenseFolderRepository } from './local-expense-folder.repository';
import { LocalExpenseRepository } from './local-expense.repository';
import { FINANCE_STORAGE_KEY } from './local-finance.store';
import { LocalMonthlyBudgetRepository } from './local-monthly-budget.repository';

function newExpense(overrides: Partial<NewExpense> = {}): NewExpense {
  return {
    title: 'Kawa',
    amountMinor: 2850,
    currency: 'PLN',
    classification: 'everyday',
    category: 'Jedzenie',
    spentOn: '2026-10-12',
    createdAt: '2026-10-12T08:00:00.000Z',
    tags: [],
    folderId: null,
    ...overrides,
  };
}

function setup() {
  TestBed.configureTestingModule({
    providers: [LocalExpenseRepository, LocalMonthlyBudgetRepository, LocalExpenseFolderRepository],
  });
  return {
    expenses: TestBed.inject(LocalExpenseRepository),
    budgets: TestBed.inject(LocalMonthlyBudgetRepository),
    folders: TestBed.inject(LocalExpenseFolderRepository),
  };
}

describe('local repositories', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists expenses across repository instances', async () => {
    const { expenses } = setup();
    const created = await expenses.create(newExpense());

    TestBed.resetTestingModule();
    const { expenses: reopened } = setup();

    expect(await reopened.list()).toEqual([created]);
    expect(created.id).toBeTruthy();
  });

  it('rejects updates of an unknown id', async () => {
    const { expenses } = setup();

    await expect(expenses.update('missing', { title: 'x' })).rejects.toThrowError(/missing/);
  });

  it('updates and deletes expenses', async () => {
    const { expenses } = setup();
    const a = await expenses.create(newExpense({ title: 'A' }));
    const b = await expenses.create(newExpense({ title: 'B' }));

    const updated = await expenses.update(a.id, { classification: 'want' });
    await expenses.delete([b.id]);

    expect(updated.classification).toBe('want');
    expect((await expenses.list()).map((expense) => expense.title)).toEqual(['A']);
  });

  it('detaches expenses when a folder is deleted', async () => {
    const { expenses, folders } = setup();
    const folder = await folders.create({ name: 'Japonia', emoji: '🗾', color: '#fff' });
    const created = await expenses.create(newExpense({ folderId: folder.id }));

    await folders.delete(folder.id);

    expect(await folders.list()).toEqual([]);
    expect((await expenses.list()).find((e) => e.id === created.id)?.folderId).toBeNull();
  });

  it('replaces the limit for the same month and keeps other months', async () => {
    const { budgets } = setup();
    await budgets.setLimit('2026-09', 100000);
    await budgets.setLimit('2026-10', 200000);
    await budgets.setLimit('2026-10', 310000);

    const list = await budgets.list();

    expect(list).toHaveLength(2);
    expect(list.find((b) => b.effectiveFrom === '2026-10')?.limitMinor).toBe(310000);
    expect(list.find((b) => b.effectiveFrom === '2026-09')?.limitMinor).toBe(100000);
  });

  it('returns copies that cannot mutate stored state', async () => {
    const { expenses } = setup();
    await expenses.create(newExpense());

    (await expenses.list())[0].title = 'Zmieniony';

    expect((await expenses.list())[0].title).toBe('Kawa');
  });

  it('starts empty when stored JSON is corrupt', async () => {
    const { expenses } = setup();
    localStorage.setItem(FINANCE_STORAGE_KEY, '{not json');
    const warn = console.warn;
    console.warn = () => undefined;
    try {
      expect(await expenses.list()).toEqual([]);
    } finally {
      console.warn = warn;
    }
  });
});
