# Canonical Expense Classification Implementation Plan

## Overview

Give every expense an explicit classification — everyday (`Codzienny`), want (`Zachcianka`) or occasional (`Okazjonalny`) — on one canonical, repository-backed local model that every remaining screen reads. Occasional expenses stop counting toward the monthly limit, the warning state and Safe-to-Spend; wants still count and are reported separately; the dashboard charts are calculated from real expenses and grouped by classification. The unreachable English "corporate" screens and their second model are removed. Roadmap S-02 (US-01, FR-005, FR-006); it unlocks S-04/S-05, which will add Supabase implementations of the repositories defined here.

## Current State Analysis

- **Two data models.**
  - The live dashboard (`/dashboard` → `src/app/features/budget-app/budget-main.component.ts`) uses `Transaction`/`MonthData` from `src/app/core/models/budget-app.model.ts`. `BudgetStateService` (`src/app/core/services/budget-state.service.ts`) holds it and writes it straight to localStorage under `budzetapp_v2_data` (`:204`, `:375-399`), with no repository.
  - `/expenses`, `/budgets`, `/analytics` and `/settings` (`src/app/app.routes.ts:14-37`) use a separate English B2B model: `src/app/core/models/expense.model.ts` ("Cloud & Infrastructure", "Acme"), plus `budget.model.ts`, `analytics.model.ts` and `settings.model.ts`. Behind it sit services toggled by a settings flag (`expense.service.ts:31`, `budget.service.ts:22`) with their own localStorage keys (`costflow_*`).
  - No visible navigation leads to the legacy screens. `app.component.html` has only `<router-outlet>` and `<app-toast>`, and the sidebar, mobile tab bar and header are not rendered anywhere.
  - The live dashboard imports nothing from the legacy model.
- **No classification exists.**
  - "Occasional" exists only as folders (`TransactionFolder`, `Transaction.folderId`), and "want" only as the tags `Zachcianka` and `Zbędne`.
  - `spentAmount` sums **every** transaction (`budget-state.service.ts:257-260`). So folder and trip expenses drive `percentageUsed`, the gauge warning colours (`budget-hero-gauge.component.ts:129-141`, thresholds 75% and 100%) and `safeToSpendDaily` (`:274-283`). This violates the AGENTS.md non-negotiable rule and the PRD guardrail.
- **Static demo data.**
  - The trend chart plots hardcoded `MonthData.chartPoints` (`budget-trend-chart.component.ts:56-61`), and its "vs poprzedni miesiąc" line comes from the static fields `vsPreviousMonthPercent` and `vsPreviousMonthDirection`.
  - The "KATEGORIE" card (`budget-categories.component.ts`) renders `categoriesBreakdown`.
  - The month and "today" are fake: the seed is June/July 2025, `currentDay: 12`, and the current month index is hardcoded to 1.
- **Money is floating-point** everywhere. Nothing uses integer minor units, which the delivery plan requires (`context/changes/stabilize-and-supabase-mvp/change.md` Phase 4 step 4).
- **The add modal sends a UTC date.** It sets `isoDate: now.toISOString().substring(0, 10)` (`budget-add-modal.component.ts:194`), which is UTC, not the local date.
- **`budget-transactions.component.ts` bypasses the service.** `assignSingleTxFolder` (`:525-564`) writes the service's private `_months`/`persist` through bracket access.
- **Hidden demo components still read state.** They are hidden by `DEMO_FEATURES_ENABLED = false` (`src/app/core/config/demo-features.ts:7`) but must keep compiling:
  - `budget-ai-summary` reads `currentMonth().aiSummary`;
  - `budget-radar-waste` reads `wasteStats`;
  - `budget-subscriptions` reads `subscriptions` and `totalRecurringMonthly`;
  - `budget-bank-simulator` reads `activeBankNotification`;
  - `budget-scanner-modal` and `budget-voice-modal` call `addTransaction` with tags `Potrzebne`, `Spożywcze` and `Zachcianka`.
- **Tests.**
  - The unit suite is Vitest through `@angular/build:unit-test`, with 5 tests in 2 files.
  - The E2E suite is `e2e/budget-dashboard.spec.ts`: 4 tests × 2 projects (Desktop Chrome and Pixel 7). It relies on the seed, for example `52%` and the "Wycieczka Japonia" folder, and never clears storage. Each Playwright test gets a fresh context, so storage starts empty.

## Desired End State

- **One model, behind repositories, with a real clock.** The canonical domain model lives in `src/app/core/models/finance.model.ts`, with money as integer grosze (`amountMinor`) plus `currency: 'PLN'`. Every read and write goes through the abstract repositories `ExpenseRepository`, `MonthlyBudgetRepository` and `ExpenseFolderRepository`, with a localStorage implementation under one key. The app starts empty and uses the real date through `ClockService`.
- **Pure, unit-tested calculations.** Dashboard numbers come from pure functions in `src/app/core/domain/`:
  - Everyday and want expenses count toward the limit, the gauge and Safe-to-Spend.
  - Occasional expenses count only toward the total.
  - Assigning an everyday expense to a folder makes it occasional. A want stays a want, and removing an expense from a folder never changes its classification.
- **The user sees:**
  - a "Rodzaj wydatku" choice in the add form (default `Codzienny`);
  - a classification badge and selector in the transaction rows;
  - a "KLASYFIKACJA" card instead of "KATEGORIE";
  - a trend chart built from real expenses;
  - a caption under WYDANO ("+ X zł okazji poza limitem");
  - a local "Ustaw limit miesięczny" flow.
- **The legacy screens and model are deleted**, and their routes fall through to `/dashboard`.
- **The gates pass:** `npm run check` and Playwright on both projects. The E2E suite proves the US-01 rule with concrete numbers under a fixed Playwright clock.

### Key Discoveries:

- The seed must go: the user chose a real date with an empty start (decision 5 below). E2E tests therefore build their own data and freeze time with `page.clock.setFixedTime(...)`. Playwright is 1.62, so the clock API is available.
- `Haptics.impact()` from `@capacitor/haptics` rejects with `Browser does not support the vibrate API` in jsdom and in browsers without `navigator.vibrate`. This was verified with a probe spec on 2026-10-06.
- `vi.mock(...)` does **not** work under `@angular/build:unit-test`; a probe failed with a vitest hoisting error. Do not use module mocking. Use Angular DI overrides instead. That is why Phase 2 adds a `HapticsService` wrapper that swallows the rejection.
- `crypto.randomUUID()` is available in browsers, Capacitor WebView and Node 24/jsdom; use it for ids.
- `NotificationService` (`src/app/core/services/notification.service.ts`) exposes `success/error/warning/info(title, message?)` and is rendered by `<app-toast>`, so it stays.
- The shared `ModalComponent` is used only by `budgets.component.ts` (legacy). `HttpClient` is used only by the legacy `http-*` services.
- AGENTS.md and the Product Rules require Safe-to-Spend ("Bezpiecznie na dziś:") to stay visible without scrolling on Pixel 7, and forbid adding steps to expense entry.

