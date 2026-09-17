import { Injectable, inject } from "@angular/core";
import { Observable, of, throwError } from "rxjs";
import { delay } from "rxjs/operators";
import { BudgetRepository } from "../repositories/budget.repository";
import { Budget, CreateBudgetDto, UpdateBudgetDto } from "../models/budget.model";
import { INITIAL_SAMPLE_BUDGETS } from "./mock-data.seed";
import { SettingsService } from "./settings.service";

@Injectable({
  providedIn: "root"
})
export class MockBudgetService implements BudgetRepository {
  private readonly STORAGE_KEY = "costflow_budgets_v1";
  private readonly settingsService = inject(SettingsService);

  private getLatency(): number {
    return this.settingsService.settings().simulateNetworkLatencyMs;
  }

  private loadFromStorage(): Budget[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      this.saveToStorage(INITIAL_SAMPLE_BUDGETS);
      return [...INITIAL_SAMPLE_BUDGETS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...INITIAL_SAMPLE_BUDGETS];
    }
  }

  private saveToStorage(budgets: Budget[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(budgets));
  }

  getBudgets(): Observable<Budget[]> {
    return of(this.loadFromStorage()).pipe(delay(this.getLatency()));
  }

  createBudget(dto: CreateBudgetDto): Observable<Budget> {
    const list = this.loadFromStorage();
    const existingIndex = list.findIndex(b => b.category === dto.category);
    const now = new Date().toISOString();

    if (existingIndex !== -1) {
      list[existingIndex] = {
        ...list[existingIndex],
        monthlyLimit: dto.monthlyLimit,
        alertThresholdPercent: dto.alertThresholdPercent,
        notes: dto.notes,
        updatedAt: now
      };
      this.saveToStorage(list);
      return of(list[existingIndex]).pipe(delay(this.getLatency()));
    }

    const newBudget: Budget = {
      ...dto,
      id: "bud-" + Date.now().toString(36),
      updatedAt: now
    };
    list.push(newBudget);
    this.saveToStorage(list);
    return of(newBudget).pipe(delay(this.getLatency()));
  }

  updateBudget(id: string, dto: UpdateBudgetDto): Observable<Budget> {
    const list = this.loadFromStorage();
    const index = list.findIndex(b => b.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Budget with id ${id} not found`));
    }
    const updated: Budget = {
      ...list[index],
      ...dto,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    this.saveToStorage(list);
    return of(updated).pipe(delay(this.getLatency()));
  }

  deleteBudget(id: string): Observable<boolean> {
    const list = this.loadFromStorage();
    const filtered = list.filter(b => b.id !== id);
    this.saveToStorage(filtered);
    return of(true).pipe(delay(this.getLatency()));
  }

  resetSampleData(): Observable<Budget[]> {
    this.saveToStorage(INITIAL_SAMPLE_BUDGETS);
    return of([...INITIAL_SAMPLE_BUDGETS]).pipe(delay(this.getLatency()));
  }
}
