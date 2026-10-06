import { Signal, signal } from '@angular/core';

export class FakeClockService {
  private current: Date;
  private readonly todaySignal;
  readonly today: Signal<Date>;

  constructor(initial: Date) {
    this.current = initial;
    this.todaySignal = signal<Date>(FakeClockService.startOfDay(initial), {
      equal: (a, b) => a.getTime() === b.getTime(),
    });
    this.today = this.todaySignal.asReadonly();
  }

  now(): Date {
    return this.current;
  }

  refresh(): void {
    this.todaySignal.set(FakeClockService.startOfDay(this.current));
  }

  set(date: Date): void {
    this.current = date;
    this.refresh();
  }

  private static startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