## What We're NOT Doing

- No Supabase tables, repositories, auth or migrations. That is S-03, S-04 and S-05. The local repositories are the only implementation for now.
- No migration of old localStorage data (`budzetapp_v2_data`, `costflow_*`), per PRD §Constraints. The old keys are simply ignored and are not deleted.
- No seed or demo data, and no "reset to sample data".
- No edit form for title, amount or category of existing expenses (S-06). Only classification, tags, note and folder can be changed inline, as today plus classification.
- No per-category budgets, no category chart, and no date picker in the add form (an expense is always dated "now").
- No changes to the hidden demo features beyond what is needed to compile against the new model. `DEMO_FEATURES_ENABLED` stays `false`.
- No OnPush or zoneless change detection, and no new dependencies.
- No push to `master` without the user's explicit approval, because a push deploys production.

## Implementation Approach

1. **Phase 1:** delete the legacy surface first, so the codebase has one model before anything new is added. This phase has no visible change.
2. **Phase 2:** build the canonical model, pure domain functions, the clock and the local repositories as new, unit-tested code that nothing uses yet. This phase has no visible change.
3. **Phase 3:** switch `BudgetStateService` and the dashboard to it in one step, remove the seed, add the classification UI, and rewrite the E2E suite. These must land together: the old E2E suite depends on the seed, and every dashboard component reads the state service.
4. **Phase 4:** update the documentation and do the final visual and handoff checks.

## Critical Implementation Details

- **Environment.**
  - Node 24 is required. Prefix commands with `PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH" CI=1 NG_CLI_ANALYTICS=false`.
  - Start a production-configuration server for screenshots with `(setsid npx ng serve --port 4200 --configuration production > /tmp/serve.log 2>&1 &)` and stop it with `fuser -k 4200/tcp`. Never stop it with a `pkill` pattern that could match your own shell.
  - `npm run test:e2e` starts and reuses its own dev server on port 4200. Stop any server you started before running it.
- **Screenshot helpers.** If `/tmp/smoke/routes.mjs` exists (run it as `node routes.mjs <baseUrl> <label>`, from a copy placed in the repo root so `@playwright/test` resolves), it saves desktop and Pixel 7 screenshots of 5 routes plus the add and folder modals. After Phase 1, compare only the `dashboard`, `addmodal` and `foldermodal` shots, because the legacy routes now redirect. Otherwise write a short Playwright script; do not commit it.
- **Gates.** `npm run check` runs `format:check`, `lint`, `test --watch=false` and `build` in order. Fix findings in code; never add `eslint-disable` or relax `eslint.config.js` (AGENTS.md). Run `npm run format` after editing.
- **Local dates.** Never use `toISOString().substring(0, 10)` for a calendar date, because it is UTC. Build `YYYY-MM-DD` from `getFullYear()`, `getMonth()` and `getDate()`. Only `createdAt` uses `toISOString()`.
- **Money parsing.** Parse amounts to minor units from the decimal string, not by multiplying a float. For example, `"0.29"` must give `29`, not `28`. Accept both `,` and `.` as the decimal separator.
- **Code style.** All components stay standalone, use `ChangeDetectionStrategy.Eager` and Signals, and use Polish UI text, matching the neighbouring code.
- **Commits.** One commit per phase (`/10x-implement` ritual). Commit subjects follow the established Conventional Commits style, for example `refactor(canonical-expense-classification): Remove legacy expense screens (p1)`.

## Phase 1: Remove Legacy Screens and Second Model

### Overview

Delete the four unreachable English screens, their models and services, and the unused shared navigation components, so that only the dashboard model remains. The dashboard must look and behave exactly as before.

### Changes Required:

#### 1. Routes

**File**: `src/app/app.routes.ts`

**Intent**: Remove the `expenses`, `budgets`, `analytics` and `settings` routes. The existing `''` and `**` redirects then send those URLs to `/dashboard`.

**Contract**: Exactly three route entries remain: `''` redirecting to `dashboard`, `dashboard` lazy-loading `BudgetMainComponent`, and `**` redirecting to `dashboard`.

#### 2. Delete legacy features, shared components, models and services

**File**: delete each of these (git rm):
- `src/app/features/expenses/`, `src/app/features/budgets/`, `src/app/features/analytics/`, `src/app/features/settings/`, `src/app/features/dashboard/` (the unrouted old dashboard)
- `src/app/shared/components/sidebar/`, `mobile-tab-bar/`, `header/`, `stat-card/`, `expense-form-modal/`, `modal/`
- `src/app/core/models/expense.model.ts`, `budget.model.ts`, `analytics.model.ts`, `settings.model.ts`
- `src/app/core/repositories/expense.repository.ts`, `budget.repository.ts`
- `src/app/core/services/expense.service.ts`, `budget.service.ts`, `mock-expense.service.ts`, `mock-budget.service.ts`, `http-expense.service.ts`, `http-budget.service.ts`, `mock-data.seed.ts`, `settings.service.ts`, `theme.service.ts`

**Intent**: Leave a single source of truth. Keep `src/app/shared/components/toast/`, `notification.service.ts`, `budget-state.service.ts`, `src/app/core/config/*` and `src/app/core/supabase/*`.

**Contract**: After deletion, `rg -n "expense.model|budget.model|analytics.model|settings.model|ExpenseService|BudgetService|SettingsService|ThemeService|costflow_" src` finds nothing. If the build reports another importer of a deleted file, that file belongs to the legacy surface: delete it if it is unreferenced, otherwise stop and report.

#### 3. App config

**File**: `src/app/app.config.ts`

**Intent**: Remove `provideHttpClient(withFetch())` and its imports, because nothing uses `HttpClient` any more. Leave all other providers as they are.

**Contract**: The build passes and `rg -n "HttpClient" src` finds nothing.

### Success Criteria:

#### Automated Verification:

- `npm run check` passes
- `npm run test:e2e` passes on both projects (the suite is unchanged)
- `rg -n "expense.model|budget.model|analytics.model|settings.model|ExpenseService|BudgetService|SettingsService|ThemeService|costflow_|HttpClient" src` returns no matches

