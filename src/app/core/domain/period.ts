import { Expense, IsoDate, Period } from '../models/finance.model';

const MONTH_NAMES = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];
const SHORT_MONTH_NAMES = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];

const pad2 = (value: number): string => String(value).padStart(2, '0');

function parsePeriod(period: Period): { year: number; month: number } {
  const [year, month] = period.split('-').map(Number);
  return { year, month };
}

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function periodOf(value: Date | IsoDate): Period {
  return typeof value === 'string' ? value.substring(0, 7) : toIsoDate(value).substring(0, 7);
}

export function shiftPeriod(period: Period, delta: number): Period {
  const { year, month } = parsePeriod(period);
  const index = year * 12 + (month - 1) + delta;
  return `${Math.floor(index / 12)}-${pad2((index % 12) + 1)}`;
}

export function comparePeriods(a: Period, b: Period): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function daysInPeriod(period: Period): number {
  const { year, month } = parsePeriod(period);
  return new Date(year, month, 0).getDate();
}

export function periodLabel(period: Period): string {
  const { year, month } = parsePeriod(period);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function shortMonthName(period: Period): string {
  return SHORT_MONTH_NAMES[parsePeriod(period).month - 1];
}

export function formatExpenseDateLabel(
  expense: Pick<Expense, 'spentOn' | 'createdAt'>,
  now: Date,
): string {
  const created = new Date(expense.createdAt);
  const time = `${pad2(created.getHours())}:${pad2(created.getMinutes())}`;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (expense.spentOn === toIsoDate(now)) {
    return `Dziś, ${time}`;
  }
  if (expense.spentOn === toIsoDate(yesterday)) {
    return `Wczoraj, ${time}`;
  }
  const day = expense.spentOn.substring(8, 10);
  return `${day} ${shortMonthName(periodOf(expense.spentOn))}, ${time}`;
}
