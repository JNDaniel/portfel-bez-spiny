# Audit Triage: angular-security-upgrade

## Baseline (2026-10-06)

Taken on branch `angular-security-upgrade` before any dependency change, with Node 24.21.0 and the lockfile from `master` (`2b7a4a1`).

### `npm audit` summary

| Critical | High | Moderate | Low | Total |
| --- | --- | --- | --- | --- |
| 4 | 35 | 18 | 2 | 59 |

### Critical findings

| Package | Version | Direct? | Main dependency path |
| --- | --- | --- | --- |
| `@capacitor/android` | 8.5.0 | direct | `@capacitor/android` (GHSA-rvm3-566m-v7fv, ships to device) |
| `piscina` | 4.8.0 | transitive | `@angular-devkit/build-angular` → `@angular/build` → `piscina` |
| `proxy-addr` | 2.0.7 | transitive | `@angular-devkit/build-angular` → `webpack-dev-server` → `express` → `proxy-addr` |
| `tar` | 7.5.22 | transitive | `@angular/cli` → `pacote` → `@npmcli/run-script` → `node-gyp` → `tar` |

### High findings

| Package | Direct? | Main dependency path |
| --- | --- | --- |
| `@angular-devkit/build-angular` | direct | — |
| `@angular/build` | transitive | `@angular-devkit/build-angular` → `@angular/build` |
| `@angular/cli` | direct | — |
| `@angular/common` | direct | — |
| `@angular/compiler` | direct | — |
| `@angular/core` | direct | — |
| `@angular/router` | direct | — |
| `@xmldom/xmldom` | transitive | `@capacitor/cli` → `plist` → `@xmldom/xmldom` |
| `brace-expansion` | transitive | `@angular/cli` → `pacote` → `@npmcli/package-json` → `glob` → `minimatch` → `brace-expansion` |
| `braces` | transitive | `webpack-dev-server` / `karma` → `chokidar` → `braces` |
| `chokidar` | transitive | `@angular-devkit/core`, `sass`, `webpack-dev-server`, `karma`, `tailwindcss` → `chokidar` |
| `compression` | transitive | `@angular-devkit/build-angular` → `webpack-dev-server` → `compression` |
| `copy-webpack-plugin` | transitive | `@angular-devkit/build-angular` → `copy-webpack-plugin` |
| `engine.io` | transitive | `karma` → `socket.io` → `engine.io` |
| `fast-glob` | transitive | `@angular/build`, `copy-webpack-plugin`, `tailwindcss` → `fast-glob` |
| `fast-uri` | transitive | `@angular-devkit/core` → `ajv` → `fast-uri` |
| `globby` | transitive | `copy-webpack-plugin` → `globby` |
| `http-cache-semantics` | transitive | `@angular/cli` → `pacote` → `npm-registry-fetch` → `make-fetch-happen` → `http-cache-semantics` |
| `http-proxy-middleware` | transitive | `@angular-devkit/build-angular` / `webpack-dev-server` → `http-proxy-middleware` |
| `js-yaml` | transitive | `@angular-devkit/build-angular` → `postcss-loader` → `cosmiconfig` → `js-yaml` |
| `karma` | direct | — |
| `karma-jasmine` | direct | — |
| `karma-jasmine-html-reporter` | direct | — |
| `micromatch` | transitive | `fast-glob`, `http-proxy-middleware`, `tailwindcss` → `micromatch` |
| `node-forge` | transitive | `webpack-dev-server` → `selfsigned` → `node-forge` |
| `pacote` | transitive | `@angular/cli` → `pacote` |
| `postcss` | transitive | `@angular/build` → `beasties` / `vite` → `postcss` |
| `selfsigned` | transitive | `webpack-dev-server` → `selfsigned` |
| `serialize-javascript` | transitive | `copy-webpack-plugin` → `serialize-javascript` |
| `sigstore` | transitive | `@angular/cli` → `pacote` → `sigstore` |
| `source-map-js` | transitive | `postcss`, `sass`, `source-map-loader` → `source-map-js` |
| `tailwindcss` | direct | `tailwindcss` (via `chokidar`, `fast-glob`, `micromatch`, `postcss-nested`, `postcss-selector-parser`) |
| `vite` | transitive | `@angular/build` → `vite` |
| `webpack-dev-middleware` | transitive | `webpack-dev-server` → `webpack-dev-middleware` |
| `webpack-dev-server` | transitive | `@angular-devkit/build-angular` → `@angular-devkit/build-webpack` → `webpack-dev-server` |

### Verification results

