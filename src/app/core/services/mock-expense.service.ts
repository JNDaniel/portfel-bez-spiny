import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ExpenseRepository } from '../repositories/expense.repository';
import {
  CreateExpenseDto,
  Expense,
  ExpenseFilter,
  UpdateExpenseDto,
} from '../models/expense.model';
import { INITIAL_SAMPLE_EXPENSES } from './mock-data.seed';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class MockExpenseService implements ExpenseRepository {
  private readonly STORAGE_KEY = 'costflow_expenses_v1';
  private readonly settingsService = inject(SettingsService);

  private getLatency(): number {
    return this.settingsService.settings().simulateNetworkLatencyMs;
  }

  private loadFromStorage(): Expense[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      this.saveToStorage(INITIAL_SAMPLE_EXPENSES);
      return [...INITIAL_SAMPLE_EXPENSES];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...INITIAL_SAMPLE_EXPENSES];
    }
  }

  private saveToStorage(expenses: Expense[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(expenses));
  }

  getExpenses(filter?: ExpenseFilter): Observable<Expense[]> {
    let list = this.loadFromStorage();

    if (filter) {
      if (filter.search && filter.search.trim() !== '') {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.vendor.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            item.tags.some((t) => t.toLowerCase().includes(q)),
        );
      }
      if (filter.category && filter.category !== 'ALL') {
        list = list.filter((item) => item.category === filter.category);
      }
      if (filter.status && filter.status !== 'ALL') {
        list = list.filter((item) => item.status === filter.status);
      }
      if (filter.paymentMethod && filter.paymentMethod !== 'ALL') {
        list = list.filter((item) => item.paymentMethod === filter.paymentMethod);
      }
      if (filter.startDate) {
        list = list.filter((item) => item.date >= filter.startDate!);
      }
      if (filter.endDate) {
        list = list.filter((item) => item.date <= filter.endDate!);
      }
      if (filter.minAmount !== undefined && filter.minAmount !== null) {
        list = list.filter((item) => item.amount >= filter.minAmount!);
      }
      if (filter.maxAmount !== undefined && filter.maxAmount !== null) {
        list = list.filter((item) => item.amount <= filter.maxAmount!);
      }
      if (filter.department && filter.department !== 'ALL') {
        list = list.filter((item) => item.department === filter.department);
      }

      // Sorting
      const sortBy = filter.sortBy || 'date';
      const sortDir = filter.sortDirection === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        if (sortBy === 'date') {
          return a.date.localeCompare(b.date) * sortDir;
        }
        if (sortBy === 'amount') {
          return (a.amount - b.amount) * sortDir;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title) * sortDir;
        }
        if (sortBy === 'vendor') {
          return a.vendor.localeCompare(b.vendor) * sortDir;
        }
        if (sortBy === 'category') {
          return a.category.localeCompare(b.category) * sortDir;
        }
        return 0;
      });
    }

    return of(list).pipe(delay(this.getLatency()));
  }

  getExpenseById(id: string): Observable<Expense> {
    const list = this.loadFromStorage();
    const item = list.find((e) => e.id === id);
    if (!item) {
      return throwError(() => new Error(`Expense with id ${id} not found`));
    }
    return of(item).pipe(delay(this.getLatency()));
  }

  createExpense(dto: CreateExpenseDto): Observable<Expense> {
    const list = this.loadFromStorage();
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...dto,
      id: 'exp-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      createdAt: now,
      updatedAt: now,
    };
    const updatedList = [newExpense, ...list];
    this.saveToStorage(updatedList);
    return of(newExpense).pipe(delay(this.getLatency()));
  }

  updateExpense(id: string, dto: UpdateExpenseDto): Observable<Expense> {
    const list = this.loadFromStorage();
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Expense with id ${id} not found`));
    }
    const updatedItem: Expense = {
      ...list[index],
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updatedItem;
    this.saveToStorage(list);
    return of(updatedItem).pipe(delay(this.getLatency()));
  }

  deleteExpense(id: string): Observable<boolean> {
    const list = this.loadFromStorage();
    const filtered = list.filter((e) => e.id !== id);
    this.saveToStorage(filtered);
    return of(true).pipe(delay(this.getLatency()));
  }

  bulkDeleteExpenses(ids: string[]): Observable<boolean> {
    const list = this.loadFromStorage();
    const idSet = new Set(ids);
    const filtered = list.filter((e) => !idSet.has(e.id));
    this.saveToStorage(filtered);
    return of(true).pipe(delay(this.getLatency()));
  }

  resetSampleData(): Observable<Expense[]> {
    this.saveToStorage(INITIAL_SAMPLE_EXPENSES);
    return of([...INITIAL_SAMPLE_EXPENSES]).pipe(delay(this.getLatency()));
  }
}
