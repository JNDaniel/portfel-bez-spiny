import { ExpenseFolder, NewExpenseFolder } from '../models/finance.model';

export abstract class ExpenseFolderRepository {
  abstract list(): Promise<ExpenseFolder[]>;
  abstract create(input: NewExpenseFolder): Promise<ExpenseFolder>;
  abstract delete(id: string): Promise<void>;
}
