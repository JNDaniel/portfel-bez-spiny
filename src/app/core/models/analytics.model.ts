import { ExpenseCategory } from './expense.model';

export interface SpendingSummary {
  totalSpent: number;
  monthlyBudget: number;
  spentThisMonth: number;
  remainingBudgetThisMonth: number;
  burnRatePercentage: number;
  averageDailySpend: number;
  projectedMonthlySpend: number;
  totalTransactionsCount: number;
  pendingTransactionsCount: number;
}

export interface CategorySpendBreakdown {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
  color: string;
  monthlyLimit?: number;
}

export interface MonthlySpendTrend {
  month: string; // e.g. "2026-03"
  label: string; // e.g. "Mar 2026"
  total: number;
  budget: number;
}
