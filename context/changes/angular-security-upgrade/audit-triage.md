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
