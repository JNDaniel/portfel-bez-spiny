<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Dashboard Review Follow-ups

- **Plan**: context/changes/dashboard-review-followups/plan.md
- **Scope**: Phase 3 of 3
- **Reviewed phases**: 3
- **Date**: 2026-10-06
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

## Evidence

- Hero (d099e48): current month unchanged (`safe-to-spend`); closed month shows `month-result` with `Brak limitu w tym miesiącu`, `Zostało z limitu: X zł` (emerald) or `Przekroczono o X zł` (rose), branching on whole-złoty `remainingAmount()` so it agrees with POZOSTAŁO.
- Chart: `formatAxisZloty`, `precision: 0`, `maxTicksLimit: 6`, `suggestedMax: 100`; nothing else changed.
- E2E: tests 8 and 9 in the shared `describe`, test 10 in its own `describe` with `page.clock.install()` + `fastForward('03:00')` (no `setFixedTime` on that page); the interval fired, so no `visibilitychange` fallback was needed.
- Gates on HEAD: `npm run check` exit 0; Playwright 20 of 20 (10 tests × 2 projects).
- Deliberate break 3.3 repeated: `isClosed = false` makes tests 8 and 9 fail on Desktop Chrome; reverted, working tree clean.
- Screenshots (Pixel 7, production configuration, fixed clock, `/tmp/s02vis/fu/`): y-axis `0 20 40 60 80 100` on an empty month, `0 100 200 300` with a few hundred złoty, `0 500 1k 1,5k 2k` above 1000 zł; closed-month pills read `Brak limitu w tym miesiącu`, `Zostało z limitu: 800 zł`, `Przekroczono o 200 zł`; Safe-to-Spend at y = 310 of 839 on the current month.

## Findings

### F1 — Closed-month pill is one line, current-month pill is two

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/app/features/budget-app/budget-hero-gauge.component.ts:79-102
- **Detail**: On Pixel 7 the current-month pill wraps to two lines ("… do końca / miesiąca"), the closed-month pill fits on one. The hero card is about 24 px shorter on a closed month, so the content below moves when switching months. Criterion 3.5 ("the pill does not wrap differently from the current month") is checked although it does not hold literally; the plan asked to keep the layout stable.
- **Fix**: Give the pill text a minimum height equal to two lines of `text-xs` (e.g. `min-h-[2lh]` or `min-h-8` on the inner span, items centred), so both variants occupy the same space.
- **Decision**: PENDING

### F2 — Pill border stays emerald for overspend and no-limit

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/app/features/budget-app/budget-hero-gauge.component.ts:76
- **Detail**: `Przekroczono o 200 zł` is rose text inside an emerald border, which mixes a warning colour with the "all good" frame.
- **Fix**: Bind the border colour to the same three-way condition (rose border for overspend, slate for no limit).
- **Decision**: PENDING

### F3 — Progress row 3.4 has no commit SHA

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: context/changes/dashboard-review-followups/plan.md (Progress 3.4)
- **Detail**: Every other checked row ends with ` — <sha>`; 3.4 does not. The screenshots above confirm the criterion itself holds.
- **Fix**: Append ` — d099e48` to row 3.4.
- **Decision**: PENDING
