import { Injectable, computed, inject, signal } from "@angular/core";
import { ExpenseRepository } from "../repositories/expense.repository";
import { MockExpenseService } from "./mock-expense.service";
import { HttpExpenseService } from "./http-expense.service";
import { SettingsService } from "./settings.service";
import { NotificationService } from "./notification.service";
import { CreateExpenseDto, Expense, ExpenseCategory, ExpenseFilter, UpdateExpenseDto, CATEGORY_META } from "../models/expense.model";
import { CategorySpendBreakdown, MonthlySpendTrend, SpendingSummary } from "../models/analytics.model";

@Injectable({
  providedIn: "root"
})
export class ExpenseService {
  private readonly settingsService = inject(SettingsService);
  private readonly mockExpenseService = inject(MockExpenseService);
  private readonly httpExpenseService = inject(HttpExpenseService);
  private readonly notificationService = inject(NotificationService);

  private get repository(): ExpenseRepository {
    return this.settingsService.isMockBackend() ? this.mockExpenseService : this.httpExpenseService;
  }

  // Signals
  readonly expenses = signal<Expense[]>([]);
  readonly loading = signal<boolean>(false);
  readonly filter = signal<ExpenseFilter>({
    search: "",
    category: "ALL",
    status: "ALL",
    paymentMethod: "ALL",
    department: "ALL",
    sortBy: "date",
    sortDirection: "desc"
  });

