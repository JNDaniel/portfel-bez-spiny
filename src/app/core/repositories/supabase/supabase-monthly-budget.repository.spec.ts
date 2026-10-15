import { TestBed } from '@angular/core/testing';

import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { SupabaseMonthlyBudgetRepository } from './supabase-monthly-budget.repository';

const COLUMNS = 'id, effective_from, limit_minor, currency';
const row = { id: 'b1', effective_from: '2026-10-01', limit_minor: 310000, currency: 'PLN' };

function setup(result: { data: unknown; error: { message: string } | null }) {
  const order = vi.fn(() => Promise.resolve(result));
  const single = vi.fn(() => Promise.resolve(result));
  const selectAfterUpsert = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ order }));
  const upsert = vi.fn<(values: object, options: object) => { select: typeof selectAfterUpsert }>(
    () => ({ select: selectAfterUpsert }),
  );
  const from = vi.fn(() => ({ select, upsert }));
  TestBed.configureTestingModule({
    providers: [
      SupabaseMonthlyBudgetRepository,
      {
        provide: SupabaseClientService,
        useValue: { enabled: true, getClient: () => Promise.resolve({ from }) },
      },
    ],
  });
  return {
    repo: TestBed.inject(SupabaseMonthlyBudgetRepository),
    from,
    select,
    order,
    upsert,
    selectAfterUpsert,
  };
}

describe('SupabaseMonthlyBudgetRepository', () => {
  it('list() maps rows to the domain model', async () => {
    const { repo, from, select, order } = setup({ data: [row], error: null });

    await expect(repo.list()).resolves.toEqual([
      { id: 'b1', effectiveFrom: '2026-10', limitMinor: 310000, currency: 'PLN' },
    ]);
    expect(from).toHaveBeenCalledWith('monthly_budgets');
    expect(select).toHaveBeenCalledWith(COLUMNS);
    expect(order).toHaveBeenCalledWith('effective_from');
  });

  it('list() rejects on a Supabase error', async () => {
    const { repo } = setup({ data: null, error: { message: 'boom' } });

    await expect(repo.list()).rejects.toThrow('boom');
  });

  it('list() rejects on a non-PLN currency', async () => {
    const { repo } = setup({ data: [{ ...row, currency: 'EUR' }], error: null });

    await expect(repo.list()).rejects.toThrow('EUR');
  });

  it('setLimit() upserts the first day of the month without user_id', async () => {
    const { repo, upsert, selectAfterUpsert } = setup({ data: row, error: null });

    await expect(repo.setLimit('2026-10', 310000)).resolves.toEqual({
      id: 'b1',
      effectiveFrom: '2026-10',
      limitMinor: 310000,
      currency: 'PLN',
    });
    expect(upsert).toHaveBeenCalledWith(
      { effective_from: '2026-10-01', limit_minor: 310000 },
      { onConflict: 'user_id,effective_from' },
    );
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('user_id');
    expect(selectAfterUpsert).toHaveBeenCalledWith(COLUMNS);
  });

  it('setLimit() rejects on a Supabase error', async () => {
    const { repo } = setup({ data: null, error: { message: 'denied' } });

    await expect(repo.setLimit('2026-10', 1)).rejects.toThrow('denied');
  });
});