#### Manual Verification:

- Dashboard screenshots (desktop and Pixel 7, production configuration) are identical to production at https://portfel-bez-spiny.themantax.workers.dev, apart from the known chart-animation flake. Opening `/expenses` lands on the dashboard.

---

## Phase 2: Canonical Model, Domain Functions and Local Repositories

### Overview

Add the canonical types, money and period helpers, the pure budget calculations, a clock and the localStorage repositories, all covered by unit tests. Nothing in the UI uses them yet.

### Changes Required:

#### 1. Canonical model

**File**: `src/app/core/models/finance.model.ts` (new)

**Intent**: The single typed contract for budgets, expenses, classifications and folders. S-04 and S-05 will map it to Supabase tables (`monthly_budgets`, `expenses`, `expense_folders`).

**Contract**:

```ts
export type Period = string; // 'YYYY-MM'
export type IsoDate = string; // 'YYYY-MM-DD' (local calendar date)
export type CurrencyCode = 'PLN';

export const EXPENSE_CLASSIFICATIONS = ['everyday', 'want', 'occasional'] as const;
export type ExpenseClassification = (typeof EXPENSE_CLASSIFICATIONS)[number];

export const EXPENSE_CATEGORIES = ['Mieszkanie', 'Jedzenie', 'Transport', 'Zakupy', 'Zdrowie', 'Rozrywka', 'Media', 'Inne'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_TAGS = ['Cykliczne', 'Służbowe', 'Spożywcze'] as const;
export type ExpenseTag = (typeof EXPENSE_TAGS)[number];

export interface Expense {
  id: string;
  title: string;
  amountMinor: number; // integer grosze, > 0
  currency: CurrencyCode;
  classification: ExpenseClassification;
  category: ExpenseCategory;
  spentOn: IsoDate;
  createdAt: string; // ISO timestamp, source of the displayed time
  note?: string;
  tags: ExpenseTag[];
  folderId: string | null;
  receiptFileName?: string; // demo only
  aiComment?: string; // demo only
}
export type NewExpense = Omit<Expense, 'id'>;
export type ExpensePatch = Partial<Pick<Expense, 'title' | 'amountMinor' | 'classification' | 'category' | 'note' | 'tags' | 'folderId' | 'receiptFileName' | 'aiComment'>>;

export interface MonthlyBudget {
  id: string;
  effectiveFrom: Period; // limit applies from this month until a later record
  limitMinor: number; // integer grosze, > 0
  currency: CurrencyCode;
}

export interface ExpenseFolder {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
}
export type NewExpenseFolder = Omit<ExpenseFolder, 'id' | 'createdAt'>;
```

Folders are global, not per month: a trip can span months. The folder name is never copied onto an expense.

#### 2. Money helpers

**File**: `src/app/core/domain/money.ts` (new) + `money.spec.ts`

**Intent**: The only place where złoty and grosze are converted.

**Contract**:
- `parseAmountToMinor(input: string | number): number | null` accepts `"28.50"`, `"28,50"`, `"28"` and `28.5`. It rounds to 2 decimals half away from zero, using string arithmetic on the decimal string. It returns `null` for empty input, non-numeric input or more than one separator.
- `formatMinorAmount(minor: number): string` returns e.g. `"28,50"`, `"1234,00"` or `"-5,10"`: comma decimal separator, no thousands separator, matching today's list format.
- `formatWholeZloty(minor: number): string` returns `String(Math.round(minor / 100))`, e.g. `"600"`, matching today's hero format.

Tests cover `0.29 → 29`, `"19,99" → 1999`, `"1.005" → 101`, `"abc" → null`, `"" → null`, and both formatters including negative values.

#### 3. Period and date helpers

**File**: `src/app/core/domain/period.ts` (new) + `period.spec.ts`

**Intent**: Calendar logic for months and labels, all using **local** time.

**Contract**:
- `toIsoDate(date: Date): IsoDate`
- `periodOf(value: Date | IsoDate): Period`
- `shiftPeriod(period: Period, delta: number): Period`, which handles year boundaries
- `comparePeriods(a, b): number`
- `daysInPeriod(period): number`
- `periodLabel(period): string`, e.g. `'Październik 2026'`. Months: Styczeń, Luty, Marzec, Kwiecień, Maj, Czerwiec, Lipiec, Sierpień, Wrzesień, Październik, Listopad, Grudzień.
- `shortMonthName(period): string` returns sty, lut, mar, kwi, maj, cze, lip, sie, wrz, paź, lis or gru.
- `formatExpenseDateLabel(expense: Pick<Expense, 'spentOn' | 'createdAt'>, now: Date): string` returns `'Dziś, 14:32'` when `spentOn` is today, `'Wczoraj, 18:15'` when it is yesterday, and otherwise `'05 lip, 16:30'` (two-digit day + short month). The time comes from `createdAt` in local time.

Tests cover December→January, February in a leap year, and all three label forms.

#### 4. Budget calculations (the domain rule)

**File**: `src/app/core/domain/budget-summary.ts` (new) + `budget-summary.spec.ts`

**Intent**: One tested layer for every dashboard number (delivery plan Phase 7 step 5). Components and the state service never re-implement these rules.

**Contract**:
- `effectiveLimitMinor(budgets: MonthlyBudget[], period: Period): number | null` returns the `limitMinor` of the record with the greatest `effectiveFrom <= period`, or `null` if there is none.
- `summarizeMonth(input: { expenses: Expense[]; period: Period; limitMinor: number | null; today: Date }): MonthSummary` considers only expenses whose `periodOf(spentOn) === period`. It returns:
  - `totalMinor`, `everydayMinor`, `wantMinor` and `occasionalMinor`.
  - `inLimitMinor = everydayMinor + wantMinor`. **Occasional is never included.**
  - `limitMinor`.
  - `remainingMinor = limitMinor - inLimitMinor`, or `null` when there is no limit.
  - `percentUsed = Math.round(inLimitMinor * 100 / limitMinor)`, or `null` when there is no limit or the limit is ≤ 0.
  - `daysInMonth`.
  - `daysLeft`: when the period is the current month (from `today`), `daysInMonth - today.getDate() + 1`; for a past month, `1`; for a future month, `daysInMonth`.
  - `safeToSpendDailyMinor`: `null` when there is no limit, `0` when `remainingMinor <= 0`, otherwise `Math.round(remainingMinor / daysLeft / 100) * 100` (rounded to whole złoty).
