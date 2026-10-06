import { Injectable } from '@angular/core';

import { Expense, ExpenseFolder, MonthlyBudget } from '../../models/finance.model';

export interface FinanceSnapshot {
  version: 1;
  expenses: Expense[];
  budgets: MonthlyBudget[];
  folders: ExpenseFolder[];
}

export const FINANCE_STORAGE_KEY = 'pbs_finance_v1';

function emptySnapshot(): FinanceSnapshot {
  return { version: 1, expenses: [], budgets: [], folders: [] };
}

@Injectable({ providedIn: 'root' })
export class LocalFinanceStore {
  read(): FinanceSnapshot {
    try {
      const raw = localStorage.getItem(FINANCE_STORAGE_KEY);
      if (!raw) {
        return emptySnapshot();
      }
      const parsed = JSON.parse(raw) as Partial<FinanceSnapshot> | null;
      if (
        !parsed ||
        parsed.version !== 1 ||
        !Array.isArray(parsed.expenses) ||
        !Array.isArray(parsed.budgets) ||
        !Array.isArray(parsed.folders)
      ) {
        throw new Error('Unexpected snapshot shape');
      }
      return {
        version: 1,
        expenses: parsed.expenses,
        budgets: parsed.budgets,
        folders: parsed.folders,
      };
    } catch (err) {
      console.warn('Could not read stored finance data, starting empty.', err);
      return emptySnapshot();
    }
  }

  write(snapshot: FinanceSnapshot): void {
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(snapshot));
  }
}
