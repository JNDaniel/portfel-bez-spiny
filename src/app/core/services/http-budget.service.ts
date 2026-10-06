import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BudgetRepository } from '../repositories/budget.repository';
import { Budget, CreateBudgetDto, UpdateBudgetDto } from '../models/budget.model';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class HttpBudgetService implements BudgetRepository {
  private readonly http = inject(HttpClient);
  private readonly settingsService = inject(SettingsService);

  private get baseUrl(): string {
    return `${this.settingsService.apiUrl()}/budgets`;
  }

  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.baseUrl);
  }

  createBudget(dto: CreateBudgetDto): Observable<Budget> {
    return this.http.post<Budget>(this.baseUrl, dto);
  }

  updateBudget(id: string, dto: UpdateBudgetDto): Observable<Budget> {
    return this.http.put<Budget>(`${this.baseUrl}/${id}`, dto);
  }

  deleteBudget(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`);
  }

  resetSampleData(): Observable<Budget[]> {
    return this.http.post<Budget[]>(`${this.baseUrl}/reset-sample`, {});
  }
}