- `classificationBreakdown(summary: MonthSummary): ClassificationShare[]` returns rows in the order everyday, want, occasional: `{ classification, amountMinor, percentOfTotal: Math.round(amount * 100 / total) or 0 when total is 0, countsTowardLimit: classification !== 'occasional' }`.
- `cumulativeSeries(expenses, period, today): { labels: string[]; inLimitMinor: number[]; occasionalMinor: number[] }` covers days `1..lastDay`, where `lastDay` is `today.getDate()` for the current month, `daysInMonth` for a past month and `0` for a future month. Labels look like `'1 paź'`. Values are cumulative sums per day.
- `compareWithPreviousMonth(expenses, period, today): { percent: number; direction: 'more' | 'less' } | null` compares the in-limit sum of `period` up to `lastDay` (same definition as above) with the previous month up to the same day number (clamped to its length). It returns `null` when the previous sum is 0. Otherwise `percent = Math.round(Math.abs(cur - prev) * 100 / prev)` and `direction = cur >= prev ? 'more' : 'less'`.
- `classificationAfterFolderAssign(current: ExpenseClassification, folderId: string | null): ExpenseClassification` returns `'occasional'` only when `folderId !== null && current === 'everyday'`. In every other case it returns `current`, including removal from a folder.

The tests must include the **US-01 case**:
- Setup: today = 2026-10-12, limit 310 000, everyday 50 000, want 10 000, occasional 400 000.
- Expected: `inLimitMinor` 60 000, `percentUsed` 19, `remainingMinor` 250 000, `daysLeft` 20, `safeToSpendDailyMinor` 12 500, `totalMinor` 460 000, breakdown percentages 11 / 2 / 87.

They must also cover: an expense in another month is ignored, no limit gives `null`s, an exceeded limit gives Safe-to-Spend 0, past and future months, and all four `classificationAfterFolderAssign` cases.

#### 5. Clock

**File**: `src/app/core/services/clock.service.ts` (new)

**Intent**: The single source of "now", so tests can control it.

**Contract**: `@Injectable({ providedIn: 'root' }) export class ClockService { now(): Date { return new Date(); } }`

#### 5b. Haptics wrapper

**File**: `src/app/core/services/haptics.service.ts` (new) + `haptics.service.spec.ts`

**Intent**: Haptic feedback is best effort. A missing vibrate API (desktop browsers, jsdom) must never break a user action or a test.

**Contract**: `@Injectable({ providedIn: 'root' }) export class HapticsService { async impact(style: 'light' | 'medium' | 'heavy'): Promise<void> }`. It maps the style to `ImpactStyle.Light`, `ImpactStyle.Medium` or `ImpactStyle.Heavy`, calls `Haptics.impact`, and catches and ignores any rejection. The spec checks that `impact('light')` resolves in jsdom.

#### 6. Repositories and local implementation

**File**: `src/app/core/repositories/expense.repository.ts`, `monthly-budget.repository.ts`, `expense-folder.repository.ts` (new abstract classes); `src/app/core/repositories/local/local-finance.store.ts`, `local-expense.repository.ts`, `local-monthly-budget.repository.ts`, `local-expense-folder.repository.ts` (new) + `local-repositories.spec.ts`

**Intent**: Persistence boundary (AGENTS.md: components never touch storage). The methods are Promise-based so the Supabase implementations in S-04/S-05 can use the same contract.

**Contract**:
- `ExpenseRepository`: `list(): Promise<Expense[]>`, `create(input: NewExpense): Promise<Expense>`, `update(id: string, patch: ExpensePatch): Promise<Expense>` (rejects with an `Error` when the id is unknown) and `delete(ids: readonly string[]): Promise<void>`.
- `MonthlyBudgetRepository`: `list(): Promise<MonthlyBudget[]>` and `setLimit(effectiveFrom: Period, limitMinor: number): Promise<MonthlyBudget>`. `setLimit` upserts: if a record for that exact `effectiveFrom` exists, it is replaced.
- `ExpenseFolderRepository`: `list(): Promise<ExpenseFolder[]>`, `create(input: NewExpenseFolder): Promise<ExpenseFolder>` and `delete(id: string): Promise<void>`. In the local implementation, deleting a folder also sets `folderId` to `null` on its expenses, mirroring the future `ON DELETE SET NULL`.
- `LocalFinanceStore` (`providedIn: 'root'`) reads and writes one key, `pbs_finance_v1`, holding `{ version: 1, expenses, budgets, folders }`. Invalid or missing JSON means an empty snapshot plus `console.warn`; it never throws. Every read returns copies, so callers cannot mutate stored state.
- Ids come from `crypto.randomUUID()`. `createdAt` for folders comes from `ClockService`. For expenses, the caller supplies it in `NewExpense`.
- Registration lives in `src/app/app.config.ts`: `{ provide: ExpenseRepository, useClass: LocalExpenseRepository }` and the equivalent for the other two.

Tests (with `localStorage.clear()` in `beforeEach`):
- a create → list round trip survives a new store instance (persistence);
- `update` of an unknown id rejects;
- deleting a folder detaches its expenses;
- `setLimit` replaces the record for the same month and keeps other months;
- corrupt JSON yields an empty list.

### Success Criteria:

#### Automated Verification:

- `npm run check` passes
- `npm test -- --watch=false --include src/app/core/domain/budget-summary.spec.ts` passes and includes the US-01 case
- Deliberate break: changing `inLimitMinor` to include occasional expenses makes `budget-summary.spec.ts` fail (then reverted)
- `npm run test:e2e` passes on both projects (UI unchanged)

#### Manual Verification:

- `finance.model.ts` contains the whole contract for budgets, expenses, classifications and folders, and nothing else in `src/` defines a second expense type besides the old `budget-app.model.ts`, which is removed in Phase 3

---

## Phase 3: Dashboard on the Canonical Model

### Overview

Rewrite `BudgetStateService` on top of the repositories, the clock and the domain functions. Remove the seed and `budget-app.model.ts`, add the classification UI and the local limit flow, make the charts real, and rewrite the E2E suite. This is the first phase with visible changes.

### Changes Required:

#### 1. State service

**File**: `src/app/core/services/budget-state.service.ts` + `budget-state.service.spec.ts` (new)

**Intent**: Keep the service as the single facade the dashboard components use, now backed by repositories, without localStorage access or seed data.

