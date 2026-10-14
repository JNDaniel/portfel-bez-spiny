<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Rejestracja i logowanie email + hasło

- **Plan**: context/changes/email-password-sign-in/plan.md
- **Scope**: Phase 2 of 3
- **Reviewed phases**: 2
- **Date**: 2026-10-14
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Success criteria were re-run against the uncommitted working tree:
- `npm test -- --watch=false --include src/app/features/auth`: 2 files, 5/5 tests pass.
- `npm run check`: Prettier, ESLint, 14 files with 92/92 tests, build and bundle scan all pass.
- `npm run test:e2e`: 22/22 pass, including test 11 on both projects.
- `npm run cap:build:apk`: passes with JDK 21 (`JAVA_HOME=~/workspace/jdks/jdk-21-temurin`) and outputs `portfel-bez-spiny-debug.apk`. The first run used the default Java 8 and failed with "Run this build using a Java 11 or newer JVM". That failure came from the environment, not the code.
- Manual check 2.7: `.env` has `DATA_BACKEND=local`, which confirms it. Checks 2.5 and 2.6 are ticked but leave no artifact in the diff, so they are taken as reported.

## Findings

### F1 — Empty header wrapper moves the mobile month switcher to the centre in local mode

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/features/budget-app/budget-main.component.ts:127
- **Detail**: The header is `flex justify-between`. Before this change, on mobile the "Dodaj wydatek" button (`hidden sm:flex`) was `display:none`, which left two flex items: the logo on the left and the month navigator on the right. The plan adds the `<div class="flex items-center gap-2">` wrapper, and that wrapper always renders. In local mode on mobile it is empty but is still a third flex item, so the month navigator moves to the centre. Local mode is the default for every deploy. The plan only guarded header height, not this shift, so the plan caused it rather than the implementation drifting. E2E does not catch it.
- **Fix**: Hide the wrapper on mobile when there is nothing to show, e.g. `class="items-center gap-2 sm:flex" [class.flex]="auth.enabled" [class.hidden]="!auth.enabled"`. This restores the previous layout in local mode.
- **Decision**: FIXED — wrapper gets `hidden` when `!auth.enabled` and `sm:flex` restores it on desktop

### F2 — Working tree has unrelated edits that do not belong in the Phase 2 commit

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: .gitignore, AGENTS.md, android/app/build.gradle
- **Detail**: Three changes are outside the plan:
  - `.gitignore` adds `.factory/mcp.json`. The Phase 1 review (F6) already said to keep this out of S-03.
  - `AGENTS.md` adds a "Project State (`context/`)" section.
  - `build.gradle` adds `base.archivesName = "portfel-bez-spiny"`, which renames the APK. No reference to `app-debug.apk` was found outside `android/`, `dist/` and the archive.

  All three are harmless but unrelated to S-03.
- **Fix**: Stage only the Phase 2 files for the S-03 commit and commit these three separately (e.g. `Document context state and rename APK output`).
- **Decision**: FIXED — queued in follow-ups/review-fixes.md: separate commit at S-03 commit time

### F3 — Logout touch target is small and signs out with one tap

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/features/budget-app/budget-main.component.ts:137-146
- **Detail**: The button is `p-1.5` plus an 18px icon, about 30px. Recommended touch targets are 44–48px. It sits next to the month arrows, and a mis-tap signs the user out immediately with no confirmation. The impact is limited today because data stays local, so only the session is lost.
- **Fix**: Enlarge the hit area without growing the header, e.g. `min-w-11 min-h-11 flex items-center justify-center` with `-my-2` to keep the row height.
- **Decision**: FIXED (differently) — button now shows the text "Wyloguj" next to the icon, hit area min-h-11 with -my-1 so header height stays 44px; no double-tap confirmation, so Phase 3 E2E (single click "Wyloguj") stays valid. Moving logout to a menu is planned for a later change. Manual 2.6 (Pixel 7) needs a re-check in supabase mode.

### F4 — `pending` is reset without try/finally

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/features/auth/login.component.ts:82-95, src/app/features/auth/register.component.ts:101-119
- **Detail**: `pending.set(false)` runs only after `await auth.signIn/signUp`. This is safe today because both methods catch everything and always resolve (`auth.service.ts:36-69`). If that contract changed, the button would stay disabled. A hanging request has no timeout either. The specs do not cover the pending reset, the invalid-form early return or `minLength(6)`.
- **Fix**: Wrap the call in `try { … } finally { this.pending.set(false); }` and add one spec for the reset after an error.
- **Decision**: FIXED — try/finally in both forms; spec `re-enables the submit button when sign-in rejects` added

### F5 — Invalid fields give no feedback beyond a disabled button

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/features/auth/login.component.ts:51-57, src/app/features/auth/register.component.ts:52-74
- **Detail**: When the email is malformed or the password is shorter than 6 characters, the submit button is simply disabled. No message says why; register only shows the static hint "Co najmniej 6 znaków.". This matches the plan. Trailing spaces in the email are not a problem: browsers strip them from `type=email` values.
- **Fix**: Show a short field error after `touched` (e.g. `Podaj poprawny adres email.`), or leave as is and revisit in the UI pass.
- **Decision**: FIXED — "Podaj poprawny adres email." after touched in both forms; register hint turns red when the password is too short and touched; spec added

## Triage summary (2026-10-14)

- Fixed: F1, F3 (differently: visible "Wyloguj" label + 44px hit area), F4, F5
- Fixed via follow-up: F2 (separate commit, see follow-ups/review-fixes.md)
- After the fixes: `npm run check` passes (94/94 tests); `npm run test:e2e` 22/22; `npm run cap:build:apk` passes (JDK 21). Pixel 7 in local mode: the header is still 44px tall and the month switcher is back at the right edge.
- Manual check 2.6 repeated by the user in supabase mode (`npm start`): the button with the "Wyloguj" label fits the header.
