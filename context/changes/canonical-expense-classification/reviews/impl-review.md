# Implementation review: canonical-expense-classification

- Reviewed phases: 1–4
- Date: 2026-10-06
- Mode: manual (`/10x-impl-review` not installed)
- Scope: `git diff 0088a6c..83d8148` (commits 21534c2, 9f18152, 2702f0f, 4fe3fe1, 83d8148)
- Verdict: approved with minor follow-ups; 4.5 stays open until the push to `master` is approved and production is checked

## Plan conformance

| Plan item | Result |
| --- | --- |
| Legacy expense screens, mock/http services, seed data and `budzetapp_v2_data` writes removed | Matches; no `costflow_`, `budzetapp_v2_data` or `HttpClient` references left in `src/` |
| Canonical model (`finance.model.ts`), money in integer grosze, three classifications | Matches; `parseAmountToMinor` is string-based, rounding checked |
| Domain functions in `core/domain/` with unit tests (money, period, budget summary) | Matches the contract in the plan, including `classificationAfterFolderAssign` |
| Persistence behind abstract repositories, local implementations in `local/` | Matches; `localStorage` appears only in `local/` and in a spec `clear()`; corrupt JSON gives an empty store and a warning; deleting a folder detaches its expenses |
| `BudgetStateService` as the UI facade, errors reported, no private bracket access from components | Matches; `budget-transactions` now calls `assignToFolder` instead of writing `_months` |
| `ClockService` and `HapticsService` wrappers, no `vi.mock` | Matches; `@capacitor/haptics` is imported only in `haptics.service.ts` |
| Hero counts everyday + want, occasional shown as "+ X zł okazji poza limitem", `—` without a limit | Matches (screenshots) |
| Local "Ustaw limit miesięczny" modal, limit applies to the selected month and later months | Matches; September stays without a limit after setting one for October |
| KLASYFIKACJA card from real data with "poza limitem" badge and total | Matches; percentages sum to 100 in the checked case |
| Add modal: three classification buttons, default Codzienny, optional tags (Cykliczne, Służbowe, Spożywcze) | Matches |
| Real date, empty start, E2E on a fixed clock | Matches; suite uses `page.clock.setFixedTime('2026-10-12T10:00:00')` |
| No `eslint-disable`, plan edited only in Progress | Matches |

## Verification

- Gates: `npm run check` passes (format, lint, Vitest 47 of 47 in 8 files, build 676.87 kB initial, secret scan). Playwright 14 of 14 (Desktop and Pixel 7).
- Visual (Pixel 7, production configuration, clock fixed at 2026-10-12 10:00): empty start, limit modal, add modal, three expenses (one per classification), classification card, transaction list, previous month. Safe-to-Spend (`147 zł/dzień`) and the occasional caption are above the fold. Data survives a reload. No console errors.

## Findings

1. **Minor, chart y-axis labels repeat.** The tick formatter `(val / 1000).toFixed(1) + 'k'` came from the old code, where seed data was in thousands. With real, small amounts it prints `0.0k` six times on an empty month and `0.1k` three times with a few hundred złoty. Suggested fix: format ticks as whole złoty below 1000 or let Chart.js choose integer steps.
2. **Minor, dates are not reactive.** Computed signals read `clock.now()` once per recomputation. If the app stays open past midnight or into a new month, "today" and the current period update only after the next state change or reload.
3. **Minor, previous months reuse the "today" wording.** On a past month the hero still says "Bezpiecznie na dziś". Without a limit it shows `—`, so nothing is wrong numerically, but the text does not fit a closed month.
4. **Note, percentages are rounded per row.** They can sum to 99 or 101 in some cases. Acceptable for the MVP.

None of these blocks the push.

## Notes

- `npm run cap:build:apk` is still blocked as recorded under roadmap S-07, so it was not run.
- After the push, production starts empty for every user; data stored under the old keys is ignored, as decided in planning.
