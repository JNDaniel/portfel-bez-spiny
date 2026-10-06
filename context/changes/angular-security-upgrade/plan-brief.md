# Angular Security Upgrade — Plan Brief

> Full plan: `context/changes/angular-security-upgrade/plan.md`

## What & Why

Move the runtime to Node 24 LTS and the framework and toolchain from Angular 19.2 to Angular 22.2, so the dependency tree has no critical vulnerabilities and every remaining high finding has a recorded decision (roadmap F-01). Angular 19 has no patched release for its framework advisories, and Angular 22 is supported until about December 2027, well past the planned production launch (S-08).

## Starting Point

`npm audit` shows 4 critical and 35 high findings. The critical ones are `tar` (Angular CLI), `piscina`, `proxy-addr` and `compression` (webpack-based build package) and `@capacitor/android` 8.5.0, the only one that ships to the device. The app runs on Node 22.17, already uses the esbuild application builder, runs zone-based change detection, has two Karma/Jasmine spec files and a 10-case Playwright suite, and cannot build an APK locally because the Android SDK is missing.

## Desired End State

The app builds on Node 24 locally and in Cloudflare, runs on Angular 22.2 and Ionic 9 with TypeScript 6.0, `@angular/build` and Vitest, Capacitor and all other dependencies are at their latest in-range versions, and unused lucide packages are gone. `npm audit` reports 0 critical, and `audit-triage.md` lists every remaining high finding with its path, runtime vs build-time, and decision. Web build, unit tests, E2E and `cap:sync` pass, and the app behaves exactly as before.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Target version | Angular 22.2 | Supported until ~Dec 2027 versus ~May 2027 for 21, avoiding another framework migration right after the production launch. |
| Node runtime | Node 24 LTS, switched first | Angular 22 needs Node `^22.22.3 \|\| ^24.15.0`; Node 22 support ends in April 2027, and switching on the unchanged app isolates deploy risk. |
| Ionic | Upgrade 8 → 9 in its own phase after Angular 22 | Ionic 9's release highlights broader Angular compatibility and 8.8.19 is likely the last 8.x; a separate phase keeps Ionic and Angular regressions apart. |
| Other libraries | `npm update` within current ranges in Phase 1 | Low-risk updates that may clear transitive findings; no other majors (zone.js 0.16, Tailwind 4) in this change. |
| Unit test runner | Migrate Karma → Vitest | Karma is deprecated and its unfixable high findings disappear with it; Vitest is Angular's default since v21. |
| Build package | `@angular/build` | Drops webpack-dev-server and most transitive critical findings; the app already uses the esbuild builder. |
| Tailwind | Stay on 3.4, follow-up change | Build-time-only findings do not justify a visual-regression hunt across ~712 class attributes in this change; `@angular/build@22` still supports Tailwind 3. |
| Done bar | 0 critical, every high triaged | Matches the F-01 wording and avoids forcing untested transitive versions with overrides. |
| Android verification | `cap:sync` now, APK build in S-07 | Ships the critical Capacitor fix without blocking on SDK setup, following the S-01 precedent. |
| Ride-along cleanup | Remove lucide packages, patch Capacitor, update AGENTS.md/README | Removes the Angular ≤21 peer cap and keeps agent instructions accurate. |

## Scope

**In scope:**
- Node 24 in `.nvmrc`, locally and in Cloudflare `NODE_VERSION`
- Angular 19 → 20 → 21 → 22.2 via `ng update`, TypeScript 6.0
- `@angular-devkit/build-angular` → `@angular/build`
- Karma/Jasmine → Vitest, converting the two spec files
- Ionic 8 → 9 following the official upgrade guide, with no intended UI change
- Capacitor 8.x patches, `npm update` within current ranges, lucide removal
- Audit triage file, roadmap notes, AGENTS.md, README and deploy-plan updates

**Out of scope:**
- Node 26, TypeScript 7
- Tailwind 4, zone.js 0.16, zoneless change detection, new Ionic 9 features
- Android SDK setup and APK build
- npm `overrides` or `npm audit fix --force`
- Lint, formatter, CI, and any feature or UI change

## Architecture / Approach

Switch Node first on the unchanged app and confirm one Cloudflare build, then apply the safe patches so the critical Capacitor fix lands on its own. Upgrade one Angular major per phase, running build, unit, E2E and `cap:sync` checks after each, so a regression points to a single hop. Upgrade Ionic only after Angular 22 is green, switch the test runner on the final framework versions, then measure the final tree against the done bar.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Node 24, baseline and safe patches | Node 24 locally and in Cloudflare, audit baseline, Capacitor patches, in-range `npm update`, lucide removed | Cloudflare build behaving differently on Node 24 |
| 2. Angular 19 → 20 | Angular 20.3 on `@angular/build` | Schematic rewrites beyond the version bump |
| 3. Angular 20 → 21 | Angular 21.2, TypeScript 5.9 | v21 migration switching the app to zoneless |
| 4. Angular 21 → 22.2 and TypeScript 6 | Angular 22.2, TypeScript 6.0, still on Ionic 8 | Ionic 8 not officially tested against Angular 22 |
| 5. Ionic 8 → 9 | Ionic 9 with no visible UI change | Breaking changes in the v9 guide not yet reviewed |
| 6. Karma → Vitest | Vitest unit tests, Karma removed, docs updated | Single-file test command changes for agents |
| 7. Audit triage and handoff | 0 critical, triaged highs, roadmap notes | A remaining high finding with no clear owner |

**Prerequisites:** Node 24.15+ installed (24.21.0 is available via nvm), access to Cloudflare Workers Builds settings, clean working tree, network access to npm.
**Estimated effort:** ~3–4 sessions across 7 phases.

## Open Risks & Assumptions

- Ionic 9 breaking changes are not reviewed yet; Phase 5 starts with that review and stops for a user decision if any change would alter visible UI or behaviour.
- Ionic 8.8.19 on Angular 22 (Phase 4) is a short intermediate state; problems found there are recorded and resolved in Phase 5.
- Native Android build stays unproven until S-07 installs the SDK and runs `npm run cap:build:apk`.
- Cloudflare Workers Builds is assumed to honour `NODE_VERSION=24`; Phase 1 confirms it in the build log before any framework change.
- Tailwind 3 and `@capacitor/cli` → `@xmldom/xmldom` high findings remain as documented build-time risks.

## Success Criteria (Summary)

- `npm audit` shows 0 critical, and every remaining high finding has a recorded decision.
- The app looks and behaves as before on Desktop and Pixel 7, built on Node 24 locally and in Cloudflare, with all automated checks green.
- Agent instructions describe the real Node, Angular and Ionic versions and test commands.
