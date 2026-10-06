# Lint and Format Checks — Plan Brief

> Full plan: `context/changes/lint-and-format-checks/plan.md`

## What & Why

Add Prettier and Angular ESLint as local quality gates and one `npm run check` command, so every later change (S-02 onwards) is written and verified against the same deterministic rules instead of editor habits. Roadmap F-02; S-08 requires green quality gates before production data.

## Starting Point

No linter or formatter exists; `.editorconfig` is the only style source and the code mixes quote styles. A trial run found 108 lint errors in 29 files with the generated Angular ESLint config, and 52 files that Prettier would reformat.

## Desired End State

`npm run format:check`, `npm run lint` and the combined `npm run check` pass on the whole covered tree, AGENTS.md and README tell agents to run them before handoff, and the app looks and behaves exactly as today.

## Key Decisions Made

Decisions were delegated to the agent by the user ("pełne uprawnienia") and are based on the trial run.

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Tools | Prettier 3 + `angular-eslint` 22 (ESLint 10, typescript-eslint 8) + `eslint-config-prettier` | Biome cannot lint Angular templates; this is the Angular CLI's own path |
| Formatter settings | Angular defaults: `singleQuote`, `printWidth: 100`, Angular HTML parser | Matches `.editorconfig` and what `ng new` generates |
| Rule set | Generated config as errors (recommended, stylistic, template recommended + accessibility) | Gives a real gate without inventing custom rules |
| OnPush rule | Turned off with a comment | F-01 deliberately kept Eager change detection and Zone.js; OnPush is a separate migration |
| Existing findings | Fix all in code, no `eslint-disable`, no `warn` downgrades | A gate with known exceptions stops being a gate |
| `close` outputs | Rename to `closed` | Avoids shadowing the DOM `close` event (`no-output-native`) |
| Formatting rollout | One mechanical commit, listed in `.git-blame-ignore-revs` | Keeps blame useful and the diff reviewable |
| Lint scope | `src/**/*.{ts,html}` and `e2e/**/*.ts` | All hand-written TypeScript and templates |
| Combined gate | `npm run check` = format check, lint, unit tests, build; Playwright separate | Fast and deterministic; E2E needs a dev server |
| Hooks / CI | Not added | CI is Parked in the roadmap; hooks can follow with CI |

## Scope

**In scope:** Prettier config and one-shot formatting; Angular ESLint config and fixes; `lint`, `format`, `format:check`, `check` scripts; `.git-blame-ignore-revs`; AGENTS.md and README updates.

**Out of scope:** OnPush/zoneless migration; pre-commit hooks and CI; Markdown formatting under `context/`/`docs/`; Stylelint and Tailwind class sorting; any visual or behaviour change.

## Architecture / Approach

Formatter first, then linter with `eslint-config-prettier` so the two never conflict. Each phase is checked with build, Vitest, Playwright and the pixel-exact regression smoke against production.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Prettier and one-shot formatting | `format`/`format:check`, whole tree formatted | Template whitespace changes rendering (caught by pixel smoke) |
| 2. Angular ESLint and minimal fixes | `npm run lint` green with 0 errors | Label/keyboard fixes or the `closed` rename alter behaviour |
| 3. Check script, docs and handoff | `npm run check`, blame-ignore, AGENTS/README | Docs drift from real commands |

**Prerequisites:** F-01 done (Angular 22, TypeScript 6, Node 24).
**Estimated effort:** one session, 3 phases.

## Open Risks & Assumptions

- Prettier's `css` whitespace sensitivity keeps inline spacing; the smoke proves it per phase.
- Some `any` replacements in prototype code (`dashboard`, `budgets`, `settings`) may need `unknown` plus narrowing rather than a model type.

## Success Criteria (Summary)

- One command, `npm run check`, tells an agent whether a change is ready.
- Formatting and lint rules are enforced without exceptions in the code.
- Users see no difference in the app.
