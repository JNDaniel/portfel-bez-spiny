# Dashboard Review Follow-ups — Plan Brief

> Full plan: `context/changes/dashboard-review-followups/plan.md`
> Source: `context/changes/canonical-expense-classification/reviews/impl-review.md` (findings 1–4)

## What & Why

The S-02 review approved the canonical classification work but found four small dashboard flaws: repeated y-axis labels, "today" that never moves while the app is open, a "Bezpiecznie na dziś" pill on finished months, and percentages that can sum to 99 or 101. They are fixed before S-02 reaches production, so both changes are pushed together.

## Starting Point

- The chart formats every tick as `(val / 1000).toFixed(1) + 'k'`, left over from the old seed data in thousands.
- `ClockService` only has `now()`, which `computed` signals cannot track.
- `summarizeMonth` treats a past month as having one day left, so the pill shows the whole remaining limit as a "daily" amount.
- `classificationBreakdown` rounds each row on its own.

## Desired End State

- The y-axis shows distinct labels: `0`, `100`, `250` below 1000 zł and `1k`, `1,5k` above; an empty month shows 0–100.
- At midnight and when the app comes back to the foreground, day labels, Safe-to-Spend, days left and the chart update without a reload. When a month ends, the view stays put, the month becomes closed and the "next" arrow unlocks.
- A closed month's pill reads `Zostało z limitu: X zł`, `Przekroczono o X zł` or `Brak limitu w tym miesiącu`.
- KLASYFIKACJA percentages always sum to 100.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Scope | All four review findings | They are small and touch the same few files |
| Release | Hold S-02; push both together after review | Production should never show the flawed version |
| Month rollover | View stays on the viewed month; only the "next" arrow unlocks | Do not interrupt the user mid-task; the case is rare |
| Closed month pill | "Zostało z limitu: X zł" / "Przekroczono o X zł" | A finished month needs a result, not a daily allowance |
| Closed month without limit | "Brak limitu w tym miesiącu" | Keeps the pill and layout stable |
| Y-axis format | Whole złoty below 1000, then `1,5k` with a Polish comma | Short labels that match the Polish x-axis |
| Percentages | Largest-remainder method, ties in row order | Always sums to 100, each row within 1 point of its exact share |
| Clock refresh | 60-second interval plus `visibilitychange`, day-level equality | Survives throttled timers on mobile and costs nothing during the day |

## Scope

**In scope:** `budget-summary.ts`, `money.ts`, `clock.service.ts` (+ a `FakeClockService` for specs), `budget-state.service.ts`, the hero and trend-chart components, unit tests, three new Playwright tests.

**Out of scope:** auto-switching to the new month, changes to `daysLeft` or the hero numbers, new chart features, data model or storage changes, new dependencies, pushing during implementation.

## Architecture / Approach

Pure domain functions first (percentages, `isClosed`, `formatAxisZloty`). Then `ClockService.today` becomes the single reactive source of "today", read by every date-dependent `computed` in `BudgetStateService`; `now()` stays for timestamps. Finally the hero and chart use the new pieces, and Playwright covers closed months and a midnight rollover with `page.clock.install()` + `fastForward()`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Domain Functions | Percentages sum to 100, `isClosed`, axis formatter, unit tests | Existing spec assertions on past-month Safe-to-Spend need updating |
| 2. Reactive Clock | `today` signal, state service on it, rollover unit tests | Timers leaking between TestBed tests if cleanup is missed |
| 3. UI and E2E | Closed-month pill, new axis ticks, 3 Playwright tests, gates | `page.clock.install()` must not run after `setFixedTime()` in one page |

**Prerequisites:** S-02 commits present locally (unpushed); Node 24.
**Estimated effort:** one implementation session, 3 phases.

## Open Risks & Assumptions

- Mobile WebViews may suspend timers in the background; `visibilitychange` covers the resume.
- Playwright's clock API (1.62) drives intervals in `fastForward`; if it does not, the rollover test falls back to dispatching `visibilitychange`.

## Success Criteria (Summary)

- No repeated axis labels, and the percentages always add up to 100.
- An app left open overnight shows the right "today" in the morning without a reload.
- A finished month shows a clear result instead of a daily allowance.
