# Angular Security Upgrade Implementation Plan

## Overview

Move the runtime to Node 24 LTS and the framework and toolchain from Angular 19.2 to Angular 22.2, so the installed dependency tree has no critical vulnerabilities and every remaining high finding has a recorded decision (roadmap F-01). Web and Android behaviour must stay exactly as today. The upgrade also replaces the webpack-based build package with `@angular/build`, upgrades Ionic 8 → 9, replaces Karma with Vitest, patches Capacitor and other dependencies within their current majors, and removes unused icon packages.

## Current State Analysis

- `npm audit` (2026-10-06): 4 critical, 35 high, 18 moderate, 2 low — worse than the 2026-09-17 health check (1 critical, 18 high).
- Critical findings and their sources:
  - `tar` — via `@angular/cli` → `pacote`.
  - `piscina` — via `@angular-devkit/build-angular`.
  - `proxy-addr`, `compression` — via `@angular-devkit/build-angular` → `webpack-dev-server` → `express`.
  - `@capacitor/android` 8.5.0 — GHSA-rvm3-566m-v7fv (remote content loaded at app origin); fixed in 8.5.1+. This is the only critical finding that ships to the device.
- Every Angular framework advisory covers `<=19.2.25`; 19.2.25 is the last v19 release, so no fix exists without a major upgrade.
- Angular 22.2.1 (released 2026-09-30; 22.0 on 2026-06-03) requires Node `^22.22.3 || ^24.15.0 || >=26.0.0` and TypeScript `>=6.0 <6.1`. Local Node is 22.17.0; Node 24.21.0 is available. `.nvmrc` and Cloudflare `NODE_VERSION` are `22`.
- `@angular/build@22` accepts Vitest `^4.0.8 || ^5.0.0` and Tailwind `^2 || ^3 || ^4`, so Tailwind 3.4 can stay.
- `@capacitor/cli` 8 and `wrangler` require Node `>=22.0.0`; Node 24 satisfies both.
- `@ionic/angular@8.8.19` declares `@angular/core >=16.0.0`; official testing against Angular 22 is unconfirmed. Ionic 9.0.0 shipped on 2026-08-19, the same day as 8.8.19, and its announcement highlights broader Angular compatibility; 9.0.6 is current and declares `@angular/core >=18.0.0`. The official guide is `https://ionicframework.com/docs/updating/9-0`; its breaking changes have not been reviewed yet.
- Ionic usage is small: about 97 `ion-` references, mainly `IonContent`, `IonRefresher`/`IonRefresherContent`, `IonFab`/`IonFabButton`, `IonIcon`, `IonList`, `IonItem`, `IonItemSliding`/`IonItemOptions`/`IonItemOption` and `IonApp`.
- `npm outdated` shows in-range updates for Playwright, autoprefixer, postcss, `karma-jasmine-html-reporter`, Capacitor plugins and Ionic 8.
- `tsconfig.json` already uses `moduleResolution: bundler`, `target`/`module: ES2022`, `esModuleInterop: true` — no options TypeScript 6 removes.
- Karma 6.4.4 pulls `socket.io`/`engine.io`, `braces`, `chokidar` with high findings; npm offers no forward fix.
- Tailwind 3.4.19 has build-time-only high findings (`chokidar`, `fast-glob`, `micromatch`, `postcss-nested`, `postcss-selector-parser`) fixed only in Tailwind 4.
- `@capacitor/cli` pulls `plist` → `@xmldom/xmldom` 0.9.11 (high).
- Neither `lucide-angular` nor `@lucide/angular` is imported in `src/`; `lucide-angular@1.0.0` caps peers at Angular `13.x - 21.x` and would block Angular 22.
- Unit tests: two spec files using Jasmine-specific matchers (`toBeFalse`, `toBeTrue`, `expectAsync(...).toBeRejectedWithError`). Roadmap baseline records unit 5/5 and E2E 10/10 green.
- The app runs zone-based change detection (`provideZoneChangeDetection({ eventCoalescing: true })`), bootstraps with `bootstrapApplication`, and does not use `@angular/platform-browser-dynamic` in source.
- Android SDK is not installed locally, so `npm run cap:build:apk` cannot run on this machine (roadmap S-07 blocker).

## Desired End State

