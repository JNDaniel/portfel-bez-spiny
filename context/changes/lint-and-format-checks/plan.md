# Lint and Format Checks Implementation Plan

## Overview

Add Prettier and Angular ESLint as deterministic, local quality gates, bring the existing code to a green state with minimal fixes, and add one `npm run check` command that agents and the user run before every handoff. This is roadmap F-02; it unlocks the verification path for S-02–S-09 and is a prerequisite of S-08.

## Current State Analysis

- No linter or formatter is configured (`context/foundation/health-check.md:99-100`, Recommended Fixes 4 and 5). Formatting relies on `.editorconfig` only (2 spaces, final newline, single quotes for `.ts`), and the code mixes single and double quotes (44 of 54 `.ts` files contain double quotes).
- Angular 22.2.1, TypeScript 6.0.3, Vitest unit tests, Playwright E2E, Node 24 (F-01, archived `context/archive/2026-10-05-angular-security-upgrade/`).
- `angular.json` has no `lint` target; `package.json` has no `lint`/`format` scripts. AGENTS.md says "No repository CI workflow or lint script is configured."
- Trial run in a throwaway clone (2026-10-06):
  - `ng add angular-eslint@22` (22.5.0, ESLint 10, typescript-eslint 8) generates `eslint.config.js` with `recommended`, `stylistic`, `tsRecommended`, `templateRecommended` and `templateAccessibility`, an `@angular-eslint/builder:lint` target and an `npm run lint` script.
  - That config reports 108 errors in 29 files: `prefer-on-push-component-change-detection` 27, `template/label-has-associated-control` 30, `no-explicit-any` 20, `no-unused-vars` 14, `no-inferrable-types` 5, `template/click-events-have-key-events` 4, `template/interactive-supports-focus` 4, `no-output-native` 2, `no-empty-function` 1, `no-useless-escape` 1.
  - Prettier 3 with Angular's default settings (`singleQuote`, `printWidth: 100`, Angular parser for HTML) reformats 52 files (+2701/−1615 lines).

## Desired End State

`npm run format:check` and `npm run lint` pass with zero errors on the whole tree they cover, `npm run check` runs format check, lint, unit tests and build in one command, and AGENTS.md/README tell agents to run it before handoff. The app looks and behaves exactly as before: the regression smoke against the production deployment shows no differences.

### Key Discoveries:

- `prefer-on-push-component-change-detection` conflicts with the F-01 decision to keep `ChangeDetectionStrategy.Eager` and Zone.js on every component (`src/app/app.config.ts:10`); moving to OnPush is a separate, behaviour-changing migration.
- `no-output-native` hits `readonly close = output<void>()` in `src/app/shared/components/modal/modal.component.ts:55` and `src/app/shared/components/expense-form-modal/expense-form-modal.component.ts:186`; bound as `(close)` in `budgets.component.ts:170`, `expenses.component.ts:307`, `dashboard.component.ts:279` and `expense-form-modal.component.ts:18`.
- Accessibility findings sit in form labels and modal backdrops of `budget-add-modal`, `budget-create-folder-modal`, `budgets`, `expenses`, `settings`, `expense-form-modal`, `budget-scanner-modal`, `budget-transactions` and `modal`.
- Templates are whitespace-sensitive; Prettier's default `htmlWhitespaceSensitivity: "css"` keeps inline whitespace semantics, and the existing regression smoke (`/tmp/smoke/smoke.mjs`, pixel-exact screenshots) detects any visual drift.

## What We're NOT Doing

- No OnPush or zoneless migration; `prefer-on-push-component-change-detection` is turned off with a comment pointing at that decision.
- No pre-commit hooks (husky, lint-staged) and no CI workflow; CI stays Parked in the roadmap.
- No reformatting of Markdown under `context/` or `docs/`, of `android/`, `dist/`, `package-lock.json` or generated runtime config.
- No `eslint-disable` comments and no rule downgraded to `warn` to hide findings; every remaining finding is fixed in code.
- No behaviour or visual changes beyond what the fixes require (label associations and keyboard handlers on existing elements).
- No Stylelint or Tailwind class sorting plugin.

## Implementation Approach

Formatter first, linter second, so the large mechanical diff is isolated in its own commit, and lint fixes are then reviewed against already-formatted code. `eslint-config-prettier` keeps ESLint from fighting the formatter. The format commit's SHA goes into `.git-blame-ignore-revs` in the last phase, once it is known. Every phase is verified with build, unit tests, Playwright and the pixel-exact regression smoke against the production deployment.

## Phase 1: Prettier and One-Shot Formatting

### Overview

Add Prettier with Angular defaults, format the covered tree in one mechanical pass, and prove the app is unchanged.

### Changes Required:

#### 1. Formatter configuration

**File**: `package.json`, `package-lock.json`, `.prettierrc.json`, `.prettierignore`

