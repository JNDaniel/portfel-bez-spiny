import { MonthlyBudget, Period } from '../models/finance.model';

export abstract class MonthlyBudgetRepository {
  abstract list(): Promise<MonthlyBudget[]>;
  abstract setLimit(effectiveFrom: Period, limitMinor: number): Promise<MonthlyBudget>;
}
