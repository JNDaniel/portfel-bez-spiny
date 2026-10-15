<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Prywatny budżet miesięczny w Supabase

- **Plan**: context/changes/private-monthly-budget/plan.md
- **Scope**: Full plan (Phase 4 step 4 — staging push — not yet executed)
- **Reviewed phases**: 1, 2, 3, 4
- **Date**: 2026-10-16
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 3 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Evidence for PASS verdicts:
- Plan Adherence: every planned change is MATCH (migration, pgTAP 20/20, adapter, `provideRepositories`, `AuthService.userId`, `BudgetStateService` generation guard, three E2E scenarios, docs). Benign extras: non-PLN adapter test, stale-mutation unit test, extra UI fields reset in `applyIdentity`.
- Scope Discipline: nothing from "What We're NOT Doing" was implemented (no LocalStorage prefixing, no UI/loading changes, no seed.sql, no prod/`DATA_BACKEND` change).
- Success Criteria (re-run 2026-10-16): `db reset` OK; `test:db` 20/20; `check` 16 files / 110 tests, bundle-scan OK; `test:e2e` 22/22; `test:e2e:auth` 16/16. Manual items 1.4, 2.4, 2.5, 3.4, 4.5–4.7 pending (unchecked, no false ticks). `deploy-plan.md` staging note is intentionally uncommitted until `db push` succeeds.
- Security: RLS on all four commands with `(select auth.uid()) = user_id`, UPDATE has `using` + `with check`, explicit revoke/grant, no SECURITY DEFINER, adapter imports types only, upsert without `user_id` confirmed by pgTAP and E2E.

## Findings

### F1 — Reload can overwrite a newer limit within one generation

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/app/core/services/budget-state.service.ts:259-283
- **Detail**: `generation` only guards identity changes. Within one generation the reload that finishes last wins. On sign-in the effect starts `reload()` (network in Supabase mode); `loaded` is never read by the UI (only writes at :74/:280/:306), so "Ustaw limit miesięczny" is clickable during loading. If the user saves a limit before the first `list()` returns, the late snapshot replaces `budgets` and the new limit disappears from the UI until the next reload. Same for an error-path `reload()` racing another reload.
- **Fix A ⭐ Recommended**: Per-call reload sequence (newest-started wins) plus a mutation counter so a reload started before the last successful mutation drops its result; no UI change.
  - Strength: Closes the race inside the service, matches the existing generation pattern, stays within "no UI changes" of this plan.
  - Tradeoff: Two counters in the service; slightly more logic for S-05/S-06 to copy.
  - Confidence: MED — straightforward, but needs a unit test for reload-vs-mutation ordering.
  - Blind spot: Not reproduced in a browser; window is the first network round-trip.
- **Fix B**: Defer to S-05 together with loading states (change.md Phase 7), gating mutations on `loaded`.
  - Strength: Solves it where loading UI is planned anyway; no extra code now.
  - Tradeoff: Known race ships to staging; S-05 must remember it.
  - Confidence: HIGH — Phase 7 already plans loading/empty/error states.
  - Blind spot: S-05 scope may grow.
- **Decision**: FIXED (Fix A)