**Intent**: Pin Prettier 3 as a devDependency with the settings Angular uses for new projects, and add `format` and `format:check` scripts.

**Contract**: `.prettierrc.json` sets `singleQuote: true`, `printWidth: 100` and an `*.html` override with `parser: "angular"`; it agrees with `.editorconfig` (2 spaces, final newline). `.prettierignore` excludes `android/`, `dist/`, `node_modules/`, `.angular/`, `coverage/`, `playwright-report/`, `test-results/`, `package-lock.json`, `context/`, `docs/`, `*.md` and generated runtime config. Scripts: `format` = `prettier --write .`, `format:check` = `prettier --check .`.

#### 2. One-shot formatting

**File**: files Prettier covers under `src/`, `e2e/`, `scripts/` and root config files

**Intent**: Run `npm run format` once and commit nothing else with it, so the commit can later be ignored by `git blame`.

**Contract**: The phase commit contains only the config files above and formatter output; no hand edits to formatted files.

### Success Criteria:

#### Automated Verification:

- `npm run format:check` passes
- `npm run build` passes, including the post-build secret scan
- `npm test -- --watch=false` passes (5 of 5)
- `npm run test:e2e` passes on both projects

#### Manual Verification:

- Regression smoke (production configuration) shows no differences and identical screenshots against the current production deployment

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Angular ESLint and Minimal Fixes

### Overview

Add Angular ESLint through its schematic, adjust the generated config to the project's decisions, and fix every finding in code.

### Changes Required:

#### 1. Linter configuration

**File**: `package.json`, `package-lock.json`, `angular.json`, `eslint.config.js`

**Intent**: Install `angular-eslint@22` with `ng add` (ESLint, typescript-eslint, `@eslint/js`), add `eslint-config-prettier` last so formatting rules never conflict, and turn off the OnPush rule with a comment explaining the deliberate Eager/Zone.js decision.

**Contract**: `angular.json` has a `lint` target with `@angular-eslint/builder:lint` covering `src/**/*.ts`, `src/**/*.html` and `e2e/**/*.ts`; `npm run lint` = `ng lint`. The generated rule sets stay as errors; the only override is `@angular-eslint/prefer-on-push-component-change-detection: "off"`. `eslint.config.js` is formatted by Prettier.

#### 2. TypeScript findings

**File**: the `.ts` files listed in the trial run (services under `src/app/core/services/`, components under `src/app/features/` and `src/app/shared/`)

**Intent**: Remove unused imports and variables, drop inferrable type annotations, remove the empty constructor and the useless escape, and replace `any` with the real type or `unknown` plus narrowing.

**Contract**: No `eslint-disable` comments, no behaviour change; types come from existing models in `src/app/core/models/` where they exist.

#### 3. Output naming

**File**: `src/app/shared/components/modal/modal.component.ts`, `src/app/shared/components/expense-form-modal/expense-form-modal.component.ts`, `src/app/features/budgets/budgets.component.ts`, `src/app/features/expenses/expenses.component.ts`, `src/app/features/dashboard/dashboard.component.ts`

**Intent**: Rename the `close` outputs so they no longer shadow the DOM `close` event, and update every binding.

**Contract**: `close` output becomes `closed`; every `(close)=` binding of these components becomes `(closed)=`.

#### 4. Template accessibility findings

**File**: templates of `budget-add-modal`, `budget-create-folder-modal`, `budgets`, `expenses`, `settings`, `expense-form-modal`, `budget-scanner-modal`, `budget-transactions`, `modal`

**Intent**: Associate every form label with its control, and give clickable non-button elements keyboard support and focusability, without changing layout or styling.

**Contract**: Labels get `for` plus a matching `id` (or wrap the control); clickable backdrops and containers get a keyboard handler (for example `(keydown.escape)` or `(keydown.enter)` mirroring the click) and `tabindex`/`role` as the rule requires. Class lists are unchanged.

### Success Criteria:

#### Automated Verification:

- `npm run lint` reports 0 errors and 0 warnings
- `eslint.config.js` contains no rule override other than the commented OnPush rule
- No `eslint-disable` comments exist under `src/` or `e2e/`
- `npm run format:check` passes
- `npm run build` passes, including the post-build secret scan
- `npm test -- --watch=false` passes (5 of 5)
- `npm run test:e2e` passes on both projects

#### Manual Verification:

- Regression smoke (production configuration) shows no differences and identical screenshots against the current production deployment
- Adding an expense through the dashboard modal and closing modals (button, backdrop, Escape where added) work on Desktop and Pixel 7

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Check Script, Docs and Handoff

### Overview

Combine the gates into one command, document it for agents and the user, and hide the formatting commit from `git blame`.

### Changes Required:

#### 1. Combined check

**File**: `package.json`

**Intent**: Add `npm run check` that runs the fast, deterministic gates in order and stops at the first failure.

