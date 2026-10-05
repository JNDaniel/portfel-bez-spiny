# MVP-focused dashboard Implementation Plan

## Overview

Hide every non-MVP demo feature on the main dashboard (`/dashboard`) behind one code-level switch that is off by default, so only MVP actions remain and Safe-to-Spend sits directly under the header. The demo code stays in the repository and can be restored by flipping the switch. Roadmap item S-01 (`context/foundation/roadmap.md`).

## Current State Analysis

The main dashboard (`BudgetMainComponent`, route `dashboard` in `src/app/app.routes.ts`) renders a "quick action" toolbar between the header and the hero gauge, plus several demo surfaces mounted permanently. The transaction list adds an AI summary and per-transaction AI features. PRD §Non-Goals excludes bank notification ingestion, receipt OCR, voice input, automated AI analysis and subscriptions from the MVP; the wants radar is FR-008 (nice-to-have) and returns in S-09 on private data.

Two Playwright cases exercise demo features (bank push, AI summary), so hiding them breaks the current 10/10 E2E baseline unless the suite changes with the UI.

## Desired End State

With the switch off (the committed default):

- The dashboard shows the header (logo, month navigator, desktop "Dodaj wydatek" button), the hero gauge with Safe-to-Spend, the trend chart, categories, folders and the transaction list; the mobile FAB still opens manual entry in one tap.
- No bank push test button or floating bank banner, no receipt scanner, voice AI, subscriptions or wants radar buttons, drawers or modals, no "Analizuj cały … — podsumowanie AI" button or AI summary card, and no receipt-upload box or "AI: …" comment inside an expanded transaction.
- On Desktop Chrome and Pixel 7, "Bezpiecznie na dziś:" is inside the viewport on load without scrolling.
- Flipping the switch on restores the current behavior exactly.

Verification: build, unit tests, E2E on both Playwright projects, and an Android debug APK build.

### Key Discoveries:

- Demo toolbar with five buttons: `src/app/features/budget-app/budget-main.component.ts:111-163`.
- Always-mounted demo surfaces in the same template: bank simulator `:54`, subscriptions and radar drawers `:167-169`, scanner and voice modals `:203-207`.
- AI summary trigger and card: `src/app/features/budget-app/budget-transactions.component.ts:355-367`.
- Per-transaction receipt upload and AI comment: `src/app/features/budget-app/budget-transactions.component.ts:297-319`.
- Demo E2E cases: `e2e/budget-dashboard.spec.ts` test 3 (bank push) and test 5 (AI summary); Playwright runs `Desktop Chrome` and `Mobile Pixel` (Pixel 7) projects (`playwright.config.ts:16-25`).
- The manual add modal (`budget-add-modal.component.ts`) has no voice or scan entry points; it needs no change.
- Existing core config lives in `src/app/core/config/` (`runtime-config.ts`).

## What We're NOT Doing

- Not deleting demo components, their state signals in `BudgetStateService`, or seeded demo data (including seeded `aiComment` values).
- Not adding a build or runtime variable for the switch (no change to `scripts/generate-runtime-config.mjs`).
- Not changing other routes (`/expenses`, `/budgets`, `/analytics`, `/settings`); their fate is decided in S-02.
- Not building the expanding "Dodaj wydatek" menu (manual / voice / scan); parked in the roadmap until voice and OCR are in scope.
- Not changing classification, Safe-to-Spend calculation or persistence.
- Not keeping the old demo E2E cases as skipped tests; they are recoverable from Git history.

## Implementation Approach

Introduce one exported constant in `src/app/core/config/` that describes whether demo features are enabled, defaulting to off. The two dashboard templates read it and wrap every demo element in a conditional block, so disabled demo components are neither rendered nor instantiated. Then replace the two demo E2E cases with one case that asserts the MVP-only surface and the above-the-fold Safe-to-Spend on both Playwright projects, and run the full validation required by `AGENTS.md`.

## Phase 1: Demo switch and MVP-only dashboard

### Overview

Add the switch and hide all demo surfaces on the dashboard and in the transaction list.

### Changes Required:

#### 1. Demo feature switch

**File**: `src/app/core/config/demo-features.ts` (new)

**Intent**: Single place that decides whether non-MVP demo features render, so restoring them later means changing one value.

**Contract**: Exported read-only constant (for example `DEMO_FEATURES_ENABLED = false`) with a short comment naming what it gates and that PRD §Non-Goals keeps it off for the MVP. No injection token, no build variable.

#### 2. Dashboard shell

**File**: `src/app/features/budget-app/budget-main.component.ts`

**Intent**: Render the bank simulator banner, the whole quick-action toolbar, the subscriptions and radar drawers, and the scanner and voice modals only when the switch is on.

**Contract**: Component exposes the constant to its template; each demo element sits inside an `@if` on it. Header, hero gauge, trend chart, categories, transactions, add modal, create-folder modal and the FAB stay unconditional. Existing handler methods and imports remain.

#### 3. Transaction list

**File**: `src/app/features/budget-app/budget-transactions.component.ts`