- Node 24 LTS in `.nvmrc`, locally, and as Cloudflare Workers Builds `NODE_VERSION`, confirmed in a build log.
- All `@angular/*` packages and `@angular/cli` at 22.2.x, TypeScript 6.0.x, build and dev-server served by `@angular/build`; `@angular-devkit/build-angular` no longer a direct dependency.
- Unit tests run through `@angular/build:unit-test` with Vitest; no Karma or Jasmine packages remain.
- `@ionic/angular` (and `@ionic/core`) at 9.x latest; `@capacitor/*` at the latest 8.x patch; other dependencies at their latest in-range versions; lucide packages removed.
- `npm audit` reports 0 critical; `context/changes/angular-security-upgrade/audit-triage.md` lists every remaining high finding with package, dependency path, runtime vs build-time, and decision (fixed / accepted / follow-up).
- `npm run build`, `npm test`, `npm run test:e2e` and `npm run cap:sync` all pass; the app looks and behaves as before on Desktop and Mobile Pixel.
- AGENTS.md, README and the deploy plan describe the new Node and Angular versions and Vitest test commands; the roadmap records the Tailwind 4 follow-up and the deferred APK build in S-07.

### Key Discoveries:

- `angular.json:17` already uses the esbuild `application` builder, so the switch to `@angular/build` is a package/builder-name change, not a webpack→esbuild migration.
- `angular.json:77-92` holds the Karma test target with `zone.js/testing` polyfills — replaced in Phase 6.
- `src/app/app.config.ts:10` uses `provideZoneChangeDetection`; the app stays zone-based.
- `src/app/core/supabase/supabase-client.service.spec.ts:27-28` uses `toBeFalse` and `expectAsync`, which Vitest does not provide.
- `playwright.config.ts:26-27` starts the app with `npm start`, so E2E exercises the new dev server.
- `README.md:38` and `AGENTS.md:3,28` reference Karma-era commands and Angular 19.
- `context/deployment/deploy-plan.md:43,139` documents `.nvmrc` and `NODE_VERSION=22` for Cloudflare; both move to 24.

## What We're NOT Doing

- Node 26 or TypeScript 7.
- Tailwind 4 migration — accepted build-time risk with a roadmap follow-up.
- zone.js 0.16, zoneless change detection, `jasmine-core` major bumps.
- Adopting new Ionic 9 features or redesigning Ionic-based UI; Phase 5 only keeps current behaviour working.
- Installing the Android SDK or producing an APK — carried to S-07.
- Forcing transitive fixes with npm `overrides` or `npm audit fix --force`.
- Adding lint, formatter or CI (F-02 and later).
- Any feature, UI or data-model change.

## Implementation Approach

Switch Node first, on the unchanged Angular 19 app, and confirm one Cloudflare build, so any runtime or deploy problem is isolated from the framework migration. Apply safe in-major patches in the same phase so the critical Capacitor fix lands early. Then upgrade Angular one major at a time with `ng update` (19 → 20 → 21 → 22), running the full web check after each hop, so a regression can be traced to a single major. Upgrade Ionic 8 → 9 only after Angular 22 is green, so Ionic problems are not confused with Angular ones. Replace the test runner on the final framework versions, then measure the final tree against the done bar.

## Critical Implementation Details

- **Node before Angular 22:** Angular 19 accepts Node `>=22.0.0`, so Node 24 works for every intermediate version; Angular 22 refuses to install on Node 22.17. Use Node 24 for every command from Phase 1 on, and keep `package-lock.json` regenerated under it.
- **Ordering of `ng update`:** Angular supports only one major per run. Finish all checks for each hop before starting the next. Accept the optional `use-application-builder` migration in the 19→20 run (or run `ng update @angular/cli --name use-application-builder`) so `@angular/build` replaces `@angular-devkit/build-angular`.
- **Zone change detection must survive:** Angular 21+ makes zoneless the default for new apps. Review the v21 and v22 migration diffs and keep `provideZoneChangeDetection({ eventCoalescing: true })` and the `zone.js` polyfill; the Vitest setup must also run with zone-based change detection so tests behave like the app.
- **Audit baseline vs target:** record the starting `npm audit` counts in `audit-triage.md` in Phase 1, so the final triage can show what each phase fixed.

## Phase 1: Node 24, Baseline and Safe Patches

### Overview