**Contract**:
- **Remove:** `INITIAL_MONTHS`, `STORAGE_KEY`, `loadFromStorage`, `persist`, `_months`, `_currentMonthIndex`, `categoriesBreakdown` and every use of `MonthData`, `Transaction` and `TransactionTag`.
- **Injects:** `ExpenseRepository`, `MonthlyBudgetRepository`, `ExpenseFolderRepository`, `ClockService` and `NotificationService`. The constructor starts `void this.reload()`, which loads all three lists into private signals `expenses`, `budgets` and `folders` and sets `loaded` to `true`.
- **Period navigation:**
  - `currentPeriod` signal, initialised to `periodOf(clock.now())`.
  - `previousMonth()` always goes back.
  - `nextMonth()` goes forward only while `currentPeriod < periodOf(clock.now())`; `canGoNext` is a computed signal for that.
  - Both reset `selectedFolderId`.
  - `currentMonthLabel = periodLabel(currentPeriod)`.
- **Computed state:**
  - `limitMinor = effectiveLimitMinor(budgets, currentPeriod)`.
  - `summary = summarizeMonth(...)`, `breakdown`, `trend = cumulativeSeries(...)` and `vsPreviousMonth = compareWithPreviousMonth(...)`.
  - The `today` argument is always `clock.now()`.
- **Hero signals.** These keep their old names so templates change little; all are whole złoty or `null`:
  - `percentageUsed` (`number | null`);
  - `safeToSpendDaily`;
  - `spentAmount`, which is **in-limit** spending;
  - `limitAmount`;
  - `remainingAmount`;
  - `occasionalAmount`.
- **List signals:**
  - `ExpenseView = Expense & { folder: ExpenseFolder | null; dateLabel: string; amountLabel: string; isExpanded: boolean }`.
  - `monthExpenses` holds the current period's views, sorted by `spentOn` and then `createdAt`, newest first.
  - `filteredTransactions` filters `monthExpenses` by `selectedFolderId`. `visibleTransactions` keeps the first-5 rule unchanged.
  - `activeFolder` is the folder matching `selectedFolderId`, or `null`. `activeFolderTotal` is the minor-unit sum of `filteredTransactions`.
  - `folders` lists all folders.
  - `expandedIds` is a UI-only `signal<string[]>`, never persisted.
- **Mutations.** Each awaits the repository, then updates the local signal from the returned value. On rejection it calls `notification.error('Nie udało się zapisać zmian', err.message)` and `await reload()`. The existing haptic calls stay, but go through `HapticsService` (same strengths). Every direct `Haptics` import in `src/app/features/budget-app/` and in the state service is replaced by `HapticsService`.
  - `addExpense(input: { title; amountMinor; category; classification; note?; tags; receiptFileName?; aiComment? })`:
    - sets `spentOn = toIsoDate(now)`, `createdAt = now.toISOString()`, `currency: 'PLN'` and `folderId: null`;
    - sets `currentPeriod` to the current month so the new expense is visible;
    - closes the add modal.
  - `setClassification(id, classification)`, `toggleTransactionTag(id, tag: ExpenseTag)` and `updateTransactionNote(id, note)`.
  - `assignToFolder(ids: string[], folderId: string | null)`. Each expense gets `{ folderId, classification: classificationAfterFolderAssign(current, folderId) }`. Afterwards it clears the selection.
  - `createFolder(name, emoji, color, assignIds)`: creates the folder, then `assignToFolder(assignIds, id)` when the list is non-empty, then selects the new folder and closes the modal.
  - `deleteFolder(id)`: reloads expenses afterwards and clears the selection if that folder was selected.
  - `deleteTransaction(id)` and `bulkDeleteSelected()`.
  - `toggleTransactionExpand(id)`, which is UI-only. In selection mode it keeps toggling selection instead.
  - `setMonthlyLimit(limitMinor)` writes `effectiveFrom = currentPeriod` and closes the limit modal.
  - `attachReceiptAndGenerateAi(id, fileName)` (demo).
- **Modal flags.** The existing flags are kept, and `isLimitModalOpen` is added.
- **Demo support** (keep compiling; still hidden):
  - `wasteStats` uses `classification === 'want'` in the current period, with amounts in whole złoty for the radar template.
  - `subscriptions` and `totalRecurringMonthly` use the `Cykliczne` tag in the current period.
  - `BankPushNotification` gets `suggestedClassification` and `suggestedTags: ExpenseTag[]`. `acceptBankNotification` calls `addExpense`.

The unit tests use `TestBed` with the local repositories (and `localStorage.clear()`), a fake `ClockService` (`{ provide: ClockService, useValue: { now: () => new Date(2026, 9, 12, 10, 0) } }`), and the real `HapticsService` (it swallows the jsdom rejection). There is no `vi.mock`. The service loads asynchronously, so await `service.reload()` (make it public) before asserting. They cover:
- adding an expense while viewing a previous month jumps back to the current month;
- assigning an everyday expense to a folder makes it occasional, and the hero `spentAmount` drops accordingly;
- a want stays a want when assigned;
- removing it from the folder keeps it occasional;
- `setMonthlyLimit` in October leaves September without a limit;
- `nextMonth` does not go past the current month.

#### 2. UI metadata and model cleanup

**File**: `src/app/core/models/budget-app.model.ts` (delete); `src/app/features/budget-app/budget-ui.meta.ts` (new); `src/app/core/models/demo.model.ts` (new)

**Intent**: Domain types live only in `finance.model.ts`. Presentation constants and demo-only types live apart from it.

**Contract**:
- `budget-ui.meta.ts` exports:
  - `CLASSIFICATION_META: Record<ExpenseClassification, { label: string; pluralLabel: string; color: string; badgeClass: string; activeClass: string }>` with these values:
    - everyday: `Codzienny` / `Codzienne`, `#34d399`, emerald classes like today's `Potrzebne`;
    - want: `Zachcianka` / `Zachcianki`, `#fbbf24`, amber classes like today's `Zachcianka`;
    - occasional: `Okazjonalny` / `Okazjonalne`, `#a78bfa`, violet classes (`bg-violet-950/80 text-violet-300 border-violet-500/50`).
  - `TAG_META` holds the active and badge classes for the 3 remaining tags, keeping today's colours: Cykliczne blue, Służbowe indigo, Spożywcze teal.
  - `CATEGORY_EMOJI` holds today's emoji map from `budget-transactions.component.ts:430-449`.
- `demo.model.ts` exports `BankPushNotification`, `SubscriptionItem` and `AiSummary`.

#### 3. Hero gauge and limit modal

