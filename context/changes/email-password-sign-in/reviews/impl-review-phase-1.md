<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Rejestracja i logowanie email + hasło

- **Plan**: context/changes/email-password-sign-in/plan.md
- **Scope**: Phase 1 of 3
- **Reviewed phases**: 1
- **Date**: 2026-10-14
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 5 observations

Note: Phase 1 automated items are `[x]`; manual item 1.4 (no Supabase requests in local mode) is still pending. The code is staged, not committed, so the review read the staged diff.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

Success criteria evidence (Node 24 via `.nvmrc`):
- `npm test -- --watch=false --include src/app/core/auth`: 3 files, 26 tests passed
- `npm run check`: format, lint, 12 files / 82 unit tests and build passed
- `npm run test:e2e`: 20 passed (10 cases × 2 projects)

## Findings

### F1 — signOut shows an error toast after the user was signed out

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/core/auth/auth.service.ts:71-83
- **Detail**: In the installed `@supabase/auth-js` 2.117.2, `_signOut` calls `_removeSession()` before returning a server error, for example a 500 or a network failure. `_removeSession()` emits `SIGNED_OUT`. The order is: `signingOut = true` → callback navigates to `/login` without a toast and resets the flag → `signOut()` returns `{ error }` → the catch shows "Nie udało się wylogować". The user is signed out and on `/login`, but sees a failure toast. The plan's "on error, do not navigate" branch only covers `getClient()` failures and a `sessionError` from `_useSession`. The unit tests do not cover the error path.
- **Fix**: In the catch, show the toast only when `this._session()` is still non-null. Add a spec where `signOut` resolves `{ error }` after emitting `SIGNED_OUT`.
- **Decision**: FIXED — the toast is guarded by `_session() !== null`; two error-path specs added (28/28 auth tests pass)

### F2 — A failed init is cached, so auth never recovers without a reload

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/app/core/auth/auth.service.ts:31-34, 85-97
- **Detail**: If `getClient()` rejects, for example because the lazy supabase-js chunk fails to load after a deploy, `whenReady()` resolves with `session = null` and `readyPromise` stays cached. `onAuthStateChange` is never subscribed. `SupabaseClientService.clientPromise` also caches the rejected promise, so every later `signIn`/`signUp` fails with "Brak połączenia…" until a full reload. If the client loads later, there is still no subscription, so "Wyloguj" would not navigate. Capacitor bundles the chunk locally, so mostly the web build is exposed.
- **Fix**: Clear `readyPromise` in the `init()` catch, and clear `clientPromise` in `SupabaseClientService` when the import rejects, so the next guard run retries.
  - Strength: Small, local change; keeps the "never reject" contract of `whenReady()`.
  - Tradeoff: It touches `SupabaseClientService`, which is outside the Phase 1 file list.
  - Confidence: MED — the failure needs a chunk-load or `createClient` error, which is uncommon.
  - Blind spot: Not reproduced in a browser; derived from reading the code.
- **Decision**: FIXED — `init()` clears `readyPromise` on failure, `getClient()` clears `clientPromise` on rejection; retry specs added in both services

### F3 — `code in MESSAGES` matches prototype keys

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/core/auth/auth-errors.ts:25
- **Detail**: The `in` operator walks the prototype chain. `{ code: 'constructor' }` or `{ code: 'toString' }` would return a function, typed as `string`, instead of the default message. Supabase does not send these codes, so the practical risk is negligible.
- **Fix**: Use `Object.hasOwn(MESSAGES, code)` instead of `code in MESSAGES`.
- **Decision**: FIXED — `Object.hasOwn(MESSAGES, code)`; `{ code: 'constructor' }` added to the fallback spec

### F4 — Stale rationale for the synchronous auth callback

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/core/auth/auth.service.ts:99
- **Detail**: The comment and the plan's "Critical Implementation Details" say supabase-js holds a lock during the callback, so it must stay synchronous. The installed auth-js 2.117.2 JSDoc for `onAuthStateChange` says callbacks "can be async and can safely call other Supabase auth methods". A synchronous callback is still correct and simplest. Only the stated reason is out of date.
- **Fix**: Change the comment to "Keep this callback quick and synchronous; it runs on every auth event across tabs."
- **Decision**: FIXED — comment reworded

### F5 — SupabaseClientService doc says only repositories may use it

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/app/core/supabase/supabase-client.service.ts:7
- **Detail**: The class comment says "Only repository implementations may use it." `AuthService` now uses it, as the plan intends (an auth service in `core/` is the boundary). The comment no longer describes the real rule, and a future agent could read it as a violation.
- **Fix**: Change it to "Only core repository implementations and AuthService may use it."
- **Decision**: FIXED — class comment now names AuthService

### F6 — Unrelated .gitignore change in the working tree

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: .gitignore:76-77
- **Detail**: An unstaged `.factory/mcp.json` ignore entry is not part of the plan. The `context/foundation/roadmap.md` status change to `in-progress` is expected bookkeeping.
- **Fix**: Keep the `.gitignore` change out of the S-03 commit, or commit it separately.
- **Decision**: FIXED — `.gitignore` change left unstaged; keep it out of the S-03 commit

## Triage summary

- Fixed: F1, F2, F3, F4, F5, F6 (6)
- After fixes: `npm run check` passed (12 files / 87 unit tests) and `npm run test:e2e` passed (20 passed)