Record the starting state, switch to Node 24 LTS locally and in Cloudflare, then apply in-major patches that need no framework change, closing the critical Capacitor finding first.

### Changes Required:

#### 1. Audit baseline

**File**: `context/changes/angular-security-upgrade/audit-triage.md`

**Intent**: Capture the pre-change audit summary and test results so later phases can be compared against them.

**Contract**: New file with a `## Baseline (2026-10-06)` section: severity counts, list of critical/high packages with their dependency path, and current unit/E2E/build results.

#### 2. Node 24 runtime

**File**: `.nvmrc`, `context/deployment/deploy-plan.md`, Cloudflare Workers Builds settings (user action)

**Intent**: Move local and deploy builds to Node 24 LTS (at least 24.15.0) on the unchanged Angular 19 app.

**Contract**: `.nvmrc` contains `24`; deploy plan lines about `.nvmrc` and `NODE_VERSION` say 24; Cloudflare `NODE_VERSION` is set to `24` by the user, and the next build log shows a Node 24.x runtime.

#### 3. Dependency patches and cleanup

**File**: `package.json`, `package-lock.json`

**Intent**: Remove the unused `lucide-angular` and `@lucide/angular`; bump all `@capacitor/*` packages to their latest 8.x patch (at least 8.5.2 for core/android/cli) and `@ionic/angular` to 8.8.19; run `npm update` so every other dependency moves to its latest version within the existing `package.json` ranges.

**Contract**: No `lucide` entries remain; Capacitor and Ionic stay on major 8; no direct dependency changes major version; lockfile regenerated under Node 24.

#### 4. Native sync

**File**: `android/` (generated)

**Intent**: Regenerate native project files for the patched Capacitor packages.

**Contract**: Produced only by `npm run cap:sync`; review the diff for unexpected Gradle or manifest changes and do not hand-edit copied web assets.

### Success Criteria:

#### Automated Verification:

- Baseline section exists in `audit-triage.md` with counts matching `npm audit` before changes
- `node -v` reports v24.15.0 or newer and `.nvmrc` contains `24`
- `npm ls lucide-angular @lucide/angular` reports no installed packages
- `npm outdated` shows no remaining in-range ("Wanted" newer than "Current") updates
- `npm audit` no longer lists `@capacitor/android`
- `npm run build` passes, including the post-build secret scan
- `npm test -- --watch=false` passes
- `npm run test:e2e` passes on both projects
- `npm run cap:sync` completes without errors

#### Manual Verification:

- Cloudflare Workers Builds log for this branch shows Node 24.x and a successful build
- `android/` diff after sync contains only expected Capacitor version updates
- Dashboard renders unchanged in the browser on Desktop and Pixel 7 viewport

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Angular 19 → 20

### Overview

Upgrade the framework and CLI to Angular 20.3 and switch the build package to `@angular/build`.

### Changes Required:

#### 1. Framework and CLI update

**File**: `package.json`, `package-lock.json`, `angular.json`, `tsconfig*.json`, any files touched by schematics

**Intent**: Run `ng update` for `@angular/core@20` and `@angular/cli@20`, accepting the `use-application-builder` migration so `@angular/build` replaces `@angular-devkit/build-angular`; TypeScript moves to 5.8.

**Contract**: All `@angular/*` at 20.3.x including `@angular/platform-browser-dynamic` and `@angular/compiler-cli`; `angular.json` build/serve/extract-i18n targets use `@angular/build:*`; the test target stays on Karma via `@angular/build:karma` until Phase 6; `@angular-devkit/build-angular` removed from `devDependencies` if nothing still requires it.

#### 2. Schematic review

**File**: files changed by the migration

**Intent**: Read every migration diff and revert anything that changes behaviour beyond the version contract (for example, template or config rewrites the app does not need).

**Contract**: Commit contains only migration output plus fixes needed to compile and pass tests.

### Success Criteria:

#### Automated Verification:

- `npm ls @angular/core @angular/cli typescript` shows 20.3.x and TypeScript 5.8.x
- `angular.json` contains no `@angular-devkit/build-angular` builder names
- `npm run build` passes, including the post-build secret scan
- `npm test -- --watch=false` passes
- `npm run test:e2e` passes on both projects

#### Manual Verification:

