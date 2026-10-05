# MVP-focused dashboard — Plan Brief

> Full plan: `context/changes/mvp-focused-dashboard/plan.md`

## What & Why

Hide the non-MVP demo features on the main dashboard so the user sees only MVP actions and Safe-to-Spend right under the header. PRD §Non-Goals excludes bank ingestion, OCR, voice, AI analysis and subscriptions from the MVP, and the toolbar pushes Safe-to-Spend down on Pixel 7, against the one-second readability rule and `AGENTS.md`.

## Starting Point

`/dashboard` shows a five-button demo toolbar (bank push test, receipt scanner, voice AI, subscriptions, wants radar) above the hero gauge, plus an AI summary and per-transaction AI features in the list. Two E2E cases test these demos.

## Desired End State

By default the dashboard has no demo entry points: no toolbar, banner, drawers, scanner or voice modals, no AI summary, no receipt upload or AI comment in an expanded transaction. Safe-to-Spend is visible without scrolling on desktop and Pixel 7, manual entry stays one tap, and flipping one switch restores everything.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Hiding mechanism | One code-level constant in `src/app/core/config/`, off by default | Restoring demos is a one-value change, without a new build variable the MVP does not need. |
| AI inside transactions | Hide both receipt upload and "AI: …" comment | OCR and AI analysis are out of MVP; new expenses would never get these comments. |
| Demo E2E cases 3 and 5 | Replace with one case asserting demos are hidden and Safe-to-Spend is in the viewport | Guards this change's outcome instead of leaving dead or skipped tests. |
| Android APK check | Owner installs full JDK 21 before Phase 2 | Satisfies the `AGENTS.md` UI rule and also unblocks roadmap S-07. |

## Scope

**In scope:**
- Demo switch constant
- Conditional rendering in `budget-main.component.ts` and `budget-transactions.component.ts`
- E2E suite update
- Full validation including APK

**Out of scope:**
- Deleting demo code or demo data
- Other routes (decided in S-02)
- Expanding "Dodaj wydatek" menu (parked)
- Any calculation or persistence change

## Architecture / Approach

The two dashboard templates import one constant and wrap every demo element in `@if`, so disabled demo components are neither rendered nor created. Nothing else in the app reads the constant.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Demo switch and MVP-only dashboard | Dashboard without demo surfaces; build and unit tests green | Hiding an MVP element by mistake (e.g. tags or folder info in the expanded transaction) |
| 2. E2E coverage and full validation | 8/8 E2E on both projects, build, APK | APK blocked until JDK 21 is installed |

**Prerequisites:** Full JDK 21 installed before Phase 2 (`sudo apt install openjdk-21-jdk`).
**Estimated effort:** One short session across 2 phases.

## Open Risks & Assumptions

- Assumes the trend chart and categories stay as MVP dashboard content; only the listed demo surfaces are hidden.
- The above-the-fold assertion depends on current hero gauge height; if it fails on Pixel 7 after hiding the toolbar, the layout needs a follow-up rather than a weaker test.

## Success Criteria (Summary)

- The dashboard shows only MVP actions, and Safe-to-Spend is visible without scrolling on desktop and Pixel 7.
- Manual expense entry still takes one tap; tags, folders and swipe delete work as before.
- Demo features return by flipping one constant.
