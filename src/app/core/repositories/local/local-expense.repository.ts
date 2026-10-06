import { Injectable, inject } from '@angular/core';

import { Expense, ExpensePatch, NewExpense } from '../../models/finance.model';
import { ExpenseRepository } from '../expense.repository';
import { LocalFinanceStore } from './local-finance.store';

@Injectable()
export class LocalExpenseRepository extends ExpenseRepository {
  private readonly store = inject(LocalFinanceStore);

  async list(): Promise<Expense[]> {
    return structuredClone(this.store.read().expenses);
  }

  async create(input: NewExpense): Promise<Expense> {
    const snapshot = this.store.read();
    const created: Expense = structuredClone({ ...input, id: crypto.randomUUID() });
    snapshot.expenses.push(created);
    this.store.write(snapshot);
    return structuredClone(created);
  }

  async update(id: string, patch: ExpensePatch): Promise<Expense> {
    const snapshot = this.store.read();
    const index = snapshot.expenses.findIndex((expense) => expense.id === id);
    if (index === -1) {
      throw new Error(`Nie znaleziono wydatku ${id}`);
    }
    const updated: Expense = { ...snapshot.expenses[index], ...structuredClone(patch) };
    snapshot.expenses[index] = updated;
    this.store.write(snapshot);
    return structuredClone(updated);
  }

  async delete(ids: readonly string[]): Promise<void> {
    const snapshot = this.store.read();
    snapshot.expenses = snapshot.expenses.filter((expense) => !ids.includes(expense.id));
    this.store.write(snapshot);
  }
}
