import { Injectable, inject } from '@angular/core';

import { MonthlyBudget, Period } from '../../models/finance.model';
import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { MonthlyBudgetRepository } from '../monthly-budget.repository';

const COLUMNS = 'id, effective_from, limit_minor, currency';

interface MonthlyBudgetRow {
  id: string;
  effective_from: string; // 'YYYY-MM-DD'
  limit_minor: number;
  currency: string;
}

function toDomain(row: MonthlyBudgetRow): MonthlyBudget {
  if (row.currency !== 'PLN') {
    throw new Error(`Unsupported currency: ${row.currency}`);
  }
  return {
    id: row.id,
    effectiveFrom: row.effective_from.slice(0, 7),
    limitMinor: row.limit_minor,
    currency: 'PLN',
  };
}

@Injectable()
export class SupabaseMonthlyBudgetRepository extends MonthlyBudgetRepository {
  private readonly supabase = inject(SupabaseClientService);

  async list(): Promise<MonthlyBudget[]> {
    const client = await this.supabase.getClient();
    // No user_id filter: Row Level Security scopes the rows to the signed-in user.
    const { data, error } = await client
      .from('monthly_budgets')
      .select(COLUMNS)
      .order('effective_from');
    if (error) {
      throw new Error(error.message);
    }
    return (data as MonthlyBudgetRow[]).map(toDomain);
  }

  async setLimit(effectiveFrom: Period, limitMinor: number): Promise<MonthlyBudget> {
    const client = await this.supabase.getClient();
    // user_id is filled by the column default auth.uid().
    const { data, error } = await client
      .from('monthly_budgets')
      .upsert(
        { effective_from: `${effectiveFrom}-01`, limit_minor: limitMinor },
        { onConflict: 'user_id,effective_from' },
      )
      .select(COLUMNS)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return toDomain(data as MonthlyBudgetRow);
  }
}
