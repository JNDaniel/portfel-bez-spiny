<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Rejestracja i logowanie email + hasło

- **Plan**: context/changes/email-password-sign-in/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-14
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings, 5 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

The plan-vs-code check found nothing MISSING, no DRIFT and no contradictions between phases. Every deviation traces back to a decision recorded in the phase 1 and phase 2 reviews. The remaining extras are harmless: spec helpers, extra specs, and the auth config without `fullyParallel`.

The security check came back clean:
- no secret or service-role key is read or passed;
- the `e2e-auth` fileReplacement cannot reach the production build;
- local mode never calls `getClient()`;
- there are no open redirects;
- the auth callback is synchronous.

Success criteria were checked on 31c7761. The epilogue commit changes only files under `context/`.
- `npm run test:e2e:auth`: 10/10
- `npm run test:e2e`: 22/22
- `npm run check`: 94/94 tests, build and bundle scan pass
- `git check-ignore`: pass
- break-check: pass
- Manual checks: 3.6 was run in the session, and 3.7 was skipped (optional, moved to S-08).

## Findings

### F1 — Repeated auth E2E runs hit the local sign-in/sign-up rate limit

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: supabase/config.toml:208, e2e/auth/auth-flow.spec.ts
- **Detail**: The local limit is `sign_in_sign_ups = 30` per 5 minutes per IP. Tests 2–5 send 1+2+2+2 = 7 sign-up/sign-in requests per project, so 14 per run. A third run within 5 minutes, or retries, fails with "Zbyt wiele prób…". The plan only counted registrations (≈10). This is calculated, not reproduced.
- **Fix**: Raise `sign_in_sign_ups` in the local-only `supabase/config.toml` (e.g. 300), then restart with `npx supabase stop && npx supabase start`. Staging and prod are unaffected.
- **Decision**: FIXED — `sign_in_sign_ups = 300` in local `supabase/config.toml`, stack restarted

### F2 — `reuseExistingServer` can reuse a wrong server on port 4300

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: playwright.auth.config.ts:60
- **Detail**: If anything already listens on 4300, Playwright skips `serve:e2e-auth`, so the generator does not run. The suite then tests whatever config that server has. Port 4300 exists only for this suite, so reusing a server buys little.
- **Fix**: Set `reuseExistingServer: false`.
- **Decision**: FIXED — `reuseExistingServer: false` in playwright.auth.config.ts

### F3 — Both Playwright suites write to the same report folders

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: playwright.auth.config.ts:40, playwright.config.ts:10
- **Detail**: Both configs use `reporter: 'html'` with the default `playwright-report/` and `test-results/`, so the last suite to run overwrites the other's report.
- **Fix**: In the auth config, set `outputDir: 'test-results/auth'` and `reporter: [['html', { outputFolder: 'playwright-report-auth' }]]`, and add the folder to `.gitignore`.
- **Decision**: FIXED — auth suite uses `test-results-auth/` and `playwright-report-auth/` (sibling folders, because the main suite cleans `test-results/`); both added to .gitignore and .prettierignore

### F4 — Staging/prod email-confirmation setting is not recorded

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: context/deployment/deploy-plan.md, src/app/core/auth/auth-errors.ts:3-4
- **Detail**: The roadmap's open question for S-03 ("Czy rejestracja wymaga potwierdzenia adresu email…", owner: user) is still open. If confirmation is off on a hosted project, the `user_already_exists` → "Konto z tym adresem już istnieje." message lets anyone check whether an email has an account. With confirmation on, Supabase hides that. The local Supabase built-in mailer also has `email_sent = 2` per hour, so hosted confirmation in production needs custom SMTP.
- **Fix**: Decide before S-08, then record "Confirm email = ON/OFF" for staging and prod in `deploy-plan.md` and close the roadmap question.
  - Strength: The decision is written down where S-08 will read it.
  - Tradeoff: ON requires SMTP setup before launch; OFF keeps registration faster but leaks whether an email is registered.
  - Confidence: MED — the mapping and local config were read; the hosted settings could not be checked from here.
  - Blind spot: The current dashboard setting on staging and prod.
- **Decision**: FIXED (Fix differently) — staging/prod settings checked via `supabase config diff`: Confirm email ON on both. Per user decision, `AuthService.signUp` maps a user without `identities` to "Konto z tym adresem już istnieje." (+ spec, break-check). deploy-plan.md Etap 2 gained an Auth settings table, an SMTP check before S-08, a ban on `config push` and a note about the regions; the S-03 roadmap question is closed and the SMTP question was added to S-08.

### F5 — Signing out in one tab shows "Sesja wygasła" in the other tabs

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/core/auth/auth.service.ts:107-116
- **Detail**: The `signingOut` flag is per tab. auth-js broadcasts `SIGNED_OUT` to all tabs, so after a deliberate logout the other tabs show the expiry toast. This follows from the plan's definition ("utrata sesji bez akcji użytkownika").
- **Fix**: Accept as is, or change the toast to neutral wording ("Wylogowano").
- **Decision**: FIXED + ACCEPTED-AS-RULE: Per-tab auth state vs cross-tab Supabase events — the toast title changed from "Sesja wygasła" to "Wylogowano" (message still "Zaloguj się ponownie.")

### F6 — No E2E check that local mode makes no Supabase requests

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: e2e/local-mode.spec.ts
- **Detail**: Manual check 1.4 and code reading back the "zero requests in local mode" guarantee, but no test asserts it.
- **Fix**: In test 11, collect `page.on('request')` and expect no URL matching `/54321|supabase\.co/`.
- **Decision**: SKIPPED

### F7 — Starting offline with an expired token sends the user to `/login`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/core/auth/auth.service.ts:93-95
- **Detail**: If the token refresh fails while offline, `getSession()` returns `null`, so the guard redirects to login and login then fails with "Brak połączenia". This matters mostly on Capacitor after more than an hour away. The code path was read, not reproduced.
- **Fix**: No change now; add it to S-07 (Android session behaviour) as a known case.
- **Decision**: SKIPPED

## Triage summary (2026-10-14)

- Fixed: F1, F2, F3, F4 (differently: existing-account detection + Auth settings documentation)
- Fixed + rule: F5 (lesson "Per-tab auth state vs cross-tab Supabase events"; toast title "Wylogowano")
- Skipped: F6, F7
