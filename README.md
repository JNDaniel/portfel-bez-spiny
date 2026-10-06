# Portfel Bez Spiny

Hybrydowa aplikacja webowa i mobilna do zarządzania osobistymi wydatkami. Jej główna reguła oddziela wydatki okazjonalne od codziennego budżetu, a zachcianki pokazuje osobno bez ukrywania ich wpływu na Safe-to-Spend.

## Status projektu

Obecny kod jest interaktywną makietą opartą na danych lokalnych. Docelowe MVP doda konta użytkowników i trwałe, prywatne dane przez Supabase Auth, Postgres oraz Row Level Security.

Aktualne źródła ustaleń:

- [PRD](context/foundation/prd.md) — zakres produktu, reguły domenowe i zaakceptowane decyzje;
- [notatki kształtowania](context/foundation/shape-notes.md) — kontekst i historia decyzji;
- [plan wdrożenia MVP](context/changes/stabilize-and-supabase-mvp/change.md) — kolejność stabilizacji i integracji Supabase;
- [health check](context/foundation/health-check.md) — znane problemy techniczne i priorytety napraw.

## Zakres MVP

- rejestracja i logowanie emailem oraz hasłem;
- prywatne dane każdego użytkownika;
- miesięczny budżet i CRUD wydatków;
- klasyfikacja wydatku jako codzienny, okazjonalny albo zachcianka;
- dashboard z poprawnym Safe-to-Spend;
- działanie w przeglądarce i przez Capacitor na Androidzie.

Automatyczny import powiadomień bankowych, produkcyjny OCR, funkcje głosowe i AI nie należą do pierwszego MVP.

## Architektura

Frontend używa Angulara 22, Ionic 9, TypeScriptu 6, Tailwinda i Capacitor 8. Wymagany Node 24 (`.nvmrc`). Kod domenowy oraz kontrakty repozytoriów znajdują się w `src/app/core/`, przepływy użytkownika w `src/app/features/`, a współdzielone komponenty w `src/app/shared/`.

Supabase będzie integrowany wyłącznie przez implementacje kontraktów repozytoriów. Komponenty nie powinny wywoływać klienta Supabase bezpośrednio. Klient webowy i mobilny może używać tylko publicznego URL projektu oraz publishable key, nigdy service-role key.

## Uruchamianie i weryfikacja

```bash
npm start
npm run build
npm test -- --watch=false
npm test -- --watch=false --include src/app/app.component.spec.ts
npm run lint
npm run format
npm run format:check
npm run check
npm run test:e2e
npm run cap:sync
npm run cap:build:apk
```

`npm run check` uruchamia kolejno sprawdzenie formatowania (Prettier), lint (Angular ESLint), testy jednostkowe i build; zatrzymuje się na pierwszym błędzie. Testy Playwright (`npm run test:e2e`) uruchamiaj osobno. `npm run format` poprawia formatowanie wszystkich plików.

Jednorazowy commit formatujący jest pomijany przez `git blame` po ustawieniu:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```