  // Computed state
  readonly filteredExpenses = computed(() => {
    const list = this.expenses();
    const f = this.filter();

    return list.filter(item => {
      if (f.search && f.search.trim() !== "") {
        const q = f.search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesVendor = item.vendor.toLowerCase().includes(q);
        const matchesDesc = item.description ? item.description.toLowerCase().includes(q) : false;
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesVendor && !matchesDesc && !matchesTags) {
          return false;
        }
      }
      if (f.category && f.category !== "ALL" && item.category !== f.category) {
        return false;
      }
      if (f.status && f.status !== "ALL" && item.status !== f.status) {
        return false;
      }
      if (f.paymentMethod && f.paymentMethod !== "ALL" && item.paymentMethod !== f.paymentMethod) {
        return false;
      }
      if (f.department && f.department !== "ALL" && item.department !== f.department) {
        return false;
      }
      if (f.startDate && item.date < f.startDate) {
        return false;
      }
      if (f.endDate && item.date > f.endDate) {
        return false;
      }
      if (f.minAmount !== undefined && f.minAmount !== null && item.amount < f.minAmount) {
        return false;
      }
      if (f.maxAmount !== undefined && f.maxAmount !== null && item.amount > f.maxAmount) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const sortBy = f.sortBy || "date";
      const sortDir = f.sortDirection === "asc" ? 1 : -1;
      if (sortBy === "date") return a.date.localeCompare(b.date) * sortDir;
      if (sortBy === "amount") return (a.amount - b.amount) * sortDir;
      if (sortBy === "title") return a.title.localeCompare(b.title) * sortDir;
      if (sortBy === "vendor") return a.vendor.localeCompare(b.vendor) * sortDir;
      if (sortBy === "category") return a.category.localeCompare(b.category) * sortDir;
      return 0;
    });
  });

  readonly totalExpensesAmount = computed(() => {
    return this.expenses().reduce((sum, item) => sum + item.amount, 0);
  });

  readonly filteredTotalAmount = computed(() => {
    return this.filteredExpenses().reduce((sum, item) => sum + item.amount, 0);
  });

  readonly currentMonthExpenses = computed(() => {
    const currentMonthPrefix = new Date().toISOString().substring(0, 7); // e.g. "2026-08"
    return this.expenses().filter(e => e.date.startsWith(currentMonthPrefix));
  });

  readonly currentMonthSpent = computed(() => {
    return this.currentMonthExpenses().reduce((sum, item) => sum + item.amount, 0);
  });

  readonly spendingSummary = computed<SpendingSummary>(() => {
    const total = this.totalExpensesAmount();
    const monthlyBudget = this.settingsService.overallMonthlyBudget();
    const spentThisMonth = this.currentMonthSpent();
    const remaining = Math.max(0, monthlyBudget - spentThisMonth);
    const burnRate = monthlyBudget > 0 ? (spentThisMonth / monthlyBudget) * 100 : 0;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = Math.max(1, new Date().getDate());
    const avgDaily = spentThisMonth / currentDay;
    const projected = avgDaily * daysInMonth;

    return {
      totalSpent: total,
      monthlyBudget,
      spentThisMonth,
      remainingBudgetThisMonth: remaining,
      burnRatePercentage: Math.round(burnRate * 10) / 10,
      averageDailySpend: Math.round(avgDaily * 100) / 100,
      projectedMonthlySpend: Math.round(projected * 100) / 100,
      totalTransactionsCount: this.expenses().length,
      pendingTransactionsCount: this.expenses().filter(e => e.status === "pending").length
    };
  });

  readonly categoryBreakdowns = computed<CategorySpendBreakdown[]>(() => {
    const list = this.currentMonthExpenses();
    const total = this.currentMonthSpent();
    const map = new Map<ExpenseCategory, { amount: number; count: number }>();

    for (const exp of list) {
      const entry = map.get(exp.category) || { amount: 0, count: 0 };
      entry.amount += exp.amount;
      entry.count += 1;
      map.set(exp.category, entry);
    }

    const result: CategorySpendBreakdown[] = [];
    for (const [cat, data] of map.entries()) {
      const percentage = total > 0 ? (data.amount / total) * 100 : 0;
      result.push({
        category: cat,
        amount: Math.round(data.amount * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        count: data.count,
        color: CATEGORY_META[cat]?.color || "#94a3b8"
      });
    }

    return result.sort((a, b) => b.amount - a.amount);
  });

  readonly monthlyTrends = computed<MonthlySpendTrend[]>(() => {
    const list = this.expenses();
    const monthMap = new Map<string, number>();

    // Seed last 6 months
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().substring(0, 7);
      months.push(key);
      monthMap.set(key, 0);
    }

    for (const item of list) {
      const m = item.date.substring(0, 7);
      if (monthMap.has(m)) {
        monthMap.set(m, (monthMap.get(m) || 0) + item.amount);
      }
    }

    const budget = this.settingsService.overallMonthlyBudget();

    return months.map(m => {
      const [year, monthNum] = m.split("-");
      const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const label = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return {
        month: m,
        label,
        total: Math.round((monthMap.get(m) || 0) * 100) / 100,
        budget
      };
    });
  });

  constructor() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.loading.set(true);
    this.repository.getExpenses().subscribe({
      next: data => {
        this.expenses.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.notificationService.error("Failed to load expenses", err.message);
      }
    });
  }

  updateFilter(newFilter: Partial<ExpenseFilter>) {
    this.filter.update(curr => ({ ...curr, ...newFilter }));
  }

  resetFilter() {
    this.filter.set({
      search: "",
      category: "ALL",
      status: "ALL",
      paymentMethod: "ALL",
      department: "ALL",
      sortBy: "date",
      sortDirection: "desc"
    });
  }

  createExpense(dto: CreateExpenseDto, onSuccess?: (exp: Expense) => void) {
    this.loading.set(true);
    this.repository.createExpense(dto).subscribe({
      next: created => {
        this.expenses.update(list => [created, ...list]);
        this.loading.set(false);
        this.notificationService.success("Expense Created", "Added " + created.title + " successfully.");
        if (onSuccess) onSuccess(created);
      },
      error: err => {
        this.loading.set(false);
        this.notificationService.error("Error creating expense", err.message);
      }
    });
  }

  updateExpense(id: string, dto: UpdateExpenseDto, onSuccess?: (exp: Expense) => void) {
    this.loading.set(true);
    this.repository.updateExpense(id, dto).subscribe({
      next: updated => {
        this.expenses.update(list => list.map(item => item.id === id ? updated : item));
        this.loading.set(false);
        this.notificationService.success("Expense Updated", "Updated " + updated.title + ".");
        if (onSuccess) onSuccess(updated);
      },
      error: err => {
        this.loading.set(false);
        this.notificationService.error("Error updating expense", err.message);
      }
    });
  }

  deleteExpense(id: string) {
    const target = this.expenses().find(e => e.id === id);
    this.repository.deleteExpense(id).subscribe({
      next: () => {
        this.expenses.update(list => list.filter(e => e.id !== id));
        this.notificationService.success("Expense Deleted", target ? ("Deleted " + target.title) : "Item removed.");
      },
      error: err => {
        this.notificationService.error("Error deleting expense", err.message);
      }
    });
  }

  bulkDelete(ids: string[]) {
    this.repository.bulkDeleteExpenses(ids).subscribe({
      next: () => {
        const idSet = new Set(ids);
        this.expenses.update(list => list.filter(e => !idSet.has(e.id)));
        this.notificationService.success("Expenses Removed", "Deleted " + ids.length + " records.");
      },
      error: err => {
        this.notificationService.error("Error deleting records", err.message);
      }
    });
  }

  resetToSampleData() {
    this.loading.set(true);
    this.repository.resetSampleData().subscribe({
      next: freshData => {
        this.expenses.set(freshData);
        this.loading.set(false);
        this.notificationService.success("Sample Data Restored", "Sample expenses reloaded.");
      },
      error: err => {
        this.loading.set(false);
        this.notificationService.error("Reset Failed", err.message);
      }
    });
  }

  exportCsv() {
    const data = this.filteredExpenses();
    if (data.length === 0) {
      this.notificationService.warning("No data to export", "The current filter returned 0 records.");
      return;
    }
    const headers = ["ID", "Title", "Amount", "Currency", "Category", "Date", "PaymentMethod", "Status", "Vendor", "Department", "Tags", "Description"];
    const rows = data.map(e => [
      e.id,
      '"' + e.title.replace(/"/g, '""') + '"',
      e.amount,
      e.currency,
      '"' + e.category + '"',
      e.date,
      '"' + e.paymentMethod + '"',
      e.status,
      '"' + e.vendor.replace(/"/g, '""') + '"',
      '"' + (e.department || "") + '"',
      '"' + e.tags.join("; ") + '"',
      '"' + (e.description || "").replace(/"/g, '""') + '"'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "portfel-bez-spiny-expenses-" + new Date().toISOString().substring(0, 10) + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.success("Export Complete", "Exported " + data.length + " expenses to CSV.");
  }

  exportJson() {
    const data = this.expenses();
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonStr);
    link.setAttribute("download", "portfel-bez-spiny-backup-" + new Date().toISOString().substring(0, 10) + ".json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.success("Backup Downloaded", "Full JSON database backup generated.");
  }

  importJson(jsonData: Expense[]) {
    if (!Array.isArray(jsonData)) {
      this.notificationService.error("Invalid JSON", "Uploaded file is not a valid list of expenses.");
      return;
    }
    this.expenses.set(jsonData);
    localStorage.setItem("costflow_expenses_v1", JSON.stringify(jsonData));
    this.notificationService.success("Import Successful", "Imported " + jsonData.length + " expenses.");
  }
}
