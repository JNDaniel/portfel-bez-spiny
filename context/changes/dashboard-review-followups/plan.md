# Dashboard Review Follow-ups Implementation Plan

## Overview

Fix the four minor findings from the S-02 implementation review (`context/changes/canonical-expense-classification/reviews/impl-review.md`): the trend chart's y-axis labels repeat, "today" does not update while the app stays open, a closed month still shows "Bezpiecznie na dziś", and the classification percentages can sum to 99 or 101. S-02 is held locally; both changes are pushed to `master` together after this one is reviewed.

## Current State Analysis

- **Chart y-axis.** `budget-trend-chart.component.ts:154` formats every tick as `(val / 1000).toFixed(1) + 'k'`. That formatter came from the old seed data in thousands. Chart.js picks fractional steps for small values, so an empty month shows `0.0k` six times and a few hundred złoty show `0.1k` three times.
- **Dates are not reactive.** `ClockService` (`src/app/core/services/clock.service.ts`) only has `now()`. `BudgetStateService` calls `this.clock.now()` inside `canGoNext`, `summary`, `trend`, `vsPreviousMonth`, `monthExpenses` and `subscriptions` (`budget-state.service.ts:97-238`). A `computed` does not track a plain function call, so "today", the "Dziś/Wczoraj" labels, the days left and the next-month arrow update only when another signal changes or the page reloads. `local-expense-folder.repository.ts:22` and `addExpense` (`:528-543`) use `now()` for timestamps, which is correct.
- **Closed months.** `summarizeMonth` (`budget-summary.ts:57-110`) treats a past month as having `daysLeft = 1`, so `safeToSpendDailyMinor` equals the whole remaining limit. The hero pill (`budget-hero-gauge.component.ts:73-86`) always reads "Bezpiecznie na dziś: X zł/dzień do końca miesiąca", which makes no sense for a finished month. The month navigator cannot go past the current month (`canGoNext`), so a viewed month is either the current month or a closed one.
- **Percentages.** `classificationBreakdown` (`budget-summary.ts:112-125`) rounds each row on its own with `Math.round`, so three rows of one third each give 33 + 33 + 33 = 99.

### Key Discoveries:

- Unit tests replace the clock through DI: `budget-state.service.spec.ts:20` provides `{ provide: ClockService, useValue: { now: () => new Date(2026, 9, 12, 10, 0) } }`. `vi.mock` does not work under `@angular/build:unit-test` (S-02 plan), so the clock must stay replaceable through DI.
- The E2E suite freezes time in `beforeEach` with `page.clock.setFixedTime(new Date('2026-10-12T10:00:00'))` (`e2e/budget-dashboard.spec.ts:36-39`). Playwright's `page.clock.install()` and `fastForward()` move time and fire timers, which is how a midnight rollover can be tested. `install()` must not follow `setFixedTime()` in the same page, so the rollover test lives in its own `test.describe` without that `beforeEach`.
- The month arrows have `title="Poprzedni miesiąc"` / `title="Następny miesiąc"` (`budget-main.component.ts:98-121`); use `page.getByTitle(...)` in E2E.
- The existing hero testids are `safe-to-spend`, `hero-spent`, `hero-limit`, `hero-remaining`, `hero-occasional`. E2E tests 1 and 3 assert `safe-to-spend` and that "Bezpiecznie na dziś:" is in the Pixel 7 viewport; those must keep passing for the current month.
- `budget-summary.spec.ts:108-122` asserts `past.daysLeft === 1`. This plan leaves `daysLeft` as it is and only changes `safeToSpendDailyMinor` for closed months.

## Desired End State

- The y-axis shows distinct, readable labels: whole złoty up to 999 (`0`, `100`, `250`) and thousands with a Polish comma from 1000 (`1k`, `1,5k`, `12,3k`). An empty month shows a 0–100 scale instead of repeated zeros.
- While the app stays open, "today" moves at local midnight and when the app becomes visible again. The day labels, Safe-to-Spend, days left and the chart update without a reload. When a new month starts, the view **stays** on the month the user is looking at; that month becomes closed and the "Następny miesiąc" arrow becomes enabled. Adding an expense still jumps to the current month (S-02 behaviour).
- On a closed month the hero pill shows one of:
  - `Zostało z limitu: X zł` when the remaining limit is 0 zł or more;
  - `Przekroczono o X zł` when the limit was exceeded (X is the absolute overspend);
  - `Brak limitu w tym miesiącu` when the month had no limit.
  The current month keeps "Bezpiecznie na dziś: … do końca miesiąca" unchanged.
