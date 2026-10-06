import { Injectable, inject } from '@angular/core';

import { MonthlyBudget, Period } from '../../models/finance.model';
import { MonthlyBudgetRepository } from '../monthly-budget.repository';
import { LocalFinanceStore } from './local-finance.store';

@Injectable()
export class LocalMonthlyBudgetRepository extends MonthlyBudgetRepository {
  private readonly store = inject(LocalFinanceStore);

  async list(): Promise<MonthlyBudget[]> {
    return structuredClone(this.store.read().budgets);
  }

  async setLimit(effectiveFrom: Period, limitMinor: number): Promise<MonthlyBudget> {
    const snapshot = this.store.read();
    const existing = snapshot.budgets.find((budget) => budget.effectiveFrom === effectiveFrom);
    const record: MonthlyBudget = {
      id: existing?.id ?? crypto.randomUUID(),
      effectiveFrom,
      limitMinor,
      currency: 'PLN',
    };
    snapshot.budgets = [
      ...snapshot.budgets.filter((budget) => budget.effectiveFrom !== effectiveFrom),
      record,
    ];
    this.store.write(snapshot);
    return { ...record };
  }
}
