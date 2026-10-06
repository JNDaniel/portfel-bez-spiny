import { Expense, ExpenseClassification, MonthlyBudget } from '../models/finance.model';
import {
  classificationAfterFolderAssign,
  classificationBreakdown,
  compareWithPreviousMonth,
  cumulativeSeries,
  effectiveLimitMinor,
  summarizeMonth,
} from './budget-summary';

let counter = 0;
function expense(
  spentOn: string,
  amountMinor: number,
  classification: ExpenseClassification = 'everyday',
): Expense {
  counter += 1;
  return {
    id: `e${counter}`,
    title: `Wydatek ${counter}`,
    amountMinor,
    currency: 'PLN',
    classification,
    category: 'Inne',
    spentOn,
    createdAt: `${spentOn}T10:00:00.000Z`,
    tags: [],
    folderId: null,
  };
}

const TODAY = new Date(2026, 9, 12, 10, 0);

describe('effectiveLimitMinor', () => {
  const budgets: MonthlyBudget[] = [
    { id: 'a', effectiveFrom: '2026-03', limitMinor: 100000, currency: 'PLN' },
    { id: 'b', effectiveFrom: '2026-08', limitMinor: 200000, currency: 'PLN' },
  ];

  it('uses the latest record not after the period', () => {
    expect(effectiveLimitMinor(budgets, '2026-10')).toBe(200000);
    expect(effectiveLimitMinor(budgets, '2026-05')).toBe(100000);
  });

  it('returns null before the first record or with no records', () => {
    expect(effectiveLimitMinor(budgets, '2026-02')).toBeNull();
    expect(effectiveLimitMinor([], '2026-10')).toBeNull();
  });
});

describe('summarizeMonth', () => {
  it('US-01: occasional spending never touches the limit, warning or Safe-to-Spend', () => {
    const expenses = [
      expense('2026-10-05', 50000, 'everyday'),
      expense('2026-10-06', 10000, 'want'),
      expense('2026-10-07', 400000, 'occasional'),
    ];
    const summary = summarizeMonth({
      expenses,
      period: '2026-10',
      limitMinor: 310000,
      today: TODAY,
    });

    expect(summary.inLimitMinor).toBe(60000);
    expect(summary.percentUsed).toBe(19);
    expect(summary.remainingMinor).toBe(250000);
    expect(summary.daysLeft).toBe(20);
    expect(summary.safeToSpendDailyMinor).toBe(12500);
    expect(summary.totalMinor).toBe(460000);
    expect(classificationBreakdown(summary).map((row) => row.percentOfTotal)).toEqual([11, 2, 87]);
  });

  it('ignores expenses from other months', () => {
    const summary = summarizeMonth({
      expenses: [expense('2026-09-30', 99900), expense('2026-10-01', 1000)],
      period: '2026-10',
      limitMinor: 310000,
      today: TODAY,
    });
    expect(summary.totalMinor).toBe(1000);
  });

  it('returns nulls without a limit', () => {
    const summary = summarizeMonth({
      expenses: [],
      period: '2026-10',
      limitMinor: null,
      today: TODAY,
    });
    expect(summary.remainingMinor).toBeNull();
    expect(summary.percentUsed).toBeNull();
    expect(summary.safeToSpendDailyMinor).toBeNull();
  });

  it('gives zero Safe-to-Spend when the limit is exceeded', () => {
    const summary = summarizeMonth({
      expenses: [expense('2026-10-02', 50000)],
      period: '2026-10',
      limitMinor: 40000,
      today: TODAY,
    });
    expect(summary.remainingMinor).toBe(-10000);
    expect(summary.percentUsed).toBe(125);
    expect(summary.safeToSpendDailyMinor).toBe(0);
  });

  it('computes days left for past and future months', () => {
    const past = summarizeMonth({
      expenses: [],
      period: '2026-09',
      limitMinor: 30000,
      today: TODAY,
    });
    const future = summarizeMonth({
      expenses: [],
      period: '2026-11',
      limitMinor: 30000,
      today: TODAY,
    });
    expect(past.daysLeft).toBe(1);
    expect(future.daysLeft).toBe(30);
  });

  it('flags past months as closed and gives them no daily allowance', () => {
    const past = summarizeMonth({
      expenses: [],
      period: '2026-09',
      limitMinor: 30000,
      today: TODAY,
    });
    const current = summarizeMonth({
      expenses: [expense('2026-10-06', 10000), expense('2026-10-07', 10000, 'occasional')],
      period: '2026-10',
      limitMinor: 310000,
      today: TODAY,
    });
    expect(past.isClosed).toBe(true);
    expect(past.safeToSpendDailyMinor).toBeNull();
    expect(current.isClosed).toBe(false);
    expect(current.safeToSpendDailyMinor).toBe(15000);
  });
});