**File**: `src/app/features/budget-app/budget-hero-gauge.component.ts`; `src/app/features/budget-app/budget-limit-modal.component.ts` (new); `budget-main.component.ts` (render the new modal next to the add modal)

**Intent**: The hero shows only in-limit spending, explains occasional spending in one line, and lets the user set the limit locally.

**Contract**:
- The gauge colour and arc keep using `percentageUsed`, with the same thresholds. When the limit is `null`:
  - the arc is empty and the gauge colour is the green one;
  - the centre shows `—` instead of `N%`, with the subtitle "wykorzystano budżetu" unchanged;
  - the pill shows `Bezpiecznie na dziś: — do końca miesiąca`.
- Otherwise the pill shows `{{safeToSpendDaily}} zł/dzień`. Add `data-testid="safe-to-spend"` on the pill's `<strong>`.
- WYDANO shows `{{spentAmount}} zł` (`data-testid="hero-spent"`). Below it, only when `occasionalAmount > 0`, a caption reads `+ {{occasionalAmount}} zł okazji poza limitem`. It uses `text-[10px] text-violet-300`, has `data-testid="hero-occasional"` and must not push the pill below the Pixel 7 fold.
- LIMIT is a `<button type="button">` that opens the limit modal:
  - with a limit, the text is `{{limitAmount}} zł`, with `aria-label="Zmień limit miesięczny"` and `data-testid="hero-limit"`;
  - without a limit, the text is `Ustaw limit miesięczny`.
- POZOSTAŁO shows `{{remainingAmount}} zł`, or `—` without a limit (`data-testid="hero-remaining"`). It keeps the emerald/rose rule.
- The limit modal follows the add modal's markup and styles:
  - `role="dialog"`, `aria-modal="true"` and `aria-labelledby` pointing at the title `Miesięczny limit`;
  - an amount input with `id="budget-limit-amount"`, label `Limit (zł) *`, `placeholder="np. 4000"`, `type="number"`, step 0.01, `min=1`, and the current limit prefilled when one exists;
  - the helper text `Obowiązuje od {{currentMonthLabel}} do kolejnej zmiany.`;
  - the buttons `Anuluj` and `Zapisz limit` (submit, disabled while the form is invalid);
  - the ✕ button gets `aria-label="Zamknij"`.
- On submit the limit modal calls `state.setMonthlyLimit(parseAmountToMinor(value))`.

#### 4. Classification card

**File**: `src/app/features/budget-app/budget-classification.component.ts` (new, selector `app-budget-classification`); delete `budget-categories.component.ts`; `budget-main.component.ts` (swap the card in the same grid cell)

**Intent**: Replace categories with the three classifications and highlight wants and occasions.

**Contract**:
- The header is `KLASYFIKACJA`, styled like the old `KATEGORIE` card.
- One row per `state.breakdown()` item (`data-testid="classification-{classification}"`), showing:
  - the `pluralLabel`;
  - the amount as `formatWholeZloty(amountMinor) + ' zł'`;
  - `percentOfTotal + '%'`;
  - a bar coloured by `CLASSIFICATION_META.color`.
- The occasional row also shows a small badge `poza limitem` in violet.
- The footer reads `Razem: {{total}} zł` (`data-testid="classification-total"`).
- When the month total is 0, the rows are replaced by `Brak wydatków w tym miesiącu`.

#### 5. Trend chart

**File**: `src/app/features/budget-app/budget-trend-chart.component.ts`

**Intent**: Plot real cumulative spending and keep in-limit and occasional spending visibly separate.

**Contract**:
- The header is `WYDATKI — {{currentMonthLabel first word, upper-case}}`.
- The comparison line renders only when `vsPreviousMonth()` is not null, as `{{percent}}% więcej|mniej vs poprzedni miesiąc`. It is rose for `more` and emerald for `less`.
- The `effect` re-renders when `trend()` changes. Values are converted from minor units to złoty.
- There are two datasets:
  - `W limicie`, keeping today's green fill style;
  - `Okazje`, `#a78bfa`, dashed (`borderDash: [4, 4]`), no fill.
- The legend is displayed at the bottom with small labels. The tooltip shows `{{label}}: {{value}} zł`. The y-axis "k" formatting stays.
- An empty month renders an empty chart without errors.

#### 6. Add modal

**File**: `src/app/features/budget-app/budget-add-modal.component.ts`

**Intent**: Classification is chosen in the same single step, with `Codzienny` preselected (no extra tap). Tags become optional extras.

**Contract**:
- Keep the title, amount, category and note fields with their ids, labels and placeholders unchanged, because E2E selects by placeholder.
- Add a `classification` form control, default `'everyday'`, rendered above the tags as a `role="group"` labelled by a `<span id="budget-add-classification-label" class="block leading-[normal] ...">Rodzaj wydatku</span>`.
  - It has three `type="button"` buttons labelled `Codzienny`, `Zachcianka` and `Okazjonalny`, with `[attr.aria-pressed]`.
  - The active button uses `CLASSIFICATION_META.activeClass` with a `✓`, mirroring the tag buttons.
- The tag group label changes to `Tagi (opcjonalnie)`. It lists the 3 remaining tags, and `selectedTags` defaults to `[]`.
- On submit it calls `state.addExpense({ title, amountMinor: parseAmountToMinor(amount)!, category, classification, note: note || undefined, tags: selectedTags })`, then resets to `{ category: 'Jedzenie', classification: 'everyday' }` and `[]` tags. The form must not compute dates itself.
- The ✕ button gets `aria-label="Zamknij"`.

#### 7. Transactions list and folders

**File**: `src/app/features/budget-app/budget-transactions.component.ts`, `budget-folders-bar.component.ts`, `budget-create-folder-modal.component.ts`

**Intent**: Show and edit the classification, route every write through the state service, and handle the empty state.

**Contract**:
- Rows iterate over `ExpenseView`:
  - the amount reads `-{{amountLabel}} zł` and the subline `{{category}} • {{dateLabel}}`;
  - a classification badge (`CLASSIFICATION_META.label` and `badgeClass`, `data-testid="tx-classification"`) comes first in the badge row, before the folder badge (`📁 {{folder.name}}`) and the tag badges.