- The KLASYFIKACJA percentages always sum to exactly 100 when the month has any expense, and stay 0 / 0 / 0 for an empty month.

## What We're NOT Doing

- No automatic switch to the new month at midnight; the view stays where the user is (user decision).
- No change to `daysLeft`, the gauge, the WYDANO / LIMIT / POZOSTAŁO numbers or their testids.
- No new chart features (limit line, tooltips, axis titles) and no change to the x-axis.
- No change to money storage, repositories, the data model or `localStorage` keys.
- No new dependencies, no OnPush or zoneless change, no `eslint-disable`.
- No push to `master` during implementation; S-02 and this change are pushed together after review and with the user's approval.

## Implementation Approach

1. **Phase 1:** change the pure domain functions first, with unit tests: largest-remainder percentages, an axis-label formatter and a closed-month flag in `MonthSummary`. No visible change except the percentages.
2. **Phase 2:** make the clock reactive (`today` signal), switch every date-dependent `computed` in `BudgetStateService` to it, and test day and month rollover in the service spec.
3. **Phase 3:** use the new pieces in the UI (hero pill variants, chart ticks), add E2E coverage for closed months and the midnight rollover, and run all gates.

## Critical Implementation Details

- **Timing & lifecycle:** `ClockService` is a root service, so its interval and `visibilitychange` listener live for the app's lifetime; register cleanup through `DestroyRef` so TestBed teardown does not leak timers between unit tests. The `today` signal must use a day-level equality check (same local calendar date ⇒ equal) so a refresh within the same day does not recompute every `computed`.
- **State sequencing:** `addExpense` must call `clock.refresh()` before reading `now()`, so an expense added just after midnight is not labelled "Wczoraj" while `today` still points at the previous day.

## Phase 1: Domain Functions

### Overview

Pure, unit-tested changes in `src/app/core/domain/`. Nothing in the UI uses the new formatter or flag yet.

### Changes Required:

#### 1. Percentages that sum to 100

**File**: `src/app/core/domain/budget-summary.ts`

**Intent**: Replace per-row rounding in `classificationBreakdown` with the largest-remainder method, so the shown percentages always add up to 100.

**Contract**: `classificationBreakdown(summary)` keeps its signature and row order (`everyday`, `want`, `occasional`). When `totalMinor > 0`: each `percentOfTotal` is the floor of the exact share or that floor + 1, and the three values sum to exactly 100. The leftover points go to the rows with the largest fractional remainders; equal remainders are resolved in row order. When `totalMinor === 0`: all three are 0.

#### 2. Closed-month flag and no daily allowance for closed months

**File**: `src/app/core/domain/budget-summary.ts`

**Intent**: Let the UI know whether the summarised month is already over, and stop presenting the whole remaining limit as a "daily" amount for such a month.

**Contract**: `MonthSummary` gains `isClosed: boolean` (true when `period` is before the period of `today`). For a closed month `safeToSpendDailyMinor` is `null`; for the current month it is unchanged. `daysLeft` and all other fields are unchanged.

#### 3. Y-axis label formatter

**File**: `src/app/core/domain/money.ts`

**Intent**: A pure formatter for chart axis values in whole złoty, so the component no longer hardcodes thousands.

**Contract**: `formatAxisZloty(value: number): string`, where `value` is in whole złoty (the chart already plots `minor / 100`). Below 1000: `String(Math.round(value))` (`0`, `100`, `250`). From 1000: thousands rounded to one decimal, Polish comma, trailing `,0` dropped, suffix `k` (`1000 → "1k"`, `1500 → "1,5k"`, `12345 → "12,3k"`, `999.6 → "1k"`).

