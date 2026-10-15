import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../auth/auth.service';
import { Expense, ExpenseClassification, MonthlyBudget } from '../models/finance.model';
import { ExpenseFolderRepository } from '../repositories/expense-folder.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { LocalExpenseFolderRepository } from '../repositories/local/local-expense-folder.repository';
import { LocalExpenseRepository } from '../repositories/local/local-expense.repository';
import { LocalMonthlyBudgetRepository } from '../repositories/local/local-monthly-budget.repository';
import { MonthlyBudgetRepository } from '../repositories/monthly-budget.repository';
import { BudgetStateService } from './budget-state.service';
import { ClockService } from './clock.service';
import { FakeClockService } from './clock.service.testing';

let fake: FakeClockService;

async function setup(): Promise<BudgetStateService> {
  localStorage.clear();
  fake = new FakeClockService(new Date(2026, 9, 12, 10, 0));
  TestBed.configureTestingModule({
    providers: [
      { provide: ExpenseRepository, useClass: LocalExpenseRepository },
      { provide: MonthlyBudgetRepository, useClass: LocalMonthlyBudgetRepository },
      { provide: ExpenseFolderRepository, useClass: LocalExpenseFolderRepository },
      { provide: ClockService, useValue: fake },
    ],
  });
  const service = TestBed.inject(BudgetStateService);
  await service.reload();
  return service;
}

function expenseInput(
  title: string,
  amountMinor: number,
  classification: ExpenseClassification = 'everyday',
) {
  return {
    title,
    amountMinor,
    category: 'Inne' as const,
    classification,
    tags: [],
  };
}

describe('BudgetStateService', () => {
  it('jumps back to the current month when an expense is added from a previous month', async () => {
    const service = await setup();
    await service.previousMonth();
    expect(service.currentPeriod()).toBe('2026-09');

    await service.addExpense(expenseInput('Kawa', 2850));

    expect(service.currentPeriod()).toBe('2026-10');
    expect(service.monthExpenses().map((e) => e.title)).toEqual(['Kawa']);
    expect(service.isAddModalOpen()).toBe(false);
  });

  it('turns an everyday expense into occasional when assigned to a folder', async () => {
    const service = await setup();
    await service.setMonthlyLimit(310000);
    await service.addExpense(expenseInput('Hotel', 90000));
    expect(service.spentAmount()).toBe(900);

    const id = service.monthExpenses()[0].id;
    await service.createFolder('Japonia', '🗾', '#10b981', [id]);

    expect(service.monthExpenses()[0].classification).toBe('occasional');
    expect(service.spentAmount()).toBe(0);
    expect(service.occasionalAmount()).toBe(900);
    expect(service.percentageUsed()).toBe(0);
  });

  it('keeps a want a want when assigned to a folder', async () => {
    const service = await setup();
    await service.addExpense(expenseInput('Kino', 10000, 'want'));
    const id = service.monthExpenses()[0].id;
    await service.createFolder('Weekend', '🎉', '#10b981', [id]);

    expect(service.monthExpenses()[0].classification).toBe('want');
    expect(service.spentAmount()).toBe(100);
  });

  it('keeps occasional after removing the expense from its folder', async () => {
    const service = await setup();
    await service.addExpense(expenseInput('Hotel', 90000));
    const id = service.monthExpenses()[0].id;
    await service.createFolder('Japonia', '🗾', '#10b981', [id]);

    await service.assignToFolder([id], null);

    const expense = service.monthExpenses()[0];
    expect(expense.folderId).toBeNull();
    expect(expense.classification).toBe('occasional');
  });

  it('applies a monthly limit forward only', async () => {
    const service = await setup();
    await service.setMonthlyLimit(310000);
    expect(service.limitAmount()).toBe(3100);
    expect(service.isLimitModalOpen()).toBe(false);

    await service.previousMonth();

    expect(service.limitAmount()).toBeNull();
    expect(service.safeToSpendDaily()).toBeNull();
  });

  it('does not move past the current month', async () => {
    const service = await setup();
    expect(service.canGoNext()).toBe(false);

    await service.nextMonth();

    expect(service.currentPeriod()).toBe('2026-10');
  });

  it('relabels dates and shortens days left after the day rolls over', async () => {
    const service = await setup();
    await service.addExpense(expenseInput('Kawa', 2850));
    expect(service.monthExpenses()[0].dateLabel.startsWith('Dziś')).toBe(true);
    const daysLeft = service.summary().daysLeft;

    fake.set(new Date(2026, 9, 13, 0, 1));

    expect(service.monthExpenses()[0].dateLabel.startsWith('Wczoraj')).toBe(true);
    expect(service.summary().daysLeft).toBe(daysLeft - 1);
  });

  it('keeps the viewed month but closes it after the month rolls over', async () => {
    const service = await setup();
    await service.setMonthlyLimit(310000);
    expect(service.safeToSpendDaily()).not.toBeNull();

    fake.set(new Date(2026, 10, 1, 0, 1));

    expect(service.currentPeriod()).toBe('2026-10');
    expect(service.isClosedMonth()).toBe(true);
    expect(service.safeToSpendDaily()).toBeNull();
    expect(service.canGoNext()).toBe(true);

    await service.nextMonth();

    expect(service.currentPeriod()).toBe('2026-11');
  });
});

