import { Injectable, computed, inject, signal } from "@angular/core";
import { BudgetRepository } from "../repositories/budget.repository";
import { MockBudgetService } from "./mock-budget.service";
import { HttpBudgetService } from "./http-budget.service";
import { SettingsService } from "./settings.service";
import { NotificationService } from "./notification.service";
import { ExpenseService } from "./expense.service";
import { Budget, BudgetStatus, CreateBudgetDto, UpdateBudgetDto } from "../models/budget.model";
import { ExpenseCategory } from "../models/expense.model";

@Injectable({
  providedIn: "root"
})
export class BudgetService {
  private readonly settingsService = inject(SettingsService);
  private readonly mockBudgetService = inject(MockBudgetService);
  private readonly httpBudgetService = inject(HttpBudgetService);
  private readonly notificationService = inject(NotificationService);
  private readonly expenseService = inject(ExpenseService);

  private get repository(): BudgetRepository {
    return this.settingsService.isMockBackend() ? this.mockBudgetService : this.httpBudgetService;
  }

  readonly budgets = signal<Budget[]>([]);
  readonly loading = signal<boolean>(false);

  readonly categoryBudgetsMap = computed(() => {
    const map = new Map<ExpenseCategory, Budget>();
    for (const b of this.budgets()) {
      map.set(b.category, b);
    }
    return map;
  });

  readonly budgetStatuses = computed<BudgetStatus[]>(() => {
    const budgetsList = this.budgets();
    const currentMonthExpenses = this.expenseService.currentMonthExpenses();

    // Sum spend per category
    const categorySpendMap = new Map<ExpenseCategory, number>();
    for (const exp of currentMonthExpenses) {
      const curr = categorySpendMap.get(exp.category) || 0;
      categorySpendMap.set(exp.category, curr + exp.amount);
    }

    return budgetsList.map(budget => {
      const spent = categorySpendMap.get(budget.category) || 0;
      const remaining = budget.monthlyLimit - spent;
      const percentageUsed = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
      const isOverBudget = spent > budget.monthlyLimit;
      const isNearLimit = !isOverBudget && percentageUsed >= budget.alertThresholdPercent;

      return {
        category: budget.category,
        budget,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentageUsed: Math.round(percentageUsed * 10) / 10,
        isOverBudget,
        isNearLimit
      };
    }).sort((a, b) => b.percentageUsed - a.percentageUsed);
  });

  readonly totalBudgetLimit = computed(() => {
    return this.budgets().reduce((sum, b) => sum + b.monthlyLimit, 0);
  });

  readonly overBudgetCategoriesCount = computed(() => {
    return this.budgetStatuses().filter(s => s.isOverBudget).length;
  });

  readonly nearLimitCategoriesCount = computed(() => {
    return this.budgetStatuses().filter(s => s.isNearLimit).length;
  });

  constructor() {
    this.loadBudgets();
  }

  loadBudgets() {
    this.loading.set(true);
    this.repository.getBudgets().subscribe({
      next: data => {
        this.budgets.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.notificationService.error("Failed to load budgets", err.message);
      }
    });
  }

  createOrUpdateBudget(dto: CreateBudgetDto) {
    this.loading.set(true);
    this.repository.createBudget(dto).subscribe({
      next: saved => {
        this.budgets.update(list => {
          const idx = list.findIndex(b => b.id === saved.id || b.category === saved.category);
          if (idx !== -1) {
            const updated = [...list];
            updated[idx] = saved;
            return updated;
          }
          return [...list, saved];
        });
        this.loading.set(false);
        this.notificationService.success("Budget Saved", "Budget for " + saved.category + " updated.");
      },
      error: err => {
        this.loading.set(false);
        this.notificationService.error("Failed to save budget", err.message);
      }
    });
  }

  deleteBudget(id: string) {
    this.repository.deleteBudget(id).subscribe({
      next: () => {
        this.budgets.update(list => list.filter(b => b.id !== id));
        this.notificationService.success("Budget Deleted", "Category budget limit removed.");
      },
      error: err => {
        this.notificationService.error("Error deleting budget", err.message);
      }
    });
  }

  resetSampleBudgets() {
    this.loading.set(true);
    this.repository.resetSampleData().subscribe({
      next: fresh => {
        this.budgets.set(fresh);
        this.loading.set(false);
        this.notificationService.success("Budgets Reset", "Sample budgets restored.");
      },
      error: err => {
        this.loading.set(false);
        this.notificationService.error("Reset Failed", err.message);
      }
    });
  }
}
