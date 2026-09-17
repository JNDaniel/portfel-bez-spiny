---
project: cost-management-app
assessed_at: 2026-09-17T14:29:13+02:00
agent_readiness: ready-with-compensation
context_type: brownfield
stack_components:
  language: TypeScript 5.7
  framework: Angular 19.2 + Ionic 8.8 + Capacitor 8.5
  build_tool: Angular CLI 19.2
  test_runner: Karma 6.4 + Jasmine 5.6 + Playwright 1.62
  package_manager: npm
  ci_provider: null
  deployment_target: null
gates_passed: 14
gates_failed: 1
---

## Stack Components

**TypeScript 5.7.** Projekt używa TypeScriptu z włączonym `strict`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` i rygorystycznym sprawdzaniem szablonów Angulara. Źródła: `package.json`, `tsconfig.json`.

**Angular 19.2.** Główny framework aplikacji narzuca strukturę projektu, buildery, konfiguracje środowisk i sposób uruchamiania testów. Projekt stosuje komponenty standalone oraz Angular Signals. Źródła: `package.json`, `angular.json`, `AGENTS.md`.

**Ionic 8.8.** Warstwa komponentów mobilnych działa razem z Angularem i jest objęta istniejącymi konwencjami projektu dotyczącymi interakcji mobilnych. Źródła: `package.json`, `AGENTS.md`.

**Capacitor 8.5.** Most do platformy mobilnej ma jawną, typowaną konfigurację oraz skrypty synchronizacji i budowania APK. Granica między kodem webowym, konfiguracją mostu i projektem natywnym wymaga jednak dodatkowych instrukcji dla agenta. Źródła: `package.json`, `capacitor.config.ts`, katalog `android/`.

**Angular CLI 19.2.** Budowanie i uruchamianie korzysta ze standardowych builderów Angulara. Konfiguracja produkcyjna zawiera budżety rozmiaru i hashowanie wyników. Źródła: `package.json`, `angular.json`.

**Karma/Jasmine i Playwright.** Testy jednostkowe są skonfigurowane przez builder Angulara, a testy E2E obejmują widok desktopowy i mobilny. Źródła: `angular.json`, `tsconfig.spec.json`, `playwright.config.ts`, `e2e/budzet-app.spec.ts`.

**Narzędzia projektu.** npm jest potwierdzony przez `package-lock.json`. `.editorconfig` definiuje podstawowe formatowanie. Nie wykryto konfiguracji lintera, CI/CD ani celu wdrożenia.

Backend nie jest obecnie komponentem stosu. Ma powstać później, ale nie został jeszcze zaplanowany, więc nie jest oceniany ani wybierany w tym dokumencie.

## Quality Gate Assessment

| Component | Typed | Convention | Training Data | Documented | Verdict |
|---|---:|---:|---:|---:|---|
| TypeScript 5.7 | ✓ | — | — | — | pass |
| Angular 19.2 | — | ✓ | ✓ | ✓ | pass |
| Ionic 8.8 | — | ✓ | ✓ | ✓ | pass |
| Capacitor 8.5 | — | ~ | ✓ | ✓ | partial |
| Angular CLI 19.2 | — | ✓ | ✓ | ✓ | pass |
| Karma/Jasmine + Playwright | — | — | ✓ | ✓ | pass |

Legend: ✓ = spełnione, ✗ = niespełnione, ~ = częściowe, — = nie dotyczy.

### Gate Details

**Bezpieczeństwo typów — spełnione.** `tsconfig.json` ustawia `strict: true` oraz dodatkowe kontrole kompilatora. `angularCompilerOptions` włącza rygorystyczne sprawdzanie parametrów DI, dostępów wejściowych i szablonów. `capacitor.config.ts` używa typu `CapacitorConfig`.

**Konwencje — spełnione z jedną uwagą.** `angular.json` i struktura `src/app/core` oraz `src/app/features` opisana w `AGENTS.md` zapewniają przewidywalny układ. Ionic dziedziczy konwencje integracji z Angularem. Capacitor jest częściowy: `capacitor.config.ts` i skrypty npm są jawne, ale sam most web/native nie narzuca agentowi, które artefakty są źródłowe, które generowane i kiedy wymagana jest synchronizacja.

**Popularność w ekosystemie — spełnione.** TypeScript, Angular, Ionic, Capacitor, Karma, Jasmine i Playwright są rozpoznawalnymi narzędziami w ekosystemie JavaScript/TypeScript. Ocena jest dokonywana w obrębie tej rodziny językowej.

**Dokumentacja — spełnione.** Wszystkie wykryte komponenty mają oficjalną dokumentację odpowiadającą wskazanym wersjom. Konkretne wersje są zapisane w `package.json`, a `tsconfig.json` wskazuje oficjalne materiały TypeScriptu i Angulara.

## Gaps & Compensation

### Granica web/native w Capacitorze

**Luka:** agent może poprawnie zmienić aplikację webową, ale pominąć synchronizację projektu mobilnego, potraktować wygenerowane artefakty jako źródło albo nie uruchomić walidacji APK.

**Wpływ:** zmiana może działać w przeglądarce, lecz nie trafić do aplikacji mobilnej albo uszkodzić istniejącą konfigurację natywną.

**Kompensacja:** `AGENTS.md` już wymienia komendy mobilne, ale powinien jawnie opisywać granicę źródeł i wymagane kontrole po zmianach.

### Luki operacyjne do dalszego sprawdzenia

Nie wykryto konfiguracji lintera, CI/CD ani celu wdrożenia. Nie są to braki samego stosu względem ocenianych kryteriów, ale ograniczają automatyczne wykrywanie regresji. Powinny zostać zweryfikowane podczas kontroli kondycji projektu.

### Recommended Instruction File Additions

Poniższy blok jest gotowy do wklejenia do `AGENTS.md`:

```markdown
## Capacitor source and validation boundaries

- Treat `src/` as the source of truth for shared application behavior and `capacitor.config.ts` as the source of truth for the web/native bridge.
- Do not edit `dist/` or web assets copied into the native project as source files; regenerate them through the documented build and sync commands.
- After any change affecting the mobile experience, run `npm run cap:sync`.
- After changes to Capacitor plugins, native configuration, or files under `android/`, run `npm run cap:sync` and `npm run cap:build:apk`.
- Preserve `appId`, `webDir`, Android scheme, and existing plugin settings in `capacitor.config.ts` unless the task explicitly changes them.

## Required local validation

- For application changes, run `npm run build`.
- For unit-testable behavior, run `npm run test -- --watch=false`.
- For user-facing flows, run `npm run test:e2e`.
- There is currently no lint script or CI workflow; do not claim lint or CI validation until those checks are configured and run.
```

## Summary

Stos jest gotowy do pracy z agentami po doprecyzowaniu granicy web/native. Jego mocne strony to rygorystyczny TypeScript, silne konwencje Angulara, popularny ekosystem, wersjonowane zależności oraz obecne testy E2E. Główna kompensacja dotyczy Capacitorowego procesu synchronizacji i walidacji aplikacji mobilnej.

Następny krok powinien sprawdzić faktyczny stan zależności, testów, lintera, CI/CD i pokrycia krytycznych przepływów. Wybór backendu pozostaje osobną przyszłą decyzją, ponieważ obecnie nie jest częścią istniejącego stosu.
