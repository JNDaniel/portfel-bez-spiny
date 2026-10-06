# Canonical Expense Classification — Plan Brief

> Full plan: `context/changes/canonical-expense-classification/plan.md`

## What & Why

Every expense gets an explicit classification: `Codzienny`, `Zachcianka` or `Okazjonalny`. Occasional expenses stop counting toward the monthly limit, the warning colours and Safe-to-Spend; wants still count and are shown separately. This is the core product rule (PRD US-01, FR-005, FR-006) and an AGENTS.md non-negotiable rule. The work happens on one canonical, repository-backed local model, so S-04 and S-05 only have to add Supabase implementations. Roadmap S-02.

## Starting Point

- **Two data models.** The dashboard uses `Transaction`/`MonthData` and writes to localStorage directly. Four unreachable English screens (`/expenses`, `/budgets`, `/analytics`, `/settings`) use a second, corporate `Expense`/`Budget` model.
- **No classification exists.** "Want" is a tag, "occasional" is only a folder, and Safe-to-Spend counts every expense.
- **The demo data is fake.** The chart plots hardcoded points, the date is July 2025, and money is stored as floats.

## Desired End State

- The app starts empty on the real date.
- The user sets a monthly limit, adds expenses with a preselected `Codzienny` classification, and can change the classification in a row.
- The hero counts only everyday and want expenses, with a caption for occasions outside the limit.
- A `KLASYFIKACJA` card and a real cumulative chart replace categories and static points.
- Moving an everyday expense into a folder makes it occasional.
- All data goes through repositories, money is stored in grosze, and the rules are pure, unit-tested functions.
- The E2E suite proves the US-01 numbers under a fixed clock.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Legacy screens | Delete with their model, services and shared nav | Unreachable, English, B2B, and a second source of truth |
| Tags vs classification | `Zachcianka`/`Zbędne` → `want`; `Potrzebne` removed; `Cykliczne`, `Służbowe`, `Spożywcze` stay | Classification carries budget impact; tags stay descriptive (PRD keeps tagging) |
| Folder rule | Assigning an `everyday` expense to a folder makes it `occasional`; `want` stays; removal never changes it | Folders mean occasions, without hidden reversals |
| Categories and charts | Category stays in the model and form; `KATEGORIE` → `KLASYFIKACJA`; chart from real data (in-limit vs occasions) | Classification is what the product is about; category info is kept |
| Date and seed | Real date and an empty start; E2E uses `page.clock` | Behaves like a new account (PRD: no demo data migration) |
| Hero | Gauge, WYDANO, POZOSTAŁO and Safe-to-Spend use everyday + want; caption `+ X zł okazji poza limitem` | Explains why the total differs, without a new screen |
| Form | Three buttons with `Codzienny` default | No extra step (AGENTS.md) |
| Empty limit | Local `Ustaw limit miesięczny` modal; the limit applies from that month on; `—` without a limit | An honest empty state; S-04 later makes it private and persistent in Supabase |
| Money | Integer grosze (`amountMinor`) + `currency: 'PLN'` | Delivery plan Phase 4; avoids float drift |
| Persistence | Three async repositories (expenses, monthly budgets, folders) + one localStorage key `pbs_finance_v1` | Matches the planned Supabase tables; components never touch storage |
| Old data | Ignored, not migrated or deleted | PRD §Constraints |

## Phases at a Glance

| # | Phase | Delivers | Visible change |
| --- | --- | --- | --- |
| 1 | Remove legacy screens and second model | Single model; legacy routes fall back to the dashboard | No |
| 2 | Canonical model, domain functions, local repositories | `finance.model.ts`, money/period/summary functions, clock, a haptics wrapper (Haptics throws without vibrate support, and `vi.mock` does not work with this builder), repositories, unit tests | No |
| 3 | Dashboard on the canonical model | New state service, hero + limit modal, `KLASYFIKACJA`, real chart, classification in the form and rows, new E2E suite | Yes |
| 4 | Documentation and handoff | AGENTS.md, README, final checks | No |

**Prerequisites:** F-01 and F-02 (done), S-01 (done). Node 24 via nvm.
**Estimated effort:** medium-large; Phase 3 is the bulk of the work.

## Verification Highlights

- **Unit:** the US-01 case (limit 3100 zł, everyday 500, want 100, occasional 4000 on 12 Oct 2026) gives 19%, 125 zł/dzień, remaining 2500 zł and a breakdown of 11/2/87%. The folder rule, past and future months, money parsing (`0.29 → 29`), and the repository round trips are also covered.
- **E2E:** 7 scenarios on Desktop Chrome and Pixel 7, with deliberate-break checks on the occasional exclusion and the folder rule.
- **Manual:** screenshots of the empty and filled states. Safe-to-Spend must stay above the Pixel 7 fold.

## Risks

- Phase 3 is large, because the state service and every dashboard component change together with the E2E suite. Mitigation: Phase 2 delivers and tests all the logic first, and Phase 3 only wires it into the UI.
- Production users of the old demo will see an empty dashboard after deploy. This is intended, and the push needs the user's approval.