- The expanded drawer gets a `Rodzaj wydatku` group with the same three buttons, calling `state.setClassification`. It is placed above the tag pills. The tag pills use `EXPENSE_TAGS`.
- `assignSingleTxFolder` is replaced by `state.assignToFolder([tx.id], folderId || null)`; no bracket access to private members remains. Bulk "Folderuj" and the swipe "Folder" action keep their current behaviour and go through `assignToFolder` / `createFolder`.
- When `filteredTransactions()` is empty and no folder is selected, the list shows `Brak wydatków w tym miesiącu. Dodaj pierwszy przyciskiem „Dodaj wydatek”.`
- The folders bar and the create-folder modal switch to `ExpenseFolder`, keeping their texts. `activeFolderTotal` is displayed with `formatMinorAmount`.

#### 8. Hidden demo components and main layout

**File**: `budget-main.component.ts`, `budget-ai-summary.component.ts`, `budget-radar-waste.component.ts`, `budget-subscriptions.component.ts`, `budget-bank-simulator.component.ts`, `budget-scanner-modal.component.ts`, `budget-voice-modal.component.ts` (all in `src/app/features/budget-app/`)

**Intent**: Compile against the new model without changing what is visible. All of these are behind `DEMO_FEATURES_ENABLED`, except the month navigator in `budget-main`.

**Contract**:
- `budget-main` uses `currentMonthLabel` and disables the next button when `!canGoNext()`.
- `budget-ai-summary` uses a local `DEMO_AI_SUMMARY: AiSummary` constant holding the July 2025 texts from the deleted seed.
- The radar and subscriptions components format amounts with `formatMinorAmount` / `formatWholeZloty`.
- The scanner and voice modals call `addExpense`:
  - amounts go through `parseAmountToMinor`;
  - classification is `'want'` where the old code used `Zachcianka` and `'everyday'` otherwise;
  - tags keep only `Spożywcze` where the old code had it.

#### 9. E2E suite

**File**: `e2e/budget-dashboard.spec.ts` (rewrite)

**Intent**: Prove the empty start, the add flow, the MVP surface and the US-01 rule on both projects, deterministically.

**Contract**:
- `beforeEach`: `await page.clock.setFixedTime(new Date('2026-10-12T10:00:00'))`, then `await page.goto('/')`.
- Local helpers:
  - `setLimit(page, '3100')` clicks the LIMIT button (`Ustaw limit miesięczny` or `Zmień limit miesięczny`), fills `#budget-limit-amount` and clicks `Zapisz limit`.
  - `addExpense(page, title, amount, classification?)` clicks the first visible `Dodaj wydatek` button, fills the title and amount placeholders, clicks the classification button inside the dialog `Dodaj nowy wydatek` when given, and submits.

Locator rules:
- Playwright `getByText('…')` matches case-insensitive substrings, so `LIMIT` would also match `Ustaw limit miesięczny`. Use `{ exact: true }` for the KPI labels `WYDANO`, `LIMIT` and `POZOSTAŁO`.
- Scope row assertions to the row: `page.locator('ion-item-sliding', { hasText: '<title>' })`. Read the classification from its `[data-testid=tx-classification]` badge, because the expanded drawer also contains `Codzienny`/`Zachcianka`/`Okazjonalny` buttons.
- Assert hero and card values with `toHaveText` / `toContainText` on the `data-testid` elements.

Tests (titles stay numbered, no `test.only`):
1. **Empty start.** `Budżet`, `wykorzystano budżetu`, `WYDANO`, `LIMIT` and `POZOSTAŁO` (exact) are visible. A button `Ustaw limit miesięczny` is visible. `[data-testid=safe-to-spend]` has the text `—`. `Brak wydatków w tym miesiącu` is visible.
2. **Add flow** (as today, after `setLimit(page, '3100')`): fill title `Kawiarnia Costa`, amount `28.50` and note `Kawa i ciastko`. Then `Kawiarnia Costa` and a `Codzienny` badge in its row are visible, and `-28,50 zł` is visible.
3. **MVP surface:** unchanged assertions. `Bezpiecznie na dziś:` is in the viewport.
4. **US-01 rule.**
   - Steps: `setLimit 3100`; add `Zakupy tygodniowe` 500 (everyday), `Kino` 100 (`Zachcianka`) and `Bilety lotnicze` 4000 (`Okazjonalny`).
   - Hero: `hero-spent` = `600 zł`, `hero-occasional` = `+ 4000 zł okazji poza limitem`, `hero-remaining` = `2500 zł`, `safe-to-spend` = `125 zł/dzień`, and the text `19%` is visible.
   - Card: `classification-everyday` contains `500 zł` and `11%`; `classification-want` contains `100 zł` and `2%`; `classification-occasional` contains `4000 zł`, `87%` and `poza limitem`; `classification-total` = `Razem: 4600 zł`.
   - `Bezpiecznie na dziś:` is in the viewport.
5. **Folder makes it occasional.**
   - Steps: `setLimit 3100`; add `Hotel Kioto` 900 (everyday) → `hero-spent` = `900 zł`. Create the folder `Wycieczka Japonia` (`Nowy folder`, name input, submit), expand the `Hotel Kioto` row, and pick `Wycieczka Japonia` in its folder select.
   - Expected: the row shows `Okazjonalny`, `hero-spent` = `0 zł` and `hero-occasional` contains `900`. Clicking the folder chip shows `Suma w folderze:`.
   - Then pick `Brak folderu`: the row still shows `Okazjonalny`.
6. **Persistence:** after `setLimit` and one added expense, `page.reload()` keeps the expense and the limit.
7. **Limit applies forward:** after `setLimit 3100` in October, `Poprzedni miesiąc` shows `Wrzesień 2026` with the `Ustaw limit miesięczny` button, and `Następny miesiąc` returns to `Październik 2026`.

### Success Criteria:

#### Automated Verification:

- `npm run check` passes
- `npm run test:e2e` passes on both projects (7 tests × 2)
- `rg -n "localStorage" src/app --glob '!**/local/**' --glob '!**/*.spec.ts'` returns no matches (only the local repository store touches storage)
- `rg -n "budget-app.model|MonthData|chartPoints|categoriesBreakdown|\\['_|budzetapp_v2_data|toISOString\\(\\)\\.substring" src` returns no matches
- `rg -n "@capacitor/haptics" src/app --glob '!**/haptics.service.ts'` returns no matches
- Deliberate break: changing `classificationAfterFolderAssign` to always return `current` makes the state-service spec and E2E test 5 fail (then reverted)

#### Manual Verification:

- Desktop and Pixel 7 screenshots (production configuration) of the empty state, the US-01 state (data from E2E test 4) and an open add modal. They look consistent with the existing dark style; nothing overlaps; `Bezpiecznie na dziś:` is visible without scrolling on Pixel 7 in both states; the `KLASYFIKACJA` card and the chart's `Okazje` line are clearly distinguishable
- The add flow still takes one modal and one submit, with `Codzienny` preselected