- `npm start` serves the app; dashboard, expense entry and Safe-to-Spend warning behave as before on Desktop and Pixel 7 viewport

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Angular 20 → 21

### Overview

Upgrade to Angular 21.2 as the intermediate step, keeping zone-based change detection.

### Changes Required:

#### 1. Framework and CLI update

**File**: `package.json`, `package-lock.json`, `angular.json`, `tsconfig*.json`, `src/app/app.config.ts` if touched by schematics

**Intent**: Run `ng update` for `@angular/core@21` and `@angular/cli@21`; TypeScript moves to 5.9.

**Contract**: All `@angular/*` and `@angular/build` at 21.2.x; TypeScript `~5.9`; `zone.js` stays `~0.15`; `provideZoneChangeDetection({ eventCoalescing: true })` and the `zone.js` polyfill remain.

#### 2. Schematic review

**File**: files changed by the migration

**Intent**: Review migration output as in Phase 2.

**Contract**: Only migration output and compile fixes.

### Success Criteria:

#### Automated Verification:

- `npm ls @angular/core @angular/cli @angular/build typescript` shows 21.2.x and TypeScript 5.9.x
- `src/app/app.config.ts` still provides `provideZoneChangeDetection({ eventCoalescing: true })`
- `npm run build` passes, including the post-build secret scan
- `npm test -- --watch=false` passes
- `npm run test:e2e` passes on both projects

#### Manual Verification:

- Dashboard and expense entry behave as before on Pixel 7 viewport

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Angular 21 → 22.2 and TypeScript 6

### Overview

Upgrade to Angular 22.2 with TypeScript 6.0, verify Ionic 8 compatibility, and resync native assets.

### Changes Required:

#### 1. Framework, CLI and TypeScript update

**File**: `package.json`, `package-lock.json`, `angular.json`, `tsconfig*.json`, `src/app/app.config.ts` if touched by schematics

**Intent**: Run `ng update` for `@angular/core@22` and `@angular/cli@22`; TypeScript moves to 6.0. Fix only the compile errors or deprecated options TypeScript 6 reports.

**Contract**: All `@angular/*` and `@angular/build` at 22.2.x; TypeScript `~6.0`; `zone.js` stays `~0.15`; zone-based change detection and the `zone.js` polyfill remain; `@ionic/angular` stays 8.8.19.

#### 2. Schematic review and native sync

**File**: files changed by the migration, `android/` (generated)

**Intent**: Review migration output as in Phase 2 and resync native assets from the new build.

**Contract**: Only migration output and compile fixes; `android/` regenerated by `npm run cap:sync`. Ionic stays on 8.8.19 in this phase so Angular and Ionic regressions stay separate; if an Ionic 8 component breaks only under Angular 22, record it in `audit-triage.md` notes and resolve it in Phase 5 instead of patching around it.

### Success Criteria:

#### Automated Verification:

- `npm ls @angular/core @angular/cli @angular/build typescript` shows 22.2.x and TypeScript 6.0.x
- `npm ls @ionic/angular` shows 8.8.19 with no peer-dependency errors
- `src/app/app.config.ts` still provides `provideZoneChangeDetection({ eventCoalescing: true })`
- `npm audit` lists no `@angular/*` packages
- `npm run build` passes, including the post-build secret scan
- `npm test -- --watch=false` passes
- `npm run test:e2e` passes on both projects
- `npm run cap:sync` completes without errors

#### Manual Verification:

- Dashboard, expense entry, occasion expenses not triggering the daily-budget warning, and Safe-to-Spend visibility without scrolling verified on Pixel 7 viewport
- Ionic components (pull-to-refresh, floating action button, sliding item options, icons) behave as before on Ionic 8.8.19
- Production build output size is within roughly 10% of the Phase 1 build

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Ionic 8 → 9

### Overview

Upgrade `@ionic/angular` to the current 9.x release on top of a green Angular 22 build, following the official upgrade guide, with no intended UI change.

### Changes Required:

#### 1. Breaking-change review

**File**: `context/changes/angular-security-upgrade/audit-triage.md`

**Intent**: Read `https://ionicframework.com/docs/updating/9-0` and the Ionic 9 changelog before touching code, and list which breaking changes affect the components this app uses.

**Contract**: `## Ionic 9 review` section with one line per relevant breaking change: affected component, file(s), and planned fix or "not used". If a breaking change requires a visible UI or behaviour change, stop and ask the user before continuing.