| Check | Result |
| --- | --- |
| `npm run build` | pass; post-build secret scan OK |
| Initial bundle | 746.60 kB raw / 172.80 kB estimated transfer; `dist/cost-management-app/browser` 1,180,338 bytes |
| `npm test -- --watch=false` | pass, 5 of 5 (Karma, Chrome Headless) |
| `npm run test:e2e` | pass, 8 of 8 (4 cases × Desktop Chrome and Mobile Pixel) |

## Phase notes

- **Phase 1 (2026-10-06):** after the patches `npm audit` reports 2 critical (`piscina`, `tar`), 27 high, 14 moderate, 2 low. Cloudflare Workers Builds for the branch ran on `nodejs@24.21.0`; `npm ci`, build and bundle scan passed. The branch deploy step failed with `Authentication error [10000]` because the non-production build trigger still holds an old, invalid build token (production trigger uses the new one). The preview was verified through a locally uploaded version (`wrangler versions upload`, version `911ca2fa`). Fixing the preview trigger token is outside this change. Playwright 1.63 (from `npm update`) required `npx playwright install chromium` locally.
- **Phase 2 (2026-10-06):** Angular 20.3.33, `@angular/cli` and `@angular/build` 20.3.38; `@angular-devkit/build-angular` removed by the `use-application-builder` migration (it briefly installed `@angular/build@22.2.1` via a temporary CLI, re-pinned to `^20.3`). `ng update` set TypeScript to `~5.9.3` instead of the planned 5.8; Angular 20.3 accepts `>=5.8 <6.0` and Phase 3 needs 5.9. The migration also added default `schematics` entries to `angular.json`. Optional `control-flow-migration` and `router-current-navigation` were not run. `npm audit`: 0 critical, 9 high (`@angular/build`, Karma chain: `karma`, `karma-jasmine`, `karma-jasmine-html-reporter`, `braces`, `chokidar`; Tailwind chain: `tailwindcss`, `fast-glob`, `micromatch`), 5 moderate, 0 low. Initial bundle 753.60 kB raw / 174.73 kB transfer.
- **Phase 2 manual checks (agent):** regression smoke (`/tmp/smoke/smoke.mjs`, Desktop Chrome and Pixel 7) against the Angular 19 preview `911ca2fa` and local Angular 20: identical KPI values before/after adding an expense and after reload, Safe-to-Spend in viewport, FAB on mobile, refresher, sliding items, no console errors; first-screen screenshots identical.
- **Phase 3 (2026-10-06):** Angular, `@angular/cli` and `@angular/build` 21.2.25, TypeScript 5.9.3, zone-based change detection kept. The v21 control-flow migration ran automatically; templates already used block syntax, so it only removed unused `CommonModule` imports from 10 components (blank-line leftovers tidied). `npm audit`: 0 critical, 9 high (`@angular/build`, `braces`, `chokidar`, `fast-glob`, `karma`, `karma-jasmine`, `karma-jasmine-html-reporter`, `micromatch`, `tailwindcss`), 5 moderate, 0 low. Initial bundle 758.96 kB raw / 175.67 kB transfer (+1.7% vs baseline). Regression smoke against the Angular 19 preview: identical KPI values and identical screenshots for a production-configuration build; the dev server differs only in the trend-chart fill after a redraw.
- **Phase 4 (2026-10-06):** Angular, `@angular/cli` and `@angular/build` 22.2.1, TypeScript 6.0.3, `zone.js` 0.15, `@ionic/angular` 8.8.19 with no peer errors; zone-based change detection kept. v22 migrations: `changeDetection: ChangeDetectionStrategy.Eager` added to 22 components to keep the pre-v22 default (v22 defaults to OnPush); `nullishCoalescingNotNullable` and `optionalChainNotNullable` extended diagnostics suppressed in `tsconfig.app.json` and `tsconfig.spec.json`; `istanbul-lib-instrument` added as a devDependency for the Karma builder (removed with Karma in Phase 6). `npm audit`: 0 critical, 9 high, 5 moderate, 0 low. `@angular/build` is still listed, but only through its optional `karma` peer (`braces` DoS via `karma` → `chokidar`); it has no advisory of its own and is re-checked after Karma is removed in Phase 6. Initial bundle 761.92 kB raw / 172.59 kB transfer (+2.1% vs baseline). Regression smoke (production configuration) against the Angular 19 preview: identical KPI values, Safe-to-Spend in viewport, Ionic refresher/FAB/sliding items/icons, folder filter, no console errors, identical screenshots.
- **Phase 5 (2026-10-06):** `@ionic/angular` and `@ionic/core` 9.0.6, `ionicons` 8.1.0, no peer errors. `npx @ionic/migrate` bumped the package and rewrote 9 `@ionic/angular/standalone` imports to `@ionic/angular` (Ionic 9 has no `./standalone` export, so the plan's "standalone imports stay" is kept as standalone components imported from the new default path). Range pinned to `^9.0.6`. See "Ionic 9 review" below. Initial bundle 715.78 kB raw / 164.52 kB transfer (−4.1% vs baseline). Regression smoke (production configuration) against the Angular 19 / Ionic 8 preview: no differences and identical screenshots. Ionic interaction check on Pixel 7 (refresher and FAB hydrated, ionicon SVGs rendered, sliding item opens to 80 px showing "Usuń" and closes to 0): identical results and an identical screenshot of the open sliding item.
- **Phase 6 (2026-10-06):** `ng update @angular/cli --name migrate-karma-to-vitest` switched the `test` target to `@angular/build:unit-test` (runner `vitest`, `buildTarget: :build:testing`), added a `testing` build configuration that keeps the `zone.js` and `zone.js/testing` polyfills, set `tsconfig.spec.json` types to `vitest/globals` and added `vitest` ^5.0.0 (5.0.3 installed). `jsdom` ^30.1.2 added; `karma`, `karma-*`, `jasmine-core`, `@types/jasmine` and the temporary `istanbul-lib-instrument` removed (162 packages). `refactor-jasmine-vitest` converted `toBeFalse`/`toBeTrue`/`expectAsync(...).toBeRejectedWithError` in `supabase-client.service.spec.ts` but re-indented the file to 4 spaces, so the three assertion changes were applied by hand instead; its report file was deleted. Vitest: 2 files, 5 of 5 tests (same as Karma). `npm test -- --watch=false --include <path>` runs only the named spec. Deliberate-break check: changing the rejection message in `supabase-client.service.ts` turned the converted `rejects.toThrowError` assertion red; file restored. `npm audit`: 0 critical, 5 high (Tailwind 3 chain only: `tailwindcss`, `braces`, `chokidar`, `fast-glob`, `micromatch`), 5 moderate, 0 low; `@angular/build` no longer listed, closing the Phase 4 note.

## Ionic 9 review

Sources: https://ionicframework.com/docs/updating/9-0 and the Version 9.x section of `BREAKING.md` in `ionic-team/ionic-framework`, checked against `@ionic/angular` 9.0.6 and a dry run of `npx @ionic/migrate`. The app uses `ion-app`, `ion-content`, `ion-refresher`/`ion-refresher-content`, `ion-fab`/`ion-fab-button`, `ion-list`, `ion-item`, `ion-item-sliding`/`ion-item-options`/`ion-item-option` and `ion-icon`.

- **Standalone imports become the default path** — `src/app/app.component.ts`, `src/app/app.config.ts`, `analytics`, `budget-main`, `budget-transactions`, `budgets`, `dashboard`, `expenses`, `settings` components: change `@ionic/angular/standalone` to `@ionic/angular` (9.x no longer exports `./standalone`). Components stay standalone; no visible change. Applied with `npx @ionic/migrate`.
- **Zoneless by default** — `src/app/app.config.ts`: not affected; the app keeps `provideZoneChangeDetection({ eventCoalescing: true })` and the `zone.js` polyfill.
- **OnPush by default on Angular 22** — all components: already handled in Phase 4 (`ChangeDetectionStrategy.Eager`); no `ionView*` lifecycle hooks in use.
- **Minimum Angular 18, TypeScript 5.4, Node `^24.15`** — met (Angular 22.2.1, TypeScript 6.0.3, Node 24.21.0).
- **Module resolution / package exports** — `tsconfig.json` already uses `moduleResolution: "bundler"`; only documented subpaths are imported (`@ionic/angular`, `@ionic/angular/css/*.css`).
- **CSS `~` prefix removed** — `src/styles.css`: not used; imports already omit `~`.
- **Browser support (Chrome/ChromeAndroid 89+, Safari/iOS 16+)** — no `browserslist` file; Angular 22 defaults are stricter than these minimums. No change.
- **Capacitor 7+ required for native detection** — met (Capacitor 8.5.2); `isPlatform`/`getPlatforms` not used.
- **`ion-input`/`ion-searchbar` `autocorrect`, floating labels and DOM restructuring of `ion-input`/`ion-select`/`ion-textarea`** — not used (forms use native inputs).
- **`ion-img` deprecation, legacy picker removal, `ion-modal` `handleBehavior`, `ion-nav` router integration, `ion-router-outlet` `swipeGesture`, `ion-select` `ionChange`** — not used.
- **`IonicModule` deprecation** — not used; the app uses `provideIonicAngular()`.
- **`ionicons`** — stays `^8.1.0`, which satisfies `@ionic/angular` 9.0.6 (`^8.0.13`).

No breaking change requires a visible UI or behaviour change.
