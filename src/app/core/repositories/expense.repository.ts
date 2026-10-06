import { Expense, ExpensePatch, NewExpense } from '../models/finance.model';

export abstract class ExpenseRepository {
  abstract list(): Promise<Expense[]>;
  abstract create(input: NewExpense): Promise<Expense>;
  abstract update(id: string, patch: ExpensePatch): Promise<Expense>;
  abstract delete(ids: readonly string[]): Promise<void>;
}