#### 4. Unit tests

**Files**: `src/app/core/domain/budget-summary.spec.ts`, `src/app/core/domain/money.spec.ts`

**Intent**: Cover the new contracts and update the existing assertions that change.

**Contract**:
- Breakdown: `[1, 1, 1]` grosze → `[34, 33, 33]`; `[455, 455, 90]` → `[46, 45, 9]` (per-row rounding would give 101); the existing `[11, 2, 87]` case still holds; an empty month stays `[0, 0, 0]`.
- Summary: `isClosed` is true for a past month and false for the current month; a past month has `safeToSpendDailyMinor === null` even with a limit; the current-month case (`12500`) is unchanged.
- Formatter: the examples listed in the contract above, including `0 → "0"`.

### Success Criteria:

#### Automated Verification:

- `npm run check` passes
- `budget-summary.spec.ts` and `money.spec.ts` contain the cases listed above and pass
- Deliberate break: switching `classificationBreakdown` back to per-row `Math.round` makes `budget-summary.spec.ts` fail (then reverted)

#### Manual Verification:

- No `src/app/features/` file changed in this phase except where a type change forced it

**Implementation Note**: Phase blocks use plain bullets; the checkboxes live in `## Progress`.

---

## Phase 2: Reactive Clock

### Overview

`ClockService` publishes the current local day as a signal. Every date-dependent `computed` in `BudgetStateService` reads that signal, so the dashboard follows midnight and month boundaries without a reload.

### Changes Required:

#### 1. `ClockService` with a `today` signal

**File**: `src/app/core/services/clock.service.ts`

**Intent**: Keep `now()` for timestamps and add a signal that changes when the local calendar day changes.

**Contract**:
- `now(): Date` — unchanged.
- `readonly today: Signal<Date>` — local midnight of the current day, with day-level equality (see Critical Implementation Details).
- `refresh(): void` — re-reads `now()` and updates `today` if the day changed.
- `refresh()` runs every 60 seconds (interval) and on `document` `visibilitychange` when the page becomes visible (covers a phone resuming the WebView). Both are removed through `DestroyRef`.

#### 2. Test double for the clock

**File**: `src/app/core/services/clock.service.testing.ts` (new, imported only by specs)

**Intent**: One reusable fake so specs can set and move time without `vi.mock`.

**Contract**: `class FakeClockService` with the same public surface as `ClockService` (`now()`, `today`, `refresh()`) plus `set(date: Date)`, which updates both `now()` and `today`. Specs provide it with `{ provide: ClockService, useValue: fake }`.

#### 3. `BudgetStateService` reads `today`

**File**: `src/app/core/services/budget-state.service.ts`

**Intent**: Make every date-dependent value react to the day changing, without moving the user's view.

**Contract**:
- `canGoNext`, `summary`, `trend`, `vsPreviousMonth`, `monthExpenses` (date labels) and `subscriptions` read `this.clock.today()` instead of `this.clock.now()`.
- `currentPeriod` still starts at the period of today and is **not** changed when the month rolls over.
- New `isClosedMonth = computed(() => this.summary().isClosed)` for the UI.
- `addExpense` calls `this.clock.refresh()` first, then uses `now()` for `spentOn`/`createdAt` as today.
- No other call of `clock.now()` remains inside a `computed` (timestamps in actions are fine).

#### 4. Clock and rollover tests

**Files**: `src/app/core/services/clock.service.spec.ts` (new), `src/app/core/services/budget-state.service.spec.ts`

**Intent**: Prove the clock moves at midnight and that the state follows it while the view stays put.

**Contract**:
- `clock.service.spec.ts` (Vitest fake timers via `vi.useFakeTimers()`/`vi.setSystemTime()`, no `vi.mock`): `today` changes after time passes midnight and 60 s elapse; it changes after a `visibilitychange` event; a refresh within the same day does not emit a new value.
- `budget-state.service.spec.ts` switches to `FakeClockService`. New cases:
  - **Day rollover:** an expense added on 2026-10-12 is labelled `Dziś, …`; after `fake.set(2026-10-13 00:01)` it is `Wczoraj, …` and `summary().daysLeft` drops by one, without a reload.
  - **Month rollover:** viewing October 2026 with a limit, then `fake.set(2026-11-01 00:01)`: `currentPeriod()` is still `2026-10`, `isClosedMonth()` is true, `safeToSpendDaily()` is `null`, and `canGoNext()` is true; after `nextMonth()` the period is `2026-11`.
