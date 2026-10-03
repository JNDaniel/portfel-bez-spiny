---
id: stabilize-and-supabase-mvp
title: Stabilize the application and add the Supabase MVP backend
status: planned
context_type: brownfield
created: 2026-09-17
source_prd: context/foundation/prd.md
source_health_check: context/foundation/health-check.md
baseline_commit: 90c236e
---

# Stabilize and deliver the Supabase MVP

## Intent

Turn the current local prototype into a reliable base for the production MVP described in the PRD. Work is deliberately split into two tracks that run in order:

1. restore a trustworthy local validation baseline;
2. add authentication and private persistent data through Supabase.

Infrastructure deployment and CI remain later work, but the commands they will automate must be reliable before backend implementation begins.

The Supabase foundation is set up early, together with the first web deployment, as described in `context/deployment/deploy-plan.md`: staging and prod projects, Auth URL configuration, the `supabase/` directory with a baseline migration, the client provider, build-time configuration, the `DATA_BACKEND` switch, and a repository boundary under the main dashboard flow with an active LocalStorage adapter. Phases 4–8 build on that foundation; switching to Supabase means adding schema, adapters and Auth UI, then changing `DATA_BACKEND`.

## Decisions

- Use Supabase Auth, Postgres and Row Level Security.
- Integrate Supabase behind Angular repository and authentication services.
- Do not use Edge Functions unless an operation requires a trusted secret.
- Keep mock repositories for demos and isolated tests.
- Do not migrate existing LocalStorage demonstration data.
- Stabilize the project before implementing backend behavior.
- Plan for up to six after-hours weeks, with the existing 2026-11-04 hard deadline.

## Estimate and Schedule

Estimated effort: 30–50 hours.

| Week | Primary outcome | Estimated effort |
|---|---|---:|
| 1 | Green unit/E2E baseline and security-upgrade research | 5–8h |
| 2 | Angular/toolchain security upgrade | 5–10h |
| 3 | Lint/format checks and canonical domain contract | 5–8h |
| 4 | Supabase migrations, constraints and RLS tests | 5–8h |
| 5 | Authentication and protected navigation | 5–8h |
| 6 | Private repositories, MVP E2E flow and Android validation | 5–8h |

If work reaches the upper estimate, preserve the must-have flow from FR-001 through FR-007 and defer FR-008 plus nonessential generic dashboard cleanup. The hard deadline takes precedence over optional polish.

## Scope

### Included

- Health-check Category A fixes.
- Safe Angular/toolchain security upgrade.
- Working unit and E2E test baseline.
- Lint and formatting checks.
- Canonical consumer-finance domain contract.
- Supabase local configuration, migrations, Auth integration and RLS.
- Private budgets, expenses and folders for each authenticated user.
- Desktop and mobile validation of the primary PRD flow.

### Excluded

- Bank notification ingestion.
- Production OCR, voice processing or AI analysis.
- Shared/family accounts and administrator roles.
- Migration of LocalStorage demo records.
- Edge Functions without an identified trusted-server use case.
- CI/CD and production deployment implementation.

## Delivery Plan

### Phase 1: Restore a green test baseline

1. Replace stale generated assertions in `src/app/app.component.spec.ts` with tests for the current root component contract.
2. Diagnose the Mobile Pixel add-expense failure. Confirm whether the action is hidden, replaced by a mobile FAB, or inaccessible by role.
3. Fix the responsive UI or test locator at the correct layer.
4. Run:

   ```bash
   npm run build
   npm run test -- --watch=false
   npm run test:e2e
   npm run cap:sync
   ```

5. Commit the test-baseline repair separately.

**Exit criteria:** build passes, all unit tests execute and pass, and all 10 Playwright cases pass on desktop and mobile.

### Phase 2: Remove known dependency security blockers

1. Capture the current `npm audit --json` result as comparison evidence.
2. Check Angular, Ionic and TypeScript compatibility for each target major.
3. Upgrade Angular framework and CLI one supported major at a time, applying official migrations.
4. Re-run the full validation suite after each major.
5. Upgrade directly affected compatible packages and review remaining transitive advisories.
6. Run Capacitor synchronization and APK validation because framework dependencies affect the mobile application:

   ```bash
   npm audit
   npm run build
   npm run test -- --watch=false
   npm run test:e2e
   npm run cap:sync
   npm run cap:build:apk
   ```

7. Do not use `npm audit fix --force`.

**Exit criteria:** no CRITICAL audit finding; every remaining HIGH finding has either been removed or documented with reachability, ownership and an explicit acceptance decision.

### Phase 3: Add deterministic local quality checks

1. Add Angular ESLint using a version compatible with the upgraded Angular line.
2. Add a `lint` script and make it pass without broad unrelated rewrites.
3. Add and pin Prettier, with `format` and `format:check` scripts.
4. Add a secret-free `.env.example` only when the Supabase variable names are introduced.
5. Investigate why `.npmrc` disables strict SSL. Remove that override if the environment works with normal certificate verification; otherwise document the trusted certificate setup instead of retaining a silent global bypass.

