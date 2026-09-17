import { ExpenseCategory } from './expense.model';

export interface Budget {
  id: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  period: string; // '2026-08' or 'overall'
  alertThresholdPercent: number; // e.g. 80
  notes?: string;
  updatedAt: string;
}

export interface BudgetStatus {
  category: ExpenseCategory;
  budget: Budget;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export type CreateBudgetDto = Omit<Budget, 'id' | 'updatedAt'>;
export type UpdateBudgetDto = Partial<CreateBudgetDto>;
