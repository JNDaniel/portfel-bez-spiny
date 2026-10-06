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
