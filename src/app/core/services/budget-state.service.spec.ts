import { TestBed } from '@angular/core/testing';

import { ExpenseClassification } from '../models/finance.model';
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