- All six existing cases still pass.

### Success Criteria:

#### Automated Verification:

- `npm run check` passes
- `clock.service.spec.ts` and the two new `budget-state.service.spec.ts` cases pass
- `rg -n "clock\.now\(\)" src/app/core/services/budget-state.service.ts` shows only the `addExpense` action
- `npm run test:e2e` passes on both projects (UI unchanged)

#### Manual Verification:

- `vi.mock` is not used anywhere in `src/`

---

## Phase 3: UI and End-to-End Coverage

### Overview

Show the closed-month summary in the hero, apply the new axis formatting, cover both with Playwright, and run all gates.

### Changes Required:

#### 1. Hero pill for closed months

**File**: `src/app/features/budget-app/budget-hero-gauge.component.ts`

**Intent**: Replace the "Bezpiecznie na dziś" pill with a month result when `state.isClosedMonth()` is true. The current month is unchanged.

**Contract**:
- Current month: exactly as today (`data-testid="safe-to-spend"`, "Bezpiecznie na dziś: … do końca miesiąca").
- Closed month, `data-testid="month-result"` on the value element:
  - `limitAmount() === null` → `Brak limitu w tym miesiącu`;
  - `remainingAmount() >= 0` → `Zostało z limitu: {remainingAmount} zł` (emerald, like today);
  - `remainingAmount() < 0` → `Przekroczono o {|remainingAmount|} zł` (rose, like a negative POZOSTAŁO).
- Branch on the whole-złoty `remainingAmount()`, so the pill always agrees with the POZOSTAŁO number.
- Keep the pill's position and size class so the layout does not jump between months.

#### 2. Chart y-axis ticks

**File**: `src/app/features/budget-app/budget-trend-chart.component.ts`

**Intent**: Distinct, readable axis labels for real amounts.

**Contract**: y-axis `ticks.callback` uses `formatAxisZloty(Number(val))`; `ticks.precision: 0`, `ticks.maxTicksLimit: 6`, and `suggestedMax: 100` so an empty month renders 0–100. Everything else in the chart stays as is.

#### 3. E2E tests

**File**: `e2e/budget-dashboard.spec.ts`

**Intent**: Prove the closed-month texts and the midnight rollover in a real browser.

**Contract**:
- **Closed month without a limit** (inside the existing `describe`): go to the previous month with `page.getByTitle('Poprzedni miesiąc')`; `[data-testid=month-result]` reads `Brak limitu w tym miesiącu`, and `Bezpiecznie na dziś:` is not shown.
- **Closed month over the limit** (inside the existing `describe`; the shared `beforeEach` has already loaded October): call `page.clock.setFixedTime(new Date('2026-09-20T10:00:00'))` and `page.reload()`; set the limit to 1000 and add a 1200 zł `Codzienny` expense; set the time back to `2026-10-12T10:00:00` and reload; go to the previous month: `month-result` reads `Przekroczono o 200 zł`. Back on October, `Bezpiecznie na dziś:` is visible again.
- **Midnight rollover** (new `test.describe` without the shared `beforeEach`): `page.clock.install({ time: new Date('2026-10-31T23:58:00') })`, `goto('/')`, set a limit and add an expense; `page.clock.fastForward('03:00')`; the header still shows `Październik 2026`, `month-result` is visible, the expense row shows `Wczoraj, 23:58`, and `Następny miesiąc` is enabled; clicking it shows `Listopad 2026` with `Bezpiecznie na dziś:`. If `fastForward` does not fire the 60-second interval, dispatch `visibilitychange` on `document` after it instead; do not shorten the interval for the test.
- Existing tests are unchanged and still pass.

### Success Criteria:

#### Automated Verification:

