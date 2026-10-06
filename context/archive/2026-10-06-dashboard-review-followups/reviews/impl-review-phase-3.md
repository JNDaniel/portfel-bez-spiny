<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Dashboard Review Follow-ups

- **Plan**: context/changes/dashboard-review-followups/plan.md
- **Scope**: Phase 3 of 3
- **Reviewed phases**: 3
- **Date**: 2026-10-06
- **Verdict**: APPROVED
- **Findings**: 1 critical (found during fix verification, pre-existing), 1 warning, 2 observations

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
- **Decision**: FIXED — closed-month text gets `max-md:min-h-[2lh]`; pill height on Pixel 7 is 47 px current vs 46 px closed (was 31), Desktop 31 vs 30

### F2 — Pill border stays emerald for overspend and no-limit

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/app/features/budget-app/budget-hero-gauge.component.ts:76
- **Detail**: `Przekroczono o 200 zł` is rose text inside an emerald border, which mixes a warning colour with the "all good" frame.
- **Fix**: Bind the border colour to the same three-way condition (rose border for overspend, slate for no limit).
- **Decision**: FIXED — `pillBorderClass()` and `monthResultTextClass()` share one `monthResultTone` computed

### F3 — Progress row 3.4 has no commit SHA

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: context/changes/dashboard-review-followups/plan.md (Progress 3.4)
- **Detail**: Every other checked row ends with ` — <sha>`; 3.4 does not. The screenshots above confirm the criterion itself holds.
- **Fix**: Append ` — d099e48` to row 3.4.
- **Decision**: FIXED

### F4 — Hero gauge swallows taps on the month arrows on Pixel 7

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/features/budget-app/budget-hero-gauge.component.ts:22
- **Detail**: Found while verifying F1; it predates this change (the gauge SVG is unchanged since before S-02). The rotated `w-64 h-64` SVG overflows upward into the header. After the first month change, `elementFromPoint` at the "Poprzedni miesiąc" arrow returns the SVG, so on Pixel 7 a user cannot go back more than one month. Desktop is not affected. Existing E2E tests click the arrow only once.
- **Fix**: `pointer-events-none` and `aria-hidden="true"` on the decorative SVG; test 8 now clicks "Poprzedni miesiąc" a second time and expects `Sierpień 2026`.
- **Decision**: FIXED — without the fix test 8 fails on Mobile Pixel and passes on Desktop; with it both pass. `npm run check` exit 0 (56 of 56), Playwright 20 of 20.

## Triage summary

- Fixed: F1, F2, F3, F4
