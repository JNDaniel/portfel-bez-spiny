# Implementation review: mvp-focused-dashboard

- Reviewed phases: 1, 2
- Date: 2026-10-05
- Mode: manual (after archive; `/10x-impl-review` not installed)
- Scope: `git diff 6709886..3d9a967 -- src e2e`
- Verdict: approved, no blocking findings

## Plan conformance

| Plan item | Result |
| --- | --- |
| `src/app/core/config/demo-features.ts`, `DEMO_FEATURES_ENABLED = false` with comment | Matches |
| Dashboard: bank simulator, toolbar, subscriptions/radar drawers, scanner/voice modals behind `@if` | Matches (4 gated blocks); header, gauge, chart, categories, transactions, modals and FAB unconditional |
| Transactions: receipt upload + AI comment, AI summary button and card behind `@if` | Matches (3 gated blocks) |
| E2E: tests 3 and 5 replaced by one MVP-surface case, 8 cases total, no `test.only` | Matches |

## Search for ungated demo entry points

Every usage of the demo selectors (`app-budget-bank-simulator`, `-subscriptions`, `-radar-waste`, `-scanner-modal`, `-voice-modal`, `-ai-summary`) and of the demo handlers (`triggerSampleBankNotification`, `openScanner`, `openVoice`, `toggleSubscriptions`, `toggleWasteRadar`, `toggleAiSummary`) in `src/app` sits inside a gated block or inside a demo component itself. `BudgetStateService` has no timers that trigger demo flows, and drawer/summary open state is not persisted.

## Deviations from plan (accepted)

- The transaction-list footer renders only when pagination or demo content exists (`@let showPagination`), so no empty bordered box remains. Not in the plan; avoids a visual artifact.
- The switch is exposed to templates as a component field `demoFeaturesEnabled`, because templates cannot read module constants.
- The E2E absence check initially used `exact: true`. Button names start with emoji, so it could never match. It was fixed before the Phase 2 commit to substring matching, and a break-check with the switch on confirmed red on "Test Push z Banku".

## Open items

- 2.3 Android APK build: skipped, no Android SDK on the machine. Carried into roadmap S-07 (`b92d24a`).
- Warning state of Safe-to-Spend was not exercised on Pixel 7 because seeded data does not exceed the budget. It lives inside the hero gauge, which is fully in the viewport.
