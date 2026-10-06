import {
  comparePeriods,
  daysInPeriod,
  formatExpenseDateLabel,
  periodLabel,
  periodOf,
  shiftPeriod,
  shortMonthName,
  toIsoDate,
} from './period';

describe('period helpers', () => {
  it('builds local iso dates and periods', () => {
    const date = new Date(2026, 0, 5, 23, 59);
    expect(toIsoDate(date)).toBe('2026-01-05');
    expect(periodOf(date)).toBe('2026-01');
    expect(periodOf('2026-10-12')).toBe('2026-10');
  });

  it('shifts across year boundaries', () => {
    expect(shiftPeriod('2026-12', 1)).toBe('2027-01');
    expect(shiftPeriod('2026-01', -1)).toBe('2025-12');
    expect(shiftPeriod('2026-03', -15)).toBe('2024-12');
  });

  it('compares periods', () => {
    expect(comparePeriods('2026-09', '2026-10')).toBe(-1);
    expect(comparePeriods('2026-10', '2026-10')).toBe(0);
    expect(comparePeriods('2027-01', '2026-12')).toBe(1);
  });

  it('knows month lengths including leap years', () => {
    expect(daysInPeriod('2024-02')).toBe(29);
    expect(daysInPeriod('2026-02')).toBe(28);
    expect(daysInPeriod('2026-10')).toBe(31);
  });

  it('labels periods in Polish', () => {
    expect(periodLabel('2026-10')).toBe('Październik 2026');
    expect(shortMonthName('2026-10')).toBe('paź');
  });

  it('formats expense date labels', () => {
    const now = new Date(2026, 9, 12, 10, 0);
    const createdAt = (d: Date) => d.toISOString();
    expect(
      formatExpenseDateLabel(
        { spentOn: '2026-10-12', createdAt: createdAt(new Date(2026, 9, 12, 14, 32)) },
        now,
      ),
    ).toBe('Dziś, 14:32');
    expect(
      formatExpenseDateLabel(
        { spentOn: '2026-10-11', createdAt: createdAt(new Date(2026, 9, 11, 18, 15)) },
        now,
      ),
    ).toBe('Wczoraj, 18:15');
    expect(
      formatExpenseDateLabel(
        { spentOn: '2026-07-05', createdAt: createdAt(new Date(2026, 6, 5, 16, 30)) },
        now,
      ),
    ).toBe('05 lip, 16:30');
  });
});