#### 2. Package and code update

**File**: `package.json`, `package-lock.json`, Ionic-using files under `src/app/` (for example components importing `IonContent`, `IonRefresher`, `IonFab`, `IonItemSliding`)

**Intent**: Bump `@ionic/angular` to the latest 9.x and apply only the code changes the guide requires for the components listed in the review.

**Contract**: `@ionic/angular` at 9.x latest; standalone `@ionic/angular/standalone` imports stay; no new Ionic features adopted; `ionicons` stays at a version Ionic 9 accepts.

#### 3. Native sync

**File**: `android/` (generated)

**Intent**: Resync native assets from the Ionic 9 build.

**Contract**: Produced only by `npm run cap:sync`.

### Success Criteria:

#### Automated Verification:

- `audit-triage.md` contains the Ionic 9 review section
- `npm ls @ionic/angular` shows 9.x with no peer-dependency errors
- `npm run build` passes, including the post-build secret scan
- `npm test -- --watch=false` passes
- `npm run test:e2e` passes on both projects
- `npm run cap:sync` completes without errors

#### Manual Verification:

- Pull-to-refresh, floating action button, sliding item options and icons behave and look as before on Pixel 7 viewport
- Safe-to-Spend and its warning state are visible without scrolling on Pixel 7 viewport

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 6: Karma → Vitest

### Overview

Replace Karma/Jasmine with Angular's Vitest-based unit-test builder and update the test commands in agent and user docs.

### Changes Required:

#### 1. Test builder and dependencies

**File**: `angular.json`, `package.json`, `package-lock.json`, `tsconfig.spec.json`