**Intent**: Hide the AI summary trigger button and `app-budget-ai-summary` card, and inside an expanded transaction hide the receipt-upload box and the "AI: …" comment, when the switch is off.

**Contract**: Same `@if` gating on the shared constant. Pagination ("Pokaż wszystkie"), swipe delete, tags, folder fields and the rest of the expanded transaction stay unchanged.

### Success Criteria:

#### Automated Verification:

- Production build passes with the bundle secret scan: `npm run build`
- Unit tests pass: `npm test -- --watch=false`

#### Manual Verification:

- On `npm start`, the dashboard shows no demo toolbar, no AI summary button, and an expanded transaction shows no receipt-upload box or AI comment
- Temporarily setting the switch to `true` locally restores the toolbar, AI summary and per-transaction AI exactly as before (not committed)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: E2E coverage and full validation

### Overview

Align the browser suite with the MVP-only dashboard and run the validation required for UI changes.

### Changes Required:

#### 1. Browser suite

**File**: `e2e/budget-dashboard.spec.ts`

**Intent**: Remove test 3 (bank push) and test 5 (AI summary), and add one case that guards the MVP surface.

**Contract**: The new case runs on both Playwright projects and asserts: buttons "Test Push z Banku", "Skaner Paragonów", "Głos AI", "Subskrypcje", "Radar Zachcianek" and the "Analizuj cały" AI summary button are absent; "Bezpiecznie na dziś:" is in the viewport on load (`toBeInViewport`); a "Dodaj wydatek" button is visible. Remaining cases 1, 2 and 4 stay unchanged. No `test.only`.

#### 2. Prerequisite: full JDK 21

**File**: none (machine setup by the owner)

**Intent**: `npm run cap:build:apk` needs `javac`; the machine currently has Java 8 as `JAVA_HOME` and a JRE-only Java 21.

**Contract**: Owner runs `sudo apt install openjdk-21-jdk`; the APK build runs with `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64`.

### Success Criteria:

#### Automated Verification:

- E2E passes on Desktop Chrome and Mobile Pixel (8 cases): `npm run test:e2e`
- Production build passes with the bundle secret scan: `npm run build`
- Android debug APK builds: `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 npm run cap:build:apk`

#### Manual Verification:

- On a Pixel 7-sized viewport, Safe-to-Spend and its warning state are visible without scrolling and the FAB opens manual entry in one tap
- After deployment to `https://portfel-bez-spiny.themantax.workers.dev`, the dashboard shows the MVP-only surface

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding.

---

## Testing Strategy

### Unit Tests:

- No new unit tests: the change is template gating on a constant with no logic; existing suites must stay green.

### Integration Tests:

- One E2E case on both projects guarding absence of demo entry points and the above-the-fold Safe-to-Spend; existing hero, add-expense and folder-filter cases keep proving MVP behavior.

### Manual Testing Steps:

1. Run `npm start`, open `/dashboard` on desktop and in a Pixel 7 device emulation; confirm no demo toolbar and Safe-to-Spend visible without scrolling.
2. Expand a transaction; confirm no receipt-upload box or AI comment, while tags and folder information remain.
3. Add an expense through the FAB on mobile and the header button on desktop; confirm a single tap opens manual entry.
4. Locally set the switch to `true`; confirm demo features return; revert.

## Performance Considerations

Disabled demo components are not instantiated, which slightly reduces dashboard work; no budget applies.

## Migration Notes

None. No data or persistence changes; demo data in LocalStorage stays as is.

## References

- Roadmap item S-01: `context/foundation/roadmap.md`
- PRD §Non-Goals, §Observable quality requirements: `context/foundation/prd.md`
- Pixel 7 rule and APK requirement: `AGENTS.md`
- Toolbar: `src/app/features/budget-app/budget-main.component.ts:111-163`
- AI summary: `src/app/features/budget-app/budget-transactions.component.ts:355-367`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Demo switch and MVP-only dashboard

#### Automated

- [x] 1.1 Production build passes with the bundle secret scan: `npm run build` — abd94a5
- [x] 1.2 Unit tests pass: `npm test -- --watch=false` — abd94a5

#### Manual

- [x] 1.3 On `npm start`, the dashboard shows no demo toolbar, no AI summary button, and an expanded transaction shows no receipt-upload box or AI comment — abd94a5
- [x] 1.4 Temporarily setting the switch to `true` locally restores the toolbar, AI summary and per-transaction AI exactly as before (not committed) — 11acdde

### Phase 2: E2E coverage and full validation

#### Automated

- [x] 2.1 E2E passes on Desktop Chrome and Mobile Pixel (8 cases): `npm run test:e2e` — 11acdde
- [x] 2.2 Production build passes with the bundle secret scan: `npm run build` — 11acdde
- [ ] 2.3 Android debug APK builds: `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 npm run cap:build:apk`

#### Manual

- [x] 2.4 On a Pixel 7-sized viewport, Safe-to-Spend and its warning state are visible without scrolling and the FAB opens manual entry in one tap — 11acdde
- [x] 2.5 After deployment to `https://portfel-bez-spiny.themantax.workers.dev`, the dashboard shows the MVP-only surface — 3d9a967
