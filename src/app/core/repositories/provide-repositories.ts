import { Provider, inject } from '@angular/core';

import { RUNTIME_CONFIG } from '../config/runtime-config';
import { ExpenseFolderRepository } from './expense-folder.repository';
import { ExpenseRepository } from './expense.repository';
import { LocalExpenseFolderRepository } from './local/local-expense-folder.repository';
import { LocalExpenseRepository } from './local/local-expense.repository';
import { LocalMonthlyBudgetRepository } from './local/local-monthly-budget.repository';
import { MonthlyBudgetRepository } from './monthly-budget.repository';
import { SupabaseMonthlyBudgetRepository } from './supabase/supabase-monthly-budget.repository';

/** Single place that picks repository implementations according to DATA_BACKEND. */
export function provideRepositories(): Provider[] {
  return [
    LocalMonthlyBudgetRepository,
    SupabaseMonthlyBudgetRepository,
    {
      provide: MonthlyBudgetRepository,
      useFactory: () =>
        inject(RUNTIME_CONFIG).dataBackend === 'supabase'
          ? inject(SupabaseMonthlyBudgetRepository)
          : inject(LocalMonthlyBudgetRepository),
    },
    // S-05/S-06: switch these to Supabase adapters.
    { provide: ExpenseRepository, useClass: LocalExpenseRepository },
    { provide: ExpenseFolderRepository, useClass: LocalExpenseFolderRepository },
  ];
}
