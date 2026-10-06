# Repository Guidelines

Portfel Bez Spiny is an Angular 22/Ionic 9 personal-finance dashboard for web and Capacitor. It separates routine spending from planned occasions. It requires Node 24 (see `.nvmrc`).

## Non-negotiable Product Rules

- Never let occasion or project expenses trigger the daily-budget warning state. Keep these financial streams isolated.
- Keep Safe-to-Spend and its warning state visible without scrolling on the Pixel 7 viewport. Do not add screens, navigation, or confirmation steps to expense entry unless required by the PRD.
- Keep persistence behind repository boundaries. Components must not call LocalStorage or the Supabase client directly.
- For UI, Capacitor plugin, or native configuration changes, run `npm run cap:build:apk` before handoff.
- Read @context/foundation/prd.md for product decisions and @context/changes/stabilize-and-supabase-mvp/change.md for the current delivery plan.
- Use only the Supabase URL and publishable key in clients. Never bundle a service-role key.

## Essential Commands

Use the scripts defined in @package.json. Follow @README.md for startup and verification commands. The required validation scope is defined under Testing and Delivery below.

## Project Structure and Conventions

Place domain models, repository abstractions, and stateful services under `src/app/core/`. Put lazy-loaded user flows in `src/app/features/` and reusable UI in `src/app/shared/`. Treat `src/app/core/models/budget-app.model.ts` and `src/app/core/services/budget-state.service.ts` as prototype references until the canonical consumer-finance contract is selected.

Create standalone Angular components. Use Signals for local reactive state and do not introduce NgModules. Follow @tsconfig.json and @.editorconfig. Name source files in kebab case and tests `*.spec.ts`.

Treat `src/` as the shared application source and @capacitor.config.ts as the web/native bridge source. Do not edit `dist/` or copied web assets under `android/`; regenerate them with `npm run cap:sync`.

## Testing and Delivery

Co-locate unit tests with source files. Keep browser flows in `e2e/`; use @e2e/budget-dashboard.spec.ts as the reference suite. Unit tests run on Vitest through `@angular/build:unit-test`; use Vitest `expect` matchers, not Jasmine ones. Run one unit file with `npm test -- --watch=false --include <path>` or one browser case with `npx playwright test -g "<title>"`. Do not commit focused Playwright tests because CI mode enables `forbidOnly`.

No repository CI workflow or lint script is configured. Before handing off changes, run unit tests covering edited files, affected Playwright scenarios, and `npm run build`. Do not report a green baseline until the stale unit assertion and Mobile Pixel expense-entry failure documented in @context/foundation/health-check.md are fixed. Use an imperative commit subject no longer than 72 characters, for example `Plan stabilization and Supabase MVP`.
