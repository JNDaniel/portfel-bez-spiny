<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Dashboard Review Follow-ups

- **Plan**: context/changes/dashboard-review-followups/plan.md
- **Scope**: Phase 2 of 3
- **Reviewed phases**: 2
- **Date**: 2026-10-06
- **Verdict**: APPROVED
- **Findings**: 0 critical, 0 warnings, 0 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Evidence

- `ClockService` (eeced79): `now()` unchanged; `today` is a read-only signal of local midnight with a `getTime()` equality, so a same-day refresh emits nothing; `refresh()` runs from a 60 s `setInterval` and on `visibilitychange` when visible; both are removed through `DestroyRef`.
- `FakeClockService` in `clock.service.testing.ts` has the same public surface plus `set(date)`; it is imported only by `budget-state.service.spec.ts`.
- `BudgetStateService`: `currentPeriod` initial value, `canGoNext`, `summary`, `trend`, `vsPreviousMonth`, `monthExpenses` and `subscriptions` read `clock.today()`; `isClosedMonth` added; `addExpense` calls `clock.refresh()` before `now()`. `currentPeriod` is never changed on rollover, matching the user decision.
- 2.3: `rg "clock\.now\(\)"` in the state service returns only line 533 (`addExpense`).
- 2.5: no `vi.mock` in `src/`.
- Specs: three `ClockService` cases (midnight via interval, `visibilitychange`, same-day identity) with Vitest fake timers and `TestBed.resetTestingModule()` teardown; two state cases (day rollover relabels `Dziś` → `Wczoraj` and drops `daysLeft` by one; month rollover keeps `2026-10`, closes it, nulls Safe-to-Spend and unlocks `nextMonth`). The six earlier cases still pass.
- Gates on HEAD: `npm run check` exit 0 (Vitest 56 of 56); Playwright 20 of 20.

## Findings

None.