describe('classificationBreakdown', () => {
  it('returns zero shares for an empty month', () => {
    const summary = summarizeMonth({
      expenses: [],
      period: '2026-10',
      limitMinor: null,
      today: TODAY,
    });
    const rows = classificationBreakdown(summary);
    expect(rows.map((row) => row.classification)).toEqual(['everyday', 'want', 'occasional']);
    expect(rows.every((row) => row.percentOfTotal === 0)).toBe(true);
    expect(rows.map((row) => row.countsTowardLimit)).toEqual([true, true, false]);
  });

  function percentsFor(everyday: number, want: number, occasional: number): number[] {
    const summary = summarizeMonth({
      expenses: [
        expense('2026-10-05', everyday, 'everyday'),
        expense('2026-10-05', want, 'want'),
        expense('2026-10-05', occasional, 'occasional'),
      ],
      period: '2026-10',
      limitMinor: null,
      today: TODAY,
    });
    return classificationBreakdown(summary).map((row) => row.percentOfTotal);
  }

  it('gives leftover points to the largest remainders so shares sum to 100', () => {
    expect(percentsFor(1, 1, 1)).toEqual([34, 33, 33]);
    expect(percentsFor(455, 455, 90)).toEqual([46, 45, 9]);
  });
});

describe('cumulativeSeries', () => {
  it('accumulates per day up to today for the current month', () => {
    const series = cumulativeSeries(
      [
        expense('2026-10-01', 1000),
        expense('2026-10-03', 500, 'want'),
        expense('2026-10-03', 7000, 'occasional'),
        expense('2026-10-20', 9999),
      ],
      '2026-10',
      TODAY,
    );
    expect(series.labels).toHaveLength(12);
    expect(series.labels[0]).toBe('1 paź');
    expect(series.inLimitMinor[0]).toBe(1000);
    expect(series.inLimitMinor[2]).toBe(1500);
    expect(series.inLimitMinor[11]).toBe(1500);
    expect(series.occasionalMinor[1]).toBe(0);
    expect(series.occasionalMinor[11]).toBe(7000);
  });

  it('covers the whole month for the past and nothing for the future', () => {
    expect(cumulativeSeries([], '2026-09', TODAY).labels).toHaveLength(30);
    expect(cumulativeSeries([], '2026-11', TODAY).labels).toHaveLength(0);
  });
});

describe('compareWithPreviousMonth', () => {
  it('compares in-limit spending up to the same day', () => {
    const expenses = [
      expense('2026-09-05', 10000),
      expense('2026-09-25', 90000),
      expense('2026-09-06', 50000, 'occasional'),
      expense('2026-10-05', 15000),
    ];
    expect(compareWithPreviousMonth(expenses, '2026-10', TODAY)).toEqual({
      percent: 50,
      direction: 'more',
    });
  });

  it('reports less spending and null without a previous baseline', () => {
    expect(
      compareWithPreviousMonth(
        [expense('2026-09-05', 20000), expense('2026-10-05', 5000)],
        '2026-10',
        TODAY,
      ),
    ).toEqual({ percent: 75, direction: 'less' });
    expect(compareWithPreviousMonth([expense('2026-10-05', 5000)], '2026-10', TODAY)).toBeNull();
  });
});

describe('classificationAfterFolderAssign', () => {
  it('turns everyday into occasional when a folder is assigned', () => {
    expect(classificationAfterFolderAssign('everyday', 'f1')).toBe('occasional');
  });

  it('keeps a want a want', () => {
    expect(classificationAfterFolderAssign('want', 'f1')).toBe('want');
  });

  it('keeps occasional when assigned again', () => {
    expect(classificationAfterFolderAssign('occasional', 'f1')).toBe('occasional');
  });

  it('never changes the classification when removing from a folder', () => {
    expect(classificationAfterFolderAssign('everyday', null)).toBe('everyday');
    expect(classificationAfterFolderAssign('occasional', null)).toBe('occasional');
  });
});