**Exit criteria:** build, unit tests, E2E, lint and format checks all pass locally.

### Phase 4: Freeze the canonical consumer-finance contract

1. Map the user-facing `Transaction`, `MonthData`, folders and tags against the separate `Expense` and `Budget` repository models.
2. Select one canonical model for FR-003 through FR-006. Treat the current consumer-facing dashboard behavior as the preserved contract.
3. Represent the budget-impact classification explicitly as `everyday | occasional | want`; keep free-form/display tags separate.
4. Store money as integer minor units plus currency.
5. Define repository methods needed by the primary flow before writing Supabase adapters.
6. Remove or clearly isolate obsolete generic business-expense surfaces only after coverage proves they are outside the preserved MVP flow.

**Exit criteria:** one documented, typed contract represents monthly budgets, expenses, classifications, folders and dashboard inputs without parallel sources of truth.

### Phase 5: Create the Supabase data and security foundation

1. Add the Supabase CLI/project structure and versioned SQL migrations.
2. Create user-owned tables:
   - `monthly_budgets`;
   - `expense_folders`;
   - `expenses`.
3. Add ownership foreign keys to `auth.users`, uniqueness constraints, money/currency checks, classification checks and timestamps.
4. Enable RLS on every user-owned table.
5. Add SELECT/INSERT/UPDATE/DELETE policies constrained by `auth.uid() = user_id`.
6. Add database tests using two users. Prove that each user can access their own records and cannot read or mutate the other user's records.
7. Seed only local test data, never production credentials or personal data.

**Exit criteria:** migrations recreate the schema from zero and automated policy tests prove account isolation.

### Phase 6: Integrate authentication

1. Add `@supabase/supabase-js`.
2. Configure the Supabase URL and publishable key through environment configuration. Never expose a secret/service-role key.
3. Implement session state, registration, login, logout and session restoration.
4. Add route protection and redirect unauthenticated users to login.
5. Handle expired sessions and authentication errors without losing unsaved form state where practical.
6. Add unit/integration tests for auth state and route guards.

**Exit criteria:** a user can register, sign in, restore a session, sign out, and cannot open protected routes while signed out.

### Phase 7: Integrate private budgets and expenses

1. Implement Supabase repositories for the canonical budget, expense and folder contracts.
2. Map database snake_case records to TypeScript domain models at the repository boundary.
3. Switch production mode from LocalStorage/mock data to Supabase while retaining explicit mock mode.
4. Preserve the domain rule:
   - every expense contributes to total spending;
   - `occasional` does not reduce the daily limit or Safe-to-Spend;
   - `want` does reduce them and is reported separately.
5. Keep dashboard calculations in one tested domain layer rather than duplicating them across components and SQL.
6. Add loading, empty, retry and error states.

**Exit criteria:** FR-003 through FR-006 work after reload and remain isolated between two accounts.

### Phase 8: Validate the MVP slice

1. Add E2E scenarios for:
   - registration and login;
   - setting a monthly budget;
   - adding everyday, occasional and want expenses;
   - dashboard and Safe-to-Spend calculations;
   - persistence after reload;
   - logout and route protection;
   - two-user data isolation.
2. Run the complete web validation suite.
3. Run `npm run cap:sync` and `npm run cap:build:apk`.
4. Validate the primary flow on the Capacitor Android surface.
5. Re-run `npm audit` and record accepted residual findings.

**Exit criteria:** the primary PRD acceptance criteria pass on web and Android, and no client bundle contains a Supabase secret key.

## Suggested Commit Boundaries

1. `test: restore unit and mobile e2e baseline`
2. `build: upgrade vulnerable frontend toolchain`
3. `chore: add lint and formatting checks`
4. `refactor: unify consumer finance domain contracts`
5. `feat: add Supabase schema and row-level security`
6. `feat: add Supabase authentication`
7. `feat: persist private budgets and expenses`
8. `test: cover authenticated MVP flow`

## Risks and Controls

| Risk | Control |
|---|---|
| Angular major upgrade breaks Ionic or Capacitor | Upgrade one major at a time and run web, sync and APK checks after each step. |
| Direct client access leaks data | Treat RLS as mandatory authorization and test with two users. |
| Service-role key reaches a client bundle | Use publishable key only and scan built output/configuration. |
| Two existing domain models cause backend drift | Freeze a canonical contract before creating tables or adapters. |
| Floating-point money changes totals | Persist integer minor units and test conversions. |
| Scope exceeds 15–30 hours | Deliver phases in order; defer optional radar and non-goal integrations. |
| Supabase outage or setup blocks UI development | Preserve explicit mock repositories and contract tests. |

## Definition of Done

- Health-check critical blockers are resolved or explicitly accepted with evidence.
- Local build, unit, E2E, lint and format checks pass.
- Supabase migrations recreate the backend.
- RLS tests prove two-user isolation.
- Registration, login, budget setup, classified expense CRUD and dashboard persistence satisfy the PRD.
- The main flow works on web and Android.
- No production secret is committed or bundled.
- CI/CD and production deployment remain clearly handed off to the infrastructure phase.
