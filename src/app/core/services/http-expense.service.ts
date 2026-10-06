import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExpenseRepository } from '../repositories/expense.repository';
import {
  CreateExpenseDto,
  Expense,
  ExpenseFilter,
  UpdateExpenseDto,
} from '../models/expense.model';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class HttpExpenseService implements ExpenseRepository {
  private readonly http = inject(HttpClient);
  private readonly settingsService = inject(SettingsService);

  private get baseUrl(): string {
    return `${this.settingsService.apiUrl()}/expenses`;
  }

  getExpenses(filter?: ExpenseFilter): Observable<Expense[]> {
    let params = new HttpParams();
    if (filter) {
      if (filter.search) params = params.set('search', filter.search);
      if (filter.category && filter.category !== 'ALL')
        params = params.set('category', filter.category);
      if (filter.status && filter.status !== 'ALL') params = params.set('status', filter.status);
      if (filter.paymentMethod && filter.paymentMethod !== 'ALL')
        params = params.set('paymentMethod', filter.paymentMethod);
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
      if (filter.minAmount !== undefined)
        params = params.set('minAmount', filter.minAmount.toString());
      if (filter.maxAmount !== undefined)
        params = params.set('maxAmount', filter.maxAmount.toString());
      if (filter.department && filter.department !== 'ALL')
        params = params.set('department', filter.department);
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortDirection) params = params.set('sortDirection', filter.sortDirection);
    }
    return this.http.get<Expense[]>(this.baseUrl, { params });
  }

  getExpenseById(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.baseUrl}/${id}`);
  }

  createExpense(dto: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense>(this.baseUrl, dto);
  }

  updateExpense(id: string, dto: UpdateExpenseDto): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl}/${id}`, dto);
  }

  deleteExpense(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`);
  }

  bulkDeleteExpenses(ids: string[]): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/bulk-delete`, { ids });
  }

  resetSampleData(): Observable<Expense[]> {
    return this.http.post<Expense[]>(`${this.baseUrl}/reset-sample`, {});
  }
}