### F2 — run() writes previous user's result before wiping, then re-applies identity

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/app/core/services/budget-state.service.ts:317-331 (actions e.g. :603-612, :355-361)
- **Detail**: Actions write signals right after their `await` (e.g. `setMonthlyLimit` adds A's record to `budgets`), and `run()` only wipes afterwards. The effect has already applied B's identity, so the trailing `applyIdentity` runs a second time: it closes a modal B may have opened, resets the viewed month and restarts B's load. A mutation B starts in that window also sees a generation mismatch, so its error is swallowed (:322). Harmless today (tiny window, expenses/folders local), but S-05/S-06 will copy this template.
- **Fix A ⭐ Recommended**: Pass an `isCurrent()` guard into actions and check it after each `await` before writing signals; drop the trailing `applyIdentity`.
  - Strength: Previous-user data never reaches signals; no double reset; errors of B's own actions keep being reported.
  - Tradeoff: Touches every action that calls `run()` (mechanical edit).
  - Confidence: HIGH — existing unit test "does not keep a mutation result of the previous user" covers the invariant.
  - Blind spot: Optimistic writes before the first `await` need checking per action.
- **Fix B**: Keep as is now, record a lesson, fix when S-05 moves expenses to Supabase.
  - Strength: No churn in this slice.
  - Tradeoff: Pattern is copied before it is fixed.
  - Confidence: MED.
  - Blind spot: None significant.
- **Decision**: FIXED (Fix A)

### F3 — E2E "B sees empty state" assertions also pass while loading

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: e2e/auth/monthly-budget.spec.ts (scenario 2 after `register(B)`, scenario 3 final assertions)
- **Detail**: "Ustaw limit miesięczny" visible and `safe-to-spend` = "—" are true right after `applyIdentity` wipes state, before B's `list()` returns, so they do not prove A's limit never appears after loading. Scenario 2 is partly saved by the later `setLimit('2000')`; scenario 3 is not.
- **Fix**: Wait for the `rest/v1/monthly_budgets` response (`page.waitForResponse`) before asserting the empty state.
- **Decision**: FIXED

### F4 — DB accepts values the domain cannot represent (day ≠ 1, currency ≠ PLN)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: supabase/migrations/20261015155901_monthly_budgets.sql:7,9; src/app/core/repositories/supabase/supabase-monthly-budget.repository.ts:16-19
- **Detail**: A direct API write by the account owner can insert `2026-10-15` next to `2026-10-01` (two budgets in one `Period` after `slice(0,7)`) or `currency = 'EUR'` (adapter throws, whole `list()` fails, dashboard loads no budgets). Only the owner can do it to their own data. The plan deliberately excluded the day-1 constraint ("What We're NOT Doing"); currency regex follows the PRD's "explicit currency code".
- **Fix A ⭐ Recommended**: Keep as planned; note it for S-08 hardening.
  - Strength: Respects the plan's explicit exclusion; impact limited to self-inflicted data.
  - Tradeoff: Template for S-05 keeps a permissive schema.
  - Confidence: HIGH — RLS prevents cross-user impact.
  - Blind spot: None significant.
- **Fix B**: Tighten now with `check (extract(day from effective_from) = 1)` and `check (currency = 'PLN')` — the migration is not yet on staging, so it can still be edited in place.
  - Strength: DB matches the domain; cheapest moment to change.
  - Tradeoff: Reopens a plan exclusion; later multi-currency needs a migration.
  - Confidence: HIGH.
  - Blind spot: None significant.
- **Decision**: FIXED (Fix B — migration edited in place before staging push)

### F5 — Load error shown as "Nie udało się zapisać zmian" in a passive tab

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (lessons.md: Per-tab auth state vs cross-tab Supabase events)
- **Location**: src/app/core/services/budget-state.service.ts:312-315
- **Detail**: `reload()` now runs on every identity change, including `SIGNED_IN` broadcast from another tab. A failed load there tells the user a save failed although they saved nothing — the class of message the lesson warns about.
- **Fix**: Give `reportError` a title parameter and use "Nie udało się wczytać danych" from `reload()`.
- **Decision**: FIXED

### F6 — pgTAP write isolation is one-directional

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: supabase/tests/monthly_budgets_rls.test.sql
- **Detail**: Writes are tested only A→B (B runs SELECTs only); `anon` covers SELECT and INSERT but not UPDATE/DELETE. The PRD requirement is arguably met, but this file is the template for S-05/S-06.
- **Fix**: Add B→A UPDATE/DELETE (0 rows) and `anon` UPDATE/DELETE (42501) assertions, bump `plan(n)`.
- **Decision**: FIXED

### F7 — AuthService import in its own group

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/app/core/services/budget-state.service.ts:3
- **Detail**: The new `../auth/auth.service` import is separated by a blank line from the other relative imports, unlike the rest of the file.
- **Fix**: Move it into the existing relative import group.
- **Decision**: FIXED
