# Repository Guidelines

Portfel Bez Spiny is a personal-finance dashboard built with Angular 19, Ionic 8, TypeScript, Tailwind, and Capacitor. It gives users immediate safe-to-spend feedback while keeping routine spending separate from planned occasions.

## Non-negotiable Product Rules

- Never let occasion or project expenses trigger the daily-budget warning state. Keep these financial streams isolated.
- Preserve one-second comprehension and minimal interaction when changing user flows.
- Keep persistence behind repository boundaries. Components must not call LocalStorage or the Supabase client directly.
- Maintain Capacitor Android compatibility for UI and platform changes.
- Read @context/foundation/prd.md for product decisions and @context/changes/stabilize-and-supabase-mvp/change.md for the current delivery plan.
- Use only the Supabase URL and publishable key in clients. Never bundle a service-role key.

## Essential Commands

- `npm start` serves the app at port 4200.
- `npm run build` creates the production build and enforces Angular bundle and style budgets.
- `npm test` runs Jasmine/Karma unit tests.
- `npm run test:e2e` runs Playwright against desktop Chrome and Pixel 7 profiles.
- `npm run test:e2e:headed` or `npm run test:e2e:ui` supports interactive E2E debugging.
- `npm run cap:sync` copies the web build and updates native dependencies.

## Project Structure and Conventions

Place domain models, repository abstractions, and stateful services under `src/app/core/`. Put lazy-loaded user flows in `src/app/features/` and reusable UI in `src/app/shared/`. Use `src/app/core/models/budget-app.model.ts` and `src/app/core/services/budget-state.service.ts` as the primary domain references.

Follow existing standalone-component and Signals patterns. TypeScript and Angular template strictness are enabled by @tsconfig.json. Use two-space indentation, UTF-8, final newlines, trimmed trailing whitespace, and single quotes in TypeScript as defined by @.editorconfig. Name source files in kebab case and tests `*.spec.ts`.

Treat `src/` as the shared application source and @capacitor.config.ts as the web/native bridge source. Do not edit `dist/` or copied web assets under `android/`; regenerate them with `npm run cap:sync`.

## Testing and Delivery

Co-locate unit tests with source files. Keep browser flows in `e2e/`; use @e2e/budget-dashboard.spec.ts as the reference suite. Run one unit file with `npm test -- --include <path>` or one browser case with `npx playwright test -g "<title>"`. Do not commit focused Playwright tests because CI mode enables `forbidOnly`.

No repository CI workflow or lint script is configured. Before handing off changes, run the relevant tests plus `npm run build`. Recent commit subjects are concise and imperative, for example `Plan stabilization and Supabase MVP`.