**Contract**: `check` = `npm run format:check && npm run lint && npm test -- --watch=false && npm run build`. Playwright stays a separate command because it starts a dev server and takes longer.

#### 2. Blame ignore

**File**: `.git-blame-ignore-revs`

**Intent**: List the Phase 1 formatting commit so `git blame` skips it.

**Contract**: One full commit SHA with a comment line naming the commit; README mentions `git config blame.ignoreRevsFile .git-blame-ignore-revs`.

#### 3. Agent and user docs

**File**: `AGENTS.md`, `README.md`, `context/foundation/roadmap.md`

**Intent**: Replace the "no lint script is configured" sentence with the real gate, list the new commands, and record that F-02 is delivered when the change is archived.

**Contract**: AGENTS.md Testing and Delivery says to run `npm run check` plus affected Playwright scenarios before handoff, and to fix lint/format findings instead of disabling rules; README "Uruchamianie i weryfikacja" lists `npm run lint`, `npm run format`, `npm run format:check` and `npm run check`. Roadmap edits are limited to status sync done by the 10x skills.

### Success Criteria:

#### Automated Verification:

- `npm run check` passes
- `npm run test:e2e` passes on both projects
- `git blame --ignore-revs-file .git-blame-ignore-revs src/app/app.config.ts` runs without error
- A deliberately misformatted file and a deliberate lint violation each make `npm run check` fail (then reverted)

#### Manual Verification:

- AGENTS.md and README commands match what actually works
- Cloudflare Workers Builds succeeds for the final state on `master`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- Existing Vitest specs only; the count stays 5 of 5. No new unit tests: the change adds tooling, not logic.

### Integration Tests:

- Full Playwright suite (`e2e/budget-dashboard.spec.ts`) after every phase on Desktop Chrome and Mobile Pixel.

### Manual Testing Steps:

1. Regression smoke (`/tmp/smoke/smoke.mjs`, production configuration) against the production deployment after Phases 1 and 2: identical KPI values, Safe-to-Spend in viewport, Ionic elements, folder filter, no console errors, identical screenshots.
2. Open and close the add-expense modal on Desktop and Pixel 7, including the renamed `closed` output paths.
3. Confirm `npm run check` fails on a deliberate format error and on a deliberate lint error.

## Performance Considerations

`npm run check` should stay well under a minute locally; ESLint with type-unaware rules and Prettier on ~60 files are fast. Bundle size must not change beyond noise.

## Migration Notes

No data migration. Rollback is per phase. Contributors who use `git blame` should set `blame.ignoreRevsFile` once.

## References

- Roadmap item: `context/foundation/roadmap.md` F-02
- Health check: `context/foundation/health-check.md:99-100`, Recommended Fixes 4 and 5
- F-01 decision on change detection: `context/archive/2026-10-05-angular-security-upgrade/audit-triage.md` Phase 4 notes
- Change detection config: `src/app/app.config.ts:10`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Prettier and One-Shot Formatting

#### Automated

- [x] 1.1 `npm run format:check` passes
- [x] 1.2 `npm run build` passes, including the post-build secret scan
- [x] 1.3 `npm test -- --watch=false` passes (5 of 5)
- [x] 1.4 `npm run test:e2e` passes on both projects

#### Manual

- [x] 1.5 Regression smoke (production configuration) shows no differences and identical screenshots against the current production deployment

### Phase 2: Angular ESLint and Minimal Fixes

#### Automated

- [ ] 2.1 `npm run lint` reports 0 errors and 0 warnings
- [ ] 2.2 `eslint.config.js` contains no rule override other than the commented OnPush rule
- [ ] 2.3 No `eslint-disable` comments exist under `src/` or `e2e/`
- [ ] 2.4 `npm run format:check` passes
- [ ] 2.5 `npm run build` passes, including the post-build secret scan
- [ ] 2.6 `npm test -- --watch=false` passes (5 of 5)
- [ ] 2.7 `npm run test:e2e` passes on both projects

#### Manual

- [ ] 2.8 Regression smoke (production configuration) shows no differences and identical screenshots against the current production deployment
- [ ] 2.9 Adding an expense through the dashboard modal and closing modals (button, backdrop, Escape where added) work on Desktop and Pixel 7

### Phase 3: Check Script, Docs and Handoff

#### Automated

- [ ] 3.1 `npm run check` passes
- [ ] 3.2 `npm run test:e2e` passes on both projects
- [ ] 3.3 `git blame --ignore-revs-file .git-blame-ignore-revs src/app/app.config.ts` runs without error
- [ ] 3.4 A deliberately misformatted file and a deliberate lint violation each make `npm run check` fail (then reverted)

#### Manual

- [ ] 3.5 AGENTS.md and README commands match what actually works
- [ ] 3.6 Cloudflare Workers Builds succeeds for the final state on `master`