**Intent**: Switch the `test` target to `@angular/build:unit-test` with the Vitest runner, add `vitest` (within `@angular/build@22`'s `^4.0.8 || ^5.0.0` range) and a DOM environment (`jsdom`), and remove `karma*`, `jasmine-core` and `@types/jasmine`.

**Contract**: `test` target uses `@angular/build:unit-test`; `tsconfig.spec.json` types switch from `jasmine` to Vitest globals; the test environment keeps zone-based change detection; no `karma` or `jasmine` packages remain in `npm ls`.

#### 2. Spec conversion

**File**: `src/app/app.component.spec.ts`, `src/app/core/supabase/supabase-client.service.spec.ts`

**Intent**: Convert Jasmine-only APIs to Vitest equivalents, preferably with the `@schematics/angular:refactor-jasmine-vitest` schematic, and fix the rest by hand.

**Contract**: Same test names and assertions; e.g. `toBeFalse()` → `toBe(false)`, `expectAsync(p).toBeRejectedWithError(re)` → `await expect(p).rejects.toThrow(re)`.

#### 3. Test command docs

**File**: `AGENTS.md`, `README.md`

**Intent**: Replace Karma-era commands with the Vitest-builder equivalents, including running one unit file.

**Contract**: AGENTS.md Testing section and README "Uruchamianie i weryfikacja" list commands that work after this phase (verify `npm test -- --include <path>` still works, or document the replacement).

### Success Criteria:

#### Automated Verification:

- `npm test -- --watch=false` runs under Vitest and passes the same number of tests as before
- The documented single-file unit command runs only the named spec
- `npm ls karma jasmine-core @types/jasmine` reports no installed packages
- `npm audit` lists no `karma`, `engine.io` or `socket.io` findings
- `npm run build` passes

#### Manual Verification:

- Test commands in AGENTS.md and README match what actually works

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 7: Audit Triage and Handoff

### Overview

Measure the final tree against the done bar, record every remaining high finding, and update the roadmap and agent instructions.

### Changes Required:

#### 1. Final triage

**File**: `context/changes/angular-security-upgrade/audit-triage.md`

**Intent**: Add the final `npm audit` result and a decision for every remaining high (and any critical, which must be zero) finding.

**Contract**: `## Final` section with severity counts and a table: package, version, dependency path, runtime vs build-time, decision (`fixed` / `accepted` / `follow-up`), reason or follow-up reference. Tailwind 3 transitive findings are `follow-up` (Tailwind 4 change); `@xmldom/xmldom` via `@capacitor/cli` is `accepted` build-time unless a patched Capacitor CLI resolves it.

#### 2. Roadmap and agent docs

**File**: `context/foundation/roadmap.md`, `AGENTS.md`

**Intent**: Record the Tailwind 4 follow-up and the deferred APK build for this change in S-07's blocker, and update the framework version line in AGENTS.md.

**Contract**: Roadmap S-07 blockers mention the APK build for `angular-security-upgrade`; a Tailwind 4 follow-up is noted (Parked or a new proposed item, without renumbering existing IDs); AGENTS.md line 3 says Angular 22/Ionic 9 and states Node 24 as the required runtime.

### Success Criteria:

#### Automated Verification:

- `npm audit` reports 0 critical
- Every high package in `npm audit --json` appears in the `audit-triage.md` Final table
- `npm run build` passes, including the post-build secret scan
- `npm test -- --watch=false` passes
- `npm run test:e2e` passes on both projects
- `npm run cap:sync` completes without errors

#### Manual Verification:

- Triage decisions reviewed and accepted by the user
- Roadmap, AGENTS.md and deploy-plan updates reviewed
- Cloudflare Workers Builds succeeds for the final branch state on Node 24

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- Existing specs only; behaviour must not change. Same test count before and after the Vitest switch.
- `SupabaseClientService`: disabled-on-local rejection and shared-client creation keep passing after matcher conversion.

### Integration Tests:

- Full Playwright suite (`e2e/budget-dashboard.spec.ts`) on Desktop and Mobile Pixel after every phase; it runs against the new dev server through `npm start`.

### Manual Testing Steps:

1. Open the dashboard on Pixel 7 viewport and confirm Safe-to-Spend and its warning state are visible without scrolling.
2. Add a routine expense and confirm Safe-to-Spend updates.
3. Add an occasion expense and confirm it does not trigger the daily-budget warning.
4. Reload the page and confirm data persists as before.

## Performance Considerations

Compare production bundle size between Phase 1, Phase 4 and Phase 5; a large jump points to a migration side effect worth checking.

## Migration Notes

No data migration. Rollback is per phase: each phase is its own commit, so reverting a phase restores the previous `package.json`, lockfile and config. Reverting Phase 1 also requires setting Cloudflare `NODE_VERSION` back to `22`. Android native verification (`npm run cap:build:apk`) is deferred to S-07, when the Android SDK is installed.

## References

- Health check: `context/foundation/health-check.md` (Recommended Fixes 1 and 6)
- Roadmap item: `context/foundation/roadmap.md` F-01, S-07
- Deploy Node pin: `context/deployment/deploy-plan.md:43,139`
- Build config: `angular.json:17,77`
- Zone config: `src/app/app.config.ts:10`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Node 24, Baseline and Safe Patches

#### Automated

- [x] 1.1 Baseline section exists in `audit-triage.md` with counts matching `npm audit` before changes — 35fd743
- [x] 1.2 `node -v` reports v24.15.0 or newer and `.nvmrc` contains `24` — 35fd743
- [x] 1.3 `npm ls lucide-angular @lucide/angular` reports no installed packages — 35fd743
- [x] 1.4 `npm outdated` shows no remaining in-range ("Wanted" newer than "Current") updates — 35fd743
- [x] 1.5 `npm audit` no longer lists `@capacitor/android` — 35fd743
- [x] 1.6 `npm run build` passes, including the post-build secret scan — 35fd743
- [x] 1.7 `npm test -- --watch=false` passes — 35fd743
- [x] 1.8 `npm run test:e2e` passes on both projects — 35fd743
- [x] 1.9 `npm run cap:sync` completes without errors — 35fd743

#### Manual

- [x] 1.10 Cloudflare Workers Builds log for this branch shows Node 24.x and a successful build — 35fd743
- [x] 1.11 `android/` diff after sync contains only expected Capacitor version updates — 35fd743
- [x] 1.12 Dashboard renders unchanged in the browser on Desktop and Pixel 7 viewport — 35fd743

### Phase 2: Angular 19 → 20

#### Automated

- [x] 2.1 `npm ls @angular/core @angular/cli typescript` shows 20.3.x and TypeScript 5.8.x — 799a3ee
- [x] 2.2 `angular.json` contains no `@angular-devkit/build-angular` builder names — 799a3ee
- [x] 2.3 `npm run build` passes, including the post-build secret scan — 799a3ee
- [x] 2.4 `npm test -- --watch=false` passes — 799a3ee
- [x] 2.5 `npm run test:e2e` passes on both projects — 799a3ee

#### Manual

- [x] 2.6 `npm start` serves the app; dashboard, expense entry and Safe-to-Spend warning behave as before on Desktop and Pixel 7 viewport — 799a3ee

### Phase 3: Angular 20 → 21

#### Automated

- [x] 3.1 `npm ls @angular/core @angular/cli @angular/build typescript` shows 21.2.x and TypeScript 5.9.x
- [x] 3.2 `src/app/app.config.ts` still provides `provideZoneChangeDetection({ eventCoalescing: true })`
- [x] 3.3 `npm run build` passes, including the post-build secret scan
- [x] 3.4 `npm test -- --watch=false` passes
- [x] 3.5 `npm run test:e2e` passes on both projects

#### Manual

- [x] 3.6 Dashboard and expense entry behave as before on Pixel 7 viewport

### Phase 4: Angular 21 → 22.2 and TypeScript 6

#### Automated

- [ ] 4.1 `npm ls @angular/core @angular/cli @angular/build typescript` shows 22.2.x and TypeScript 6.0.x
- [ ] 4.2 `npm ls @ionic/angular` shows 8.8.19 with no peer-dependency errors
- [ ] 4.3 `src/app/app.config.ts` still provides `provideZoneChangeDetection({ eventCoalescing: true })`
- [ ] 4.4 `npm audit` lists no `@angular/*` packages
- [ ] 4.5 `npm run build` passes, including the post-build secret scan
- [ ] 4.6 `npm test -- --watch=false` passes
- [ ] 4.7 `npm run test:e2e` passes on both projects
- [ ] 4.8 `npm run cap:sync` completes without errors

#### Manual

- [ ] 4.9 Dashboard, expense entry, occasion expenses not triggering the daily-budget warning, and Safe-to-Spend visibility without scrolling verified on Pixel 7 viewport
- [ ] 4.10 Ionic components (pull-to-refresh, floating action button, sliding item options, icons) behave as before on Ionic 8.8.19
- [ ] 4.11 Production build output size is within roughly 10% of the Phase 1 build

### Phase 5: Ionic 8 → 9

#### Automated

- [ ] 5.1 `audit-triage.md` contains the Ionic 9 review section
- [ ] 5.2 `npm ls @ionic/angular` shows 9.x with no peer-dependency errors
- [ ] 5.3 `npm run build` passes, including the post-build secret scan
- [ ] 5.4 `npm test -- --watch=false` passes
- [ ] 5.5 `npm run test:e2e` passes on both projects
- [ ] 5.6 `npm run cap:sync` completes without errors

#### Manual

- [ ] 5.7 Pull-to-refresh, floating action button, sliding item options and icons behave and look as before on Pixel 7 viewport
- [ ] 5.8 Safe-to-Spend and its warning state are visible without scrolling on Pixel 7 viewport

### Phase 6: Karma → Vitest

#### Automated

- [ ] 6.1 `npm test -- --watch=false` runs under Vitest and passes the same number of tests as before
- [ ] 6.2 The documented single-file unit command runs only the named spec
- [ ] 6.3 `npm ls karma jasmine-core @types/jasmine` reports no installed packages
- [ ] 6.4 `npm audit` lists no `karma`, `engine.io` or `socket.io` findings
- [ ] 6.5 `npm run build` passes

#### Manual

- [ ] 6.6 Test commands in AGENTS.md and README match what actually works

### Phase 7: Audit Triage and Handoff

#### Automated

- [ ] 7.1 `npm audit` reports 0 critical
- [ ] 7.2 Every high package in `npm audit --json` appears in the `audit-triage.md` Final table
- [ ] 7.3 `npm run build` passes, including the post-build secret scan
- [ ] 7.4 `npm test -- --watch=false` passes
- [ ] 7.5 `npm run test:e2e` passes on both projects
- [ ] 7.6 `npm run cap:sync` completes without errors

#### Manual

- [ ] 7.7 Triage decisions reviewed and accepted by the user
- [ ] 7.8 Roadmap, AGENTS.md and deploy-plan updates reviewed
- [ ] 7.9 Cloudflare Workers Builds succeeds for the final branch state on Node 24
