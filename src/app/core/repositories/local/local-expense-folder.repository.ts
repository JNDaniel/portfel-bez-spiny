import { Injectable, inject } from '@angular/core';

import { ExpenseFolder, NewExpenseFolder } from '../../models/finance.model';
import { ClockService } from '../../services/clock.service';
import { ExpenseFolderRepository } from '../expense-folder.repository';
import { LocalFinanceStore } from './local-finance.store';

@Injectable()
export class LocalExpenseFolderRepository extends ExpenseFolderRepository {
  private readonly store = inject(LocalFinanceStore);
  private readonly clock = inject(ClockService);

  async list(): Promise<ExpenseFolder[]> {
    return structuredClone(this.store.read().folders);
  }

  async create(input: NewExpenseFolder): Promise<ExpenseFolder> {
    const snapshot = this.store.read();
    const created: ExpenseFolder = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: this.clock.now().toISOString(),
    };
    snapshot.folders.push(created);
    this.store.write(snapshot);
    return { ...created };
  }

  async delete(id: string): Promise<void> {
    const snapshot = this.store.read();
    snapshot.folders = snapshot.folders.filter((folder) => folder.id !== id);
    snapshot.expenses = snapshot.expenses.map((expense) =>
      expense.folderId === id ? { ...expense, folderId: null } : expense,
    );
    this.store.write(snapshot);
  }
}
