# Implementation review: lint-and-format-checks

- Reviewed phases: 1–3
- Date: 2026-10-06
- Mode: manual (`/10x-impl-review` not installed)
- Scope: `git diff b5450df..c7b9fcb` (excluding `package-lock.json`)
- Verdict: approved; one open item (3.6, production build after push)

## Plan conformance

| Plan item | Result |
| --- | --- |
| Prettier pinned exactly, `.prettierrc.json` (single quotes, width 100, Angular HTML parser) | Matches (3.9.9) |
| `.prettierignore` skips generated, native, vendored and docs content | Matches: `android`, `dist`, `.angular`, `coverage`, Playwright output, `supabase`, `package-lock.json`, `context`, `docs`, `*.md` |
| One-shot formatting in its own commit, hidden from blame | Matches: 0d04682 only formats; full SHA in `.git-blame-ignore-revs`; README documents `blame.ignoreRevsFile` |
| Angular ESLint flat config with recommended, stylistic, template and accessibility sets | Matches (`angular-eslint` 22.5, `typescript-eslint` 8.69, ESLint 10) |
| `eslint-config-prettier` last, so lint never fights formatting | Matches |
| Only one rule override, with a reason | Matches: `prefer-on-push-component-change-detection` off, commented (Eager + Zone.js decision from F-01) |
| No `eslint-disable`, no `any` left in `src/` or `e2e/` | Matches (searched) |
| `lint` covers `src/**/*.ts`, `src/**/*.html` and `e2e/**/*.ts` | Matches (`angular.json` lint target) |
| `npm run check` = format:check → lint → unit tests → build | Matches; deliberate misformat and deliberate `any` each made it exit 1 |
| AGENTS.md and README describe the gate | Matches; the "no lint script" sentence is gone |

## Behaviour review of Phase 2 fixes

- **Output rename `close` → `closed`** (`app-modal`, `expense-form-modal`): every binding was updated; nothing still binds `(close)`. Checked against production on the expenses page: the X button, Cancel, backdrop click and Escape all close the modal on Desktop and Pixel 7, the same as before.
- **Dashboard add modal** (`budget-add-modal`): the X and Cancel buttons close it. Backdrop click and Escape do not, and they did not on production either. No behaviour was added.
- **Destructuring omit → copy and `delete`** (`budget-state.service`, `budget-transactions`): same result, a new object without `folderId`/`folderName`; the source object is not mutated.
- **Removed unused parameters** (`triggerSampleBankNotification(bank)`, `simulateOcrScan(customFileName)`, `startLongPress(event)`): none was read in the body, and the build would have failed if a caller still passed one.
- **Typed events** (`Event` + `HTMLInputElement` cast, `RefresherCustomEvent`, `unknown` in catch): same runtime paths. The existing `if (file)` guards still handle an empty selection.
- **New keyboard access:** the scanner drop area and transaction rows got `role="button"`, `tabindex="0"` and Enter/Space handlers. The handlers ignore key events from nested controls, so a nested button or checkbox does not also toggle the row. This adds tab stops but changes nothing for mouse or touch.
- **Label/control associations:** added `for`/`id` pairs. Tag and emoji pickers use `<span>` with `role="group"` and `aria-labelledby`, plus `leading-[normal]` so the span keeps the label's 14 px line height. Screenshots are identical to production.

## Verification

- Gates: `npm run check` passes (format, lint, Vitest 5 of 5, build 715.82 kB initial, secret scan); Playwright 8 of 8.
- Visual: every route plus the add and folder modals on Desktop and Pixel 7 in the production configuration, compared with the live deployment: identical. The only exception is the Pixel 7 dashboard trend chart, which also varies between repeated runs against production itself (animation timing).

## Notes

- `capacitor.config.ts` changed only in formatting (trailing commas). `npm run cap:build:apk` is still blocked as recorded under roadmap S-07, so it was not run.
- `budget-transactions` rows contain nested interactive elements inside a `role="button"`. The lint rules accept this. A future UI pass may want a different structure.
