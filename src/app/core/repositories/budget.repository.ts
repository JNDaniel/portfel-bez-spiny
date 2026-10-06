import { Observable } from 'rxjs';
import { Budget, CreateBudgetDto, UpdateBudgetDto } from '../models/budget.model';

export abstract class BudgetRepository {
  abstract getBudgets(): Observable<Budget[]>;
  abstract createBudget(dto: CreateBudgetDto): Observable<Budget>;
  abstract updateBudget(id: string, dto: UpdateBudgetDto): Observable<Budget>;
  abstract deleteBudget(id: string): Observable<boolean>;
  abstract resetSampleData(): Observable<Budget[]>;
}
