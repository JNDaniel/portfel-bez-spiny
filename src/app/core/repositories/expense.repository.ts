import { Observable } from 'rxjs';
import {
  CreateExpenseDto,
  Expense,
  ExpenseFilter,
  UpdateExpenseDto,
} from '../models/expense.model';

export abstract class ExpenseRepository {
  abstract getExpenses(filter?: ExpenseFilter): Observable<Expense[]>;
  abstract getExpenseById(id: string): Observable<Expense>;
  abstract createExpense(dto: CreateExpenseDto): Observable<Expense>;
  abstract updateExpense(id: string, dto: UpdateExpenseDto): Observable<Expense>;
  abstract deleteExpense(id: string): Observable<boolean>;
  abstract bulkDeleteExpenses(ids: string[]): Observable<boolean>;
  abstract resetSampleData(): Observable<Expense[]>;
}