---

## Phase 4: Documentation and Handoff

### Overview

Bring the agent and user docs in line with the new single model, and run the final checks.

### Changes Required:

#### 1. AGENTS.md

**File**: `AGENTS.md`

**Intent**: The line that calls `budget-app.model.ts` and `budget-state.service.ts` "prototype references until the canonical consumer-finance contract is selected" is now false.

**Contract**: Replace it with: the canonical model is `src/app/core/models/finance.model.ts` (money in integer grosze); persistence goes through the abstract repositories in `src/app/core/repositories/` (local implementations in `local/`, Supabase later); dashboard rules live in `src/app/core/domain/` with unit tests; and `BudgetStateService` is the UI facade. Keep every other line unchanged.

#### 2. README

**File**: `README.md`

**Intent**: The "Status projektu" section should say that the app runs on local data through repositories and starts empty, that the user sets a monthly limit and classifies expenses as codzienny/zachcianka/okazjonalny, and that occasional expenses do not count toward the limit or Safe-to-Spend.

**Contract**: Polish, two to four sentences, with no other section changed.

### Success Criteria:

#### Automated Verification:

- `npm run check` passes
- `npm run test:e2e` passes on both projects
- `rg -n "prototype references" AGENTS.md` returns no matches

#### Manual Verification:

- AGENTS.md and README describe the code as it now is (model, repositories and domain paths exist)
- After the user approves a push to `master`, Cloudflare Workers Builds succeeds and production shows the empty-start dashboard

---

## Testing Strategy

### Unit Tests:

- `money.spec.ts`, `period.spec.ts` and `budget-summary.spec.ts`: pure functions, including the US-01 numbers, the folder rule, past/future months and rounding.
- `local-repositories.spec.ts`: persistence round trip, folder delete detaching expenses, budget upsert, corrupt JSON.
- `budget-state.service.spec.ts`: wiring of clock, repositories and rules (folder assign/unassign, add jumps to current month, limit applies forward, next-month bound).

### Integration Tests:

- `e2e/budget-dashboard.spec.ts`: 7 scenarios × Desktop Chrome and Pixel 7 under a fixed clock (2026-10-12 10:00 local), covering empty start, the add flow, the MVP surface, US-01, the folder rule, persistence and forward limit.

### Manual Testing Steps:

1. Open the dashboard with empty storage: `—` values, `Ustaw limit miesięczny`, empty list and empty card.
2. Set the limit to 3100. Add 500 everyday, 100 want and 4000 occasional, and check 19%, 125 zł/dzień, the occasion caption and the card values.
3. Create a folder and move an everyday expense into it: it becomes Okazjonalny and leaves WYDANO. Remove it from the folder: it stays Okazjonalny.
4. Reload: the data persists. Go to the previous month: no limit there.

## Performance Considerations

All data is local and small. Repositories load everything once at startup; the computed signals recalculate from in-memory arrays. No measurable change is expected.

## Migration Notes

There is no data migration (PRD §Constraints). Existing users of the demo see an empty dashboard, because the old keys `budzetapp_v2_data` and `costflow_*` are ignored and left in storage. Rollback is a git revert of the four phase commits.

## References

- Roadmap item: `context/foundation/roadmap.md` §S-02
- PRD: `context/foundation/prd.md` (US-01, FR-005, FR-006, Business Logic Changes, Approved Implementation Decisions)
- Delivery plan: `context/changes/stabilize-and-supabase-mvp/change.md` Phase 4 and Phase 7 step 4–5
- Domain rule origin: `context/foundation/shape-notes.md:38`
- Previous slice (hidden demo features): `context/archive/2026-10-05-mvp-focused-dashboard/plan.md`
- Quality gates: `context/archive/2026-10-06-lint-and-format-checks/plan.md`

## Progress

### Phase 1: Remove Legacy Screens and Second Model

#### Automated

- [x] 1.1 `npm run check` passes — 21534c2
- [x] 1.2 `npm run test:e2e` passes on both projects (the suite is unchanged) — 21534c2
- [x] 1.3 `rg` for legacy model, service, storage-key and HttpClient references in `src` returns no matches — 21534c2

#### Manual

- [x] 1.4 Dashboard screenshots are identical to production apart from the known chart flake; `/expenses` lands on the dashboard — 21534c2

### Phase 2: Canonical Model, Domain Functions and Local Repositories

#### Automated

- [x] 2.1 `npm run check` passes
- [x] 2.2 `budget-summary.spec.ts` passes and includes the US-01 case
- [x] 2.3 Deliberate break: including occasional in `inLimitMinor` makes `budget-summary.spec.ts` fail (then reverted)
- [x] 2.4 `npm run test:e2e` passes on both projects (UI unchanged)

#### Manual

- [x] 2.5 `finance.model.ts` holds the whole contract; no second expense type exists besides `budget-app.model.ts` (removed in Phase 3)

### Phase 3: Dashboard on the Canonical Model

#### Automated

- [ ] 3.1 `npm run check` passes
- [ ] 3.2 `npm run test:e2e` passes on both projects (7 tests × 2)
- [ ] 3.3 Only the local repository store touches `localStorage` in `src/app` (spec files excluded)
- [ ] 3.4 No references to `budget-app.model`, `MonthData`, `chartPoints`, `categoriesBreakdown`, private bracket access, `budzetapp_v2_data` or UTC date slicing remain in `src`
- [ ] 3.5 `@capacitor/haptics` is imported only by `haptics.service.ts`
- [ ] 3.6 Deliberate break: `classificationAfterFolderAssign` always returning `current` makes the state-service spec and E2E test 5 fail (then reverted)

#### Manual

- [ ] 3.7 Desktop and Pixel 7 screenshots of the empty state, the US-01 state and the add modal look consistent; Safe-to-Spend is above the Pixel 7 fold in both states
- [ ] 3.8 The add flow still takes one modal and one submit, with `Codzienny` preselected

### Phase 4: Documentation and Handoff

#### Automated

- [ ] 4.1 `npm run check` passes
- [ ] 4.2 `npm run test:e2e` passes on both projects
- [ ] 4.3 `rg -n "prototype references" AGENTS.md` returns no matches

#### Manual

- [ ] 4.4 AGENTS.md and README describe the code as it now is
- [ ] 4.5 After the user approves a push to `master`, Cloudflare Workers Builds succeeds and production shows the empty-start dashboard
