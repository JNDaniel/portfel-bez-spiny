---
project: cost-management-app
checked_at: 2026-09-17T13:43:00Z
health_status: critical-issues
context_type: brownfield
language_family: js
stack_assessment_available: true
checks_run:
  - lockfile
  - dependency_audit
  - outdated_deps
  - test_runner
  - ci_cd
  - configuration
audit_findings:
  critical: 1
  high: 18
  moderate: 18
  low: 2
test_runner_detected: true
ci_provider: null
recommended_fixes: 8
---

## Dependency Health

### Lockfile

Status: present (`package-lock.json`)
Package manager: npm

### Security Audit

Tool: `npm audit --json`
Summary: 1 CRITICAL, 18 HIGH, 18 MODERATE, 2 LOW
Direct vs transitive: 11 direct, 28 transitive affected packages

#### CRITICAL findings

- **tar** 6.2.1 — includes GHSA-23hp-3jrh-7fpw (decompression/parse denial of service) and several file overwrite/path traversal advisories. It is transitive through `@angular/cli` → `pacote`. Fix: update the Angular toolchain to a supported patched line and confirm with `npm audit`.

#### HIGH findings

- **@angular/common** 19.2.25 — GHSA-48r7-hpm6-gfxm, GHSA-39pv-4j6c-2g6v and GHSA-jhpw-976m-542j cover denial of service and `HttpTransferCache` data leakage/state poisoning. Fix: upgrade Angular as one coordinated framework update.
- **@angular/compiler** 19.2.25 and **@angular/core** 19.2.25 — GHSA-jj27-h5hq-8x99 covers i18n cross-site scripting; `@angular/core` is also affected by GHSA-rgjc-h3x7-9mwg. Fix: upgrade all Angular packages together.
- **@angular/cli** 19.2.27 and **@angular-devkit/build-angular** 19.2.27 — direct development dependencies pull in vulnerable build packages. Fix: include them in the coordinated Angular update.
- 13 additional HIGH transitive packages: `@angular/build`, `@xmldom/xmldom`, `fast-uri`, `http-proxy-middleware`, `image-size`, `js-yaml`, `less`, `pacote`, `piscina`, `postcss`, `serialize-javascript`, `sigstore` and `vite`.

