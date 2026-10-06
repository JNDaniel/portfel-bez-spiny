import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { routes } from './app.routes';
import { ExpenseFolderRepository } from './core/repositories/expense-folder.repository';
import { ExpenseRepository } from './core/repositories/expense.repository';
import { LocalExpenseFolderRepository } from './core/repositories/local/local-expense-folder.repository';
import { LocalExpenseRepository } from './core/repositories/local/local-expense.repository';
import { LocalMonthlyBudgetRepository } from './core/repositories/local/local-monthly-budget.repository';
import { MonthlyBudgetRepository } from './core/repositories/monthly-budget.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withPreloading(PreloadAllModules),
    ),
    { provide: ExpenseRepository, useClass: LocalExpenseRepository },
    { provide: MonthlyBudgetRepository, useClass: LocalMonthlyBudgetRepository },
    { provide: ExpenseFolderRepository, useClass: LocalExpenseFolderRepository },
    provideIonicAngular({
      mode: 'md',
      animated: true,
    }),
  ],
};
