# Implementation review: angular-security-upgrade

- Reviewed phases: 1–7
- Date: 2026-10-06
- Mode: manual (`/10x-impl-review` not installed)
- Scope: `git diff 2b7a4a1..8082890` (excluding `package-lock.json`)
- Verdict: approved after one non-blocking fix; one open item (7.9)

## Plan conformance

| Plan item | Result |
| --- | --- |
| Node 24 (`.nvmrc`, Cloudflare `NODE_VERSION=24` in deploy-plan) | Matches |
| One Angular major per phase via `ng update`, 19 → 20 → 21 → 22.2.1 | Matches (p2–p4) |
| `@angular-devkit/build-angular` replaced by `@angular/build` | Matches; `angular.json` builders are `@angular/build:*` |
| TypeScript 6.0 on Angular 22 | Matches (6.0.3) |
| Zone-based change detection kept | Matches: `provideZoneChangeDetection({ eventCoalescing: true })` in `app.config.ts`; `zone.js` in build polyfills, `zone.js` + `zone.js/testing` in the `testing` configuration |
| Ionic 8 → 9 with no visible UI change | Matches; only the import path changed (`@ionic/angular/standalone` → `@ionic/angular`) |
| Karma → Vitest, same test count | Matches: 5 of 5; no `karma`/`jasmine` packages, configs or matchers remain |
| 0 critical, every high triaged | Matches: 0 critical, 5 high (Tailwind 3 chain) in `audit-triage.md` §Final |
| Lucide packages removed, Capacitor/Ionic patches | Matches (p1) |
| AGENTS.md / README test commands and versions | Matches; documented single-file command verified |
| Roadmap: S-07 APK note, Tailwind 4 follow-up | Matches (S-07 blocker extended, Parked item added, no IDs renumbered) |

## Search for leftovers

No references to `karma`, `jasmine`, `expectAsync`, `toBeFalse`/`toBeTrue`, `@ionic/angular/standalone`, `build-angular`, `istanbul` or `webpack` remain outside `context/` and generated folders. No focused tests (`test.only`, `fit`, `fdescribe`). `e2e/`, `playwright.config.ts`, `capacitor.config.ts` and tracked `android/` files are unchanged.

## Finding fixed during review

- **Five components had no `changeDetection` and would default to OnPush on Angular 22:** `features/dashboard/dashboard.component.ts`, `shared/components/header`, `sidebar`, `stat-card` and `mobile-tab-bar`. None is routed or referenced from live code (`stat-card` is used only by the unused `dashboard`), so the v22 migration skipped them and runtime behaviour was unaffected. `ChangeDetectionStrategy.Eager` was added so they keep pre-v22 behaviour if they come back. Checked with `ngc` against a temporary tsconfig listing these files, plus `npm run build` and the unit suite.

## Deviations from plan (accepted)

- TypeScript went to 5.9.3 in Phase 2 instead of 5.8 (`ng update` choice; needed by Phase 3).
- Ionic 9 has no `./standalone` export, so "standalone imports stay" became "standalone components imported from `@ionic/angular`".
- `refactor-jasmine-vitest` re-indented the spec; its three matcher changes were applied by hand instead.
- `@xmldom/xmldom` is no longer flagged, so the planned `accepted` entry was not needed.
- Agent-run regression smoke (Playwright, Desktop and Pixel 7, production configuration, diffed against the Angular 19 preview `911ca2fa`) replaced per-phase manual checks at the user's request. Every phase from 2 to 5 showed no differences and identical screenshots.

## Open items

- 7.9 closed after the review: the branch build (`6016ea17`) failed, most likely on the stale non-production trigger token, but the production build `61e53fb0` succeeded after `master` was fast-forwarded to `c06fa24` (see `audit-triage.md` Phase notes). Repointing the non-production trigger token remains outside this change.
- Android APK build: deferred to S-07 (no Android SDK on this machine).
- Occasion expenses not triggering the daily warning were covered as parity with the baseline (identical KPI and Safe-to-Spend output with the occasion folder selected), not by adding a new occasion expense.