describe('BudgetStateService identity lifecycle', () => {
  const budgetOf = (user: string, limitMinor: number): MonthlyBudget => ({
    id: `b-${user}`,
    effectiveFrom: '2026-10',
    limitMinor,
    currency: 'PLN',
  });
  const expenseOf = (user: string): Expense => ({
    id: `e-${user}`,
    title: `Wydatek ${user}`,
    amountMinor: 1000,
    currency: 'PLN',
    category: 'Inne',
    classification: 'everyday',
    tags: [],
    spentOn: '2026-10-12',
    createdAt: '2026-10-12T10:00:00.000Z',
    folderId: null,
  });

  function setupAuth(initial: string | null) {
    const userId = signal<string | null>(initial);
    const budgetLists: { user: string | null; resolve: (v: MonthlyBudget[]) => void }[] = [];
    let holdFor: string | null = null;
    const listed: (string | null)[] = [];
    const budgetRepo = {
      list: vi.fn(() => {
        const user = userId();
        listed.push(user);
        if (user !== null && user === holdFor) {
          return new Promise<MonthlyBudget[]>((resolve) => budgetLists.push({ user, resolve }));
        }
        return Promise.resolve(user ? [budgetOf(user, user === 'A' ? 100000 : 200000)] : []);
      }),
      setLimit: vi.fn(),
    };
    const expenseRepo = {
      list: vi.fn(() => Promise.resolve(userId() ? [expenseOf(userId() as string)] : [])),
    };
    const folderRepo = { list: vi.fn(() => Promise.resolve([])) };
    fake = new FakeClockService(new Date(2026, 9, 12, 10, 0));
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { enabled: true, userId } },
        { provide: ExpenseRepository, useValue: expenseRepo },
        { provide: MonthlyBudgetRepository, useValue: budgetRepo },
        { provide: ExpenseFolderRepository, useValue: folderRepo },
        { provide: ClockService, useValue: fake },
      ],
    });
    const service = TestBed.inject(BudgetStateService);
    return {
      service,
      userId,
      budgetRepo,
      budgetLists,
      listed,
      hold: (user: string | null) => (holdFor = user),
    };
  }

  const settle = async () => {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  };

  it('does not query repositories without a user', async () => {
    const { service, budgetRepo } = setupAuth(null);
    await settle();

    expect(budgetRepo.list).not.toHaveBeenCalled();
    expect(service.limitAmount()).toBeNull();
    expect(service.monthExpenses()).toEqual([]);
    expect(service.loaded()).toBe(false);
  });

  it('empties the state when the user signs out', async () => {
    const { service, userId, budgetRepo } = setupAuth('A');
    await settle();
    expect(service.limitAmount()).toBe(1000);
    budgetRepo.list.mockClear();

    userId.set(null);
    await settle();

    expect(budgetRepo.list).not.toHaveBeenCalled();
    expect(service.limitAmount()).toBeNull();
    expect(service.monthExpenses()).toEqual([]);
  });

  it('shows only the budget of the new user after A -> B', async () => {
    const { service, userId } = setupAuth('A');
    await settle();
    expect(service.limitAmount()).toBe(1000);
    expect(service.monthExpenses().map((e) => e.title)).toEqual(['Wydatek A']);

    userId.set('B');
    await settle();

    expect(service.limitAmount()).toBe(2000);
    expect(service.monthExpenses().map((e) => e.title)).toEqual(['Wydatek B']);
  });

  it('discards a late list() of the previous user', async () => {
    const { service, userId, budgetLists, hold } = setupAuth(null);
    hold('A');
    userId.set('A');
    await settle();
    expect(budgetLists).toHaveLength(1);

    userId.set('B');
    await settle();
    expect(service.limitAmount()).toBe(2000);

    budgetLists[0].resolve([budgetOf('A', 100000)]);
    await settle();

    expect(service.limitAmount()).toBe(2000);
    expect(service.loaded()).toBe(true);
  });

  it('does not reload when the user id stays the same', async () => {
    const { userId, budgetRepo } = setupAuth('A');
    await settle();
    expect(budgetRepo.list).toHaveBeenCalledTimes(1);

    userId.set('A');
    await settle();

    expect(budgetRepo.list).toHaveBeenCalledTimes(1);
  });

  it('closes modals and clears folder selection on account change', async () => {
    const { service, userId } = setupAuth('A');
    await settle();
    service.isLimitModalOpen.set(true);
    service.selectedFolderId.set('folder-a');
    service.enableSelectionMode('e-A');

    userId.set('B');
    await settle();

    expect(service.isLimitModalOpen()).toBe(false);
    expect(service.selectedFolderId()).toBeNull();
    expect(service.isSelectionMode()).toBe(false);
    expect(service.selectedTxIds()).toEqual([]);
  });

  it('does not keep a mutation result of the previous user', async () => {
    const { service, userId, budgetRepo } = setupAuth('A');
    await settle();
    let release: () => void = () => undefined;
    budgetRepo.setLimit.mockImplementation(
      () =>
        new Promise<MonthlyBudget>((resolve) => {
          release = () => resolve(budgetOf('A', 999900));
        }),
    );
    const pending = service.setMonthlyLimit(999900);
    await settle();

    userId.set('B');
    await settle();
    release();
    await pending;
    await settle();

    expect(service.limitAmount()).toBe(2000);
  });
});
