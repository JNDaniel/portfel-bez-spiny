import { TestBed } from '@angular/core/testing';

import { RUNTIME_CONFIG, DataBackend } from '../config/runtime-config';
import { ExpenseFolderRepository } from './expense-folder.repository';
import { ExpenseRepository } from './expense.repository';
import { LocalExpenseFolderRepository } from './local/local-expense-folder.repository';
import { LocalExpenseRepository } from './local/local-expense.repository';
import { LocalMonthlyBudgetRepository } from './local/local-monthly-budget.repository';
import { MonthlyBudgetRepository } from './monthly-budget.repository';
import { provideRepositories } from './provide-repositories';
import { SupabaseMonthlyBudgetRepository } from './supabase/supabase-monthly-budget.repository';

function setup(dataBackend: DataBackend) {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: RUNTIME_CONFIG,
        useValue: {
          dataBackend,
          supabaseTarget: 'staging',
          supabaseUrl: '',
          supabasePublishableKey: '',
        },
      },
      ...provideRepositories(),
    ],
  });
}

describe('provideRepositories', () => {
  it('uses the Supabase budget adapter when DATA_BACKEND is supabase', () => {
    setup('supabase');

    expect(TestBed.inject(MonthlyBudgetRepository)).toBeInstanceOf(SupabaseMonthlyBudgetRepository);
    expect(TestBed.inject(ExpenseRepository)).toBeInstanceOf(LocalExpenseRepository);
    expect(TestBed.inject(ExpenseFolderRepository)).toBeInstanceOf(LocalExpenseFolderRepository);
  });

  it('uses the local budget adapter when DATA_BACKEND is local', () => {
    setup('local');

    expect(TestBed.inject(MonthlyBudgetRepository)).toBeInstanceOf(LocalMonthlyBudgetRepository);
    expect(TestBed.inject(ExpenseRepository)).toBeInstanceOf(LocalExpenseRepository);
    expect(TestBed.inject(ExpenseFolderRepository)).toBeInstanceOf(LocalExpenseFolderRepository);
  });
});