- `npm run check` passes
- `npm run test:e2e` passes on both projects (existing 7 tests plus the 3 new ones, × 2)
- Deliberate break: making `isClosed` always false makes the closed-month E2E tests fail (then reverted)

#### Manual Verification:

- Pixel 7 screenshots (production configuration, fixed clock): empty month shows distinct y-axis labels (`0` … `100`); a month with a few hundred złoty shows distinct whole-złoty labels; a month above 1000 zł shows `k` labels with a comma
- Pixel 7 screenshots of a closed month in all three pill variants; the pill does not wrap differently from the current month, and "Bezpiecznie na dziś:" is still above the fold on the current month
- KLASYFIKACJA percentages visibly add up to 100 in the US-01 state (three expenses, one per classification)

---

## Testing Strategy

### Unit Tests:

- Largest-remainder percentages, including the 99 and 101 cases and an empty month.
- `isClosed` and `safeToSpendDailyMinor === null` for past months.
- `formatAxisZloty` boundary values (0, 999.6, 1000, 1500, 12345).
- `ClockService` midnight and visibility refresh with fake timers.
- `BudgetStateService` day and month rollover with `FakeClockService`.

### Integration Tests:

- Playwright: closed month without limit, closed month over limit, midnight rollover.

### Manual Testing Steps:

1. Run the production build on port 4200 and open it with Playwright on Pixel 7 with a fixed clock.
2. Check the y-axis on an empty month, at a few hundred złoty and above 1000 zł.
3. Check the three closed-month pill variants and the current month's Safe-to-Spend position.

## Performance Considerations

The 60-second interval only compares two dates and updates a signal when the day changes, so it causes no recomputation during the day.

## Migration Notes

None. No stored data changes.

## References

- Review findings: `context/changes/canonical-expense-classification/reviews/impl-review.md`
- Previous plan (model, clock, E2E clock rules): `context/changes/canonical-expense-classification/plan.md`
- Domain functions: `src/app/core/domain/budget-summary.ts:57-125`
- State service computeds: `src/app/core/services/budget-state.service.ts:97-238`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Domain Functions

#### Automated

- [x] 1.1 `npm run check` passes — bb4de3d
- [x] 1.2 `budget-summary.spec.ts` and `money.spec.ts` contain the cases listed above and pass — bb4de3d
- [x] 1.3 Deliberate break: switching `classificationBreakdown` back to per-row `Math.round` makes `budget-summary.spec.ts` fail (then reverted) — bb4de3d

#### Manual

- [x] 1.4 No `src/app/features/` file changed in this phase except where a type change forced it — bb4de3d

### Phase 2: Reactive Clock

#### Automated

- [x] 2.1 `npm run check` passes — eeced79
- [x] 2.2 `clock.service.spec.ts` and the two new `budget-state.service.spec.ts` cases pass — eeced79
- [x] 2.3 `rg -n "clock\.now\(\)" src/app/core/services/budget-state.service.ts` shows only the `addExpense` action — eeced79
- [x] 2.4 `npm run test:e2e` passes on both projects (UI unchanged) — eeced79

#### Manual

- [x] 2.5 `vi.mock` is not used anywhere in `src/` — eeced79

### Phase 3: UI and End-to-End Coverage

#### Automated

- [x] 3.1 `npm run check` passes
- [x] 3.2 `npm run test:e2e` passes on both projects (existing 7 tests plus the 3 new ones, × 2)
- [x] 3.3 Deliberate break: making `isClosed` always false makes the closed-month E2E tests fail (then reverted)

#### Manual

- [x] 3.4 Pixel 7 screenshots (production configuration, fixed clock): empty month shows distinct y-axis labels (`0` … `100`); a month with a few hundred złoty shows distinct whole-złoty labels; a month above 1000 zł shows `k` labels with a comma
- [x] 3.5 Pixel 7 screenshots of a closed month in all three pill variants; the pill does not wrap differently from the current month, and "Bezpiecznie na dziś:" is still above the fold on the current month
- [x] 3.6 KLASYFIKACJA percentages visibly add up to 100 in the US-01 state (three expenses, one per classification)
