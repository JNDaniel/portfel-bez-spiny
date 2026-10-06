import { Expense, ExpenseClassification, MonthlyBudget, Period } from '../models/finance.model';
import { comparePeriods, daysInPeriod, periodOf, shiftPeriod, shortMonthName } from './period';

export interface MonthSummary {
  period: Period;
  totalMinor: number;
  everydayMinor: number;
  wantMinor: number;
  occasionalMinor: number;
  inLimitMinor: number;
  limitMinor: number | null;
  remainingMinor: number | null;
  percentUsed: number | null;
  daysInMonth: number;
  daysLeft: number;
  safeToSpendDailyMinor: number | null;
}

export interface ClassificationShare {
  classification: ExpenseClassification;
  amountMinor: number;
  percentOfTotal: number;
  countsTowardLimit: boolean;
}

export interface CumulativeSeries {
  labels: string[];
  inLimitMinor: number[];
  occasionalMinor: number[];
}

export function effectiveLimitMinor(budgets: MonthlyBudget[], period: Period): number | null {
  let best: MonthlyBudget | null = null;
  for (const budget of budgets) {
    if (
      comparePeriods(budget.effectiveFrom, period) <= 0 &&
      (best === null || comparePeriods(budget.effectiveFrom, best.effectiveFrom) > 0)
    ) {
      best = budget;
    }
  }
  return best ? best.limitMinor : null;
}

function relationToToday(period: Period, today: Date): number {
  return comparePeriods(period, periodOf(today));
}

function lastDayOf(period: Period, today: Date): number {
  const relation = relationToToday(period, today);
  if (relation === 0) {
    return today.getDate();
  }
  return relation < 0 ? daysInPeriod(period) : 0;
}

export function summarizeMonth(input: {
  expenses: Expense[];
  period: Period;
  limitMinor: number | null;
  today: Date;
}): MonthSummary {
  const { expenses, period, limitMinor, today } = input;
  let everydayMinor = 0;
  let wantMinor = 0;
  let occasionalMinor = 0;

  for (const expense of expenses) {
    if (periodOf(expense.spentOn) !== period) {
      continue;
    }
    if (expense.classification === 'everyday') {
      everydayMinor += expense.amountMinor;
    } else if (expense.classification === 'want') {
      wantMinor += expense.amountMinor;
    } else {
      occasionalMinor += expense.amountMinor;
    }
  }

  const inLimitMinor = everydayMinor + wantMinor;
  const daysInMonth = daysInPeriod(period);
  const relation = relationToToday(period, today);
  const daysLeft =
    relation === 0 ? daysInMonth - today.getDate() + 1 : relation < 0 ? 1 : daysInMonth;
  const remainingMinor = limitMinor === null ? null : limitMinor - inLimitMinor;
  const percentUsed =
    limitMinor === null || limitMinor <= 0 ? null : Math.round((inLimitMinor * 100) / limitMinor);

  let safeToSpendDailyMinor: number | null = null;
  if (remainingMinor !== null) {
    safeToSpendDailyMinor =
      remainingMinor <= 0 ? 0 : Math.round(remainingMinor / daysLeft / 100) * 100;
  }

  return {
    period,
    totalMinor: inLimitMinor + occasionalMinor,
    everydayMinor,
    wantMinor,
    occasionalMinor,
    inLimitMinor,
    limitMinor,
    remainingMinor,
    percentUsed,
    daysInMonth,
    daysLeft,
    safeToSpendDailyMinor,
  };
}

export function classificationBreakdown(summary: MonthSummary): ClassificationShare[] {
  const rows: [ExpenseClassification, number][] = [
    ['everyday', summary.everydayMinor],
    ['want', summary.wantMinor],
    ['occasional', summary.occasionalMinor],
  ];
  return rows.map(([classification, amountMinor]) => ({
    classification,
    amountMinor,
    percentOfTotal:
      summary.totalMinor === 0 ? 0 : Math.round((amountMinor * 100) / summary.totalMinor),
    countsTowardLimit: classification !== 'occasional',
  }));
}

export function cumulativeSeries(
  expenses: Expense[],
  period: Period,
  today: Date,
): CumulativeSeries {
  const lastDay = lastDayOf(period, today);
  const inLimitPerDay = new Array<number>(lastDay).fill(0);
  const occasionalPerDay = new Array<number>(lastDay).fill(0);

  for (const expense of expenses) {
    if (periodOf(expense.spentOn) !== period) {
      continue;
    }
    const day = Number(expense.spentOn.substring(8, 10));
    if (day < 1 || day > lastDay) {
      continue;
    }
    const target = expense.classification === 'occasional' ? occasionalPerDay : inLimitPerDay;
    target[day - 1] += expense.amountMinor;
  }

  const month = shortMonthName(period);
  let inLimitRunning = 0;
  let occasionalRunning = 0;
  const labels: string[] = [];
  const inLimitMinor: number[] = [];
  const occasionalMinor: number[] = [];
  for (let day = 1; day <= lastDay; day++) {
    inLimitRunning += inLimitPerDay[day - 1];
    occasionalRunning += occasionalPerDay[day - 1];
    labels.push(`${day} ${month}`);
    inLimitMinor.push(inLimitRunning);
    occasionalMinor.push(occasionalRunning);
  }
  return { labels, inLimitMinor, occasionalMinor };
}

function inLimitUpToDay(expenses: Expense[], period: Period, lastDay: number): number {
  let sum = 0;
  for (const expense of expenses) {
    if (
      periodOf(expense.spentOn) === period &&
      expense.classification !== 'occasional' &&
      Number(expense.spentOn.substring(8, 10)) <= lastDay
    ) {
      sum += expense.amountMinor;
    }
  }
  return sum;
}

export function compareWithPreviousMonth(
  expenses: Expense[],
  period: Period,
  today: Date,
): { percent: number; direction: 'more' | 'less' } | null {
  const lastDay = lastDayOf(period, today);
  const previous = shiftPeriod(period, -1);
  const current = inLimitUpToDay(expenses, period, lastDay);
  const previousSum = inLimitUpToDay(expenses, previous, Math.min(lastDay, daysInPeriod(previous)));
  if (previousSum === 0) {
    return null;
  }
  return {
    percent: Math.round((Math.abs(current - previousSum) * 100) / previousSum),
    direction: current >= previousSum ? 'more' : 'less',
  };
}

export function classificationAfterFolderAssign(
  current: ExpenseClassification,
  folderId: string | null,
): ExpenseClassification {
  return folderId !== null && current === 'everyday' ? 'occasional' : current;
}