MODERATE: 18 affected packages, including six direct dependencies (`@angular/compiler-cli`, `@angular/forms`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/router`, `@capacitor/cli`) and 12 transitive packages.

LOW: two transitive build packages, `@babel/core` and `esbuild`.

### Outdated Dependencies

Packages with major version gaps: 15

- **Angular framework and toolchain**: 19.2.x → 21.2.x for nine direct packages (two major versions behind).
- **jasmine-core**: 5.6.0 → 7.0.2 (two major versions behind).
- **typescript**: 5.7.3 → 7.0.2 (two major versions behind).
- Four packages have a one-major gap: `@angular/platform-browser-dynamic`, `@ionic/angular`, `@types/jasmine` and `tailwindcss`.

Major updates require compatibility and migration review. They must not be applied with an unreviewed `npm audit fix --force`.

## Test Suite

Test runner: Karma/Jasmine and Playwright
Tests found: 3 unit tests and 10 E2E project cases
Test execution: failing

Configuration: `angular.json`, `tsconfig.spec.json`, `playwright.config.ts`
Framework: Karma 6.4.4, Jasmine 5.6, Playwright 1.62

- `npm run test -- --watch=false` fails during TypeScript compilation. `src/app/app.component.spec.ts:20` expects `AppComponent.title`, but `AppComponent` has no `title` property. No unit test executes.
- `npm run test:e2e` runs both configured browser profiles. Nine tests pass. The Mobile Pixel “create a new transaction” test times out waiting for the `Dodaj wydatek` button.

## CI/CD

Provider: not detected
Configuration: not found

| Stage | Status | Notes |
|---|---|---|
| Lint | ✗ | not configured |
| Test | ✗ | not configured |
| Build | ✗ | not configured |
| Type check | ✗ | not configured |
| Security | ✗ | not configured |

ℹ No CI/CD configuration detected. You will set this up in the infrastructure and deployment lesson. For now, reliable local test runners are sufficient for agent collaboration.

## Configuration

### High severity

No high-severity configuration gaps. TypeScript and Angular template strictness are enabled, and `.gitignore` is present.

### Medium severity

- **ESLint configuration and lint script** — no project linter is configured, so agents cannot validate code-quality rules consistently. Fix: add Angular ESLint, its configuration, and a `lint` script.
- **Prettier or Biome configuration** — no project formatter is configured, so formatting depends on editor behavior. Fix: add and pin one formatter with a check script.

### Low severity

- **`.env.example` or `.env.template`** — environment requirements are not documented. Fix: add a secret-free template when backend/authentication environment variables are introduced.

## Stack Assessment Cross-Reference

Stack assessment: `context/foundation/stack-assessment.md`
Agent readiness (from stack-assess): ready-with-compensation

| Quality Gate Gap | Health-Check Finding | Status |
|---|---|---|
| Capacitor web/native boundary is partial | `AGENTS.md` now documents source boundaries and requires `cap:sync` and APK validation | Mitigated |
| Operational verification was previously unknown | Unit and mobile E2E runs currently fail | Reinforced |
| No linter or CI was detected | Health check confirms both are absent | Reinforced |

The recommended Capacitor and local-validation instructions from the stack assessment are already present in `AGENTS.md`.

## Recommended Fixes

### Fix before agent work (Category A)

### 1. Plan a patched Angular toolchain upgrade

**Impact**: A critical transitive `tar` vulnerability and direct Angular security advisories affect the installed dependency tree.
**Severity**: critical
**Effort**: significant (> 1 hour)
**Fix**:

Create a dedicated upgrade change. Use Angular's supported update path rather than forcing npm resolutions:

```bash
npx ng update @angular/core @angular/cli
npm audit
npm run build
npm run test -- --watch=false
npm run test:e2e
npm run cap:sync
```

Review migrations and compatibility before accepting the target major version.

### 2. Repair the stale unit test

**Impact**: The unit suite cannot compile, so agents cannot validate unit-testable changes.
**Severity**: high
**Effort**: quick (< 5 min)
**Fix**:

Update `src/app/app.component.spec.ts` to test the current `AppComponent` contract, then run:

```bash
npm run test -- --watch=false
```

### 3. Stabilize the mobile expense E2E flow

**Impact**: The main expense-entry path is not reliably verifiable on the mobile profile.
**Severity**: high
**Effort**: moderate (15–30 min)
**Fix**:

Inspect why the accessible `Dodaj wydatek` button is absent or hidden for Mobile Pixel, correct the responsive UI or locator, and rerun:

```bash
npx playwright test --project="Mobile Pixel" --grep="create a new transaction"
npm run test:e2e
```

### 4. Add a project linter

**Impact**: Agents have no automated check for Angular and TypeScript code-quality rules.
**Severity**: medium
**Effort**: moderate (15–30 min)
**Fix**:

Add Angular ESLint using the version-compatible schematic, review the generated rules, add an npm `lint` script, and run it before accepting the setup.

### 5. Add a deterministic formatter check

**Impact**: Agent-generated changes can drift from a consistent formatting standard.
**Severity**: medium
**Effort**: quick (< 5 min)
**Fix**:

Install and pin Prettier (or choose Biome), add project configuration plus `format` and `format:check` scripts, then run the check across source and configuration files.

### 6. Plan remaining major dependency migrations

**Impact**: Jasmine, TypeScript, Ionic and Tailwind major gaps increase future migration cost and can block security updates.
**Severity**: medium
**Effort**: significant (> 1 hour)
**Fix**:

Upgrade one ecosystem group at a time, following each project's migration guide. Validate every group with build, unit, E2E and Capacitor synchronization checks.

### Addressed in upcoming lessons (Category B)

### Add continuous integration

**Lesson**: [From Localhost to Production: Infra Research and First Deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)
**What you'll do there**: Add automated build, type, test, lint and security checks once the local commands are reliable.

### Select and document production deployment

**Lesson**: [From Localhost to Production: Infra Research and First Deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)
**What you'll do there**: Choose a deployment target and record a reproducible deployment path for the web/backend surface.

## Summary

Health status: critical-issues

The project has a reproducible npm lockfile, strict TypeScript configuration, clear Angular/Ionic/Capacitor conventions and two configured test layers. It is not currently ready for reliable agent-assisted changes because the dependency tree contains a critical vulnerability, the unit suite does not compile and one mobile E2E flow fails. The Capacitor instruction gap identified by the stack assessment is already mitigated in `AGENTS.md`.

Next step: address the dependency upgrade and failing tests first, then add lint/format checks and proceed to agent onboarding.
