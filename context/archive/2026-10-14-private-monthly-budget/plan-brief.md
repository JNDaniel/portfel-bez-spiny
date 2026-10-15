# Prywatny budżet miesięczny w Supabase — Plan Brief

> Full plan: `context/changes/private-monthly-budget/plan.md`
> Research: `context/changes/private-monthly-budget/research.md`

## What & Why

S-04 (FR-003, FR-002): zalogowany użytkownik ustawia miesięczny limit, który przetrwa ponowne otwarcie aplikacji i jest widoczny wyłącznie na jego koncie. To pierwsza tabela użytkownika, więc tu powstaje wzorzec dla S-05 i S-06: migracja z RLS, test dwóch użytkowników, adapter i wybór providera.

## Starting Point

Kontrakt `MonthlyBudgetRepository` (`list`, `setLimit`) jest gotowy i asynchroniczny, ale `app.config.ts:28-30` wiąże na sztywno adaptery LocalStorage. Logowanie działa (S-03). `BudgetStateService` ładuje dane raz i nie reaguje na zmianę konta. W bazie jest tylko migracja bazowa i nie ma testów bazy. Prod i Preview działają z `DATA_BACKEND=local`.

## Desired End State

Przy `DATA_BACKEND=supabase` limit jest zapisywany w `monthly_budgets` z RLS. Wraca po przeładowaniu i w nowej przeglądarce. Inne konto go nie widzi ani przez UI, ani przez API. Zmiana konta, także po wylogowaniu w innej karcie, nigdy nie pokazuje danych poprzedniego. Tryb `local` działa jak dziś.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zapis `effective_from` | Kolumna `date` bez ograniczenia „1. dzień”; adapter zapisuje `YYYY-MM-01` | Baza sama waliduje datę, typ zgadza się z przyszłymi datami wydatków i pozostaje otwarta droga do limitu od innego dnia | Plan (użytkownik) |
| Test izolacji | pgTAP przez `npm run test:db` + jeden spec E2E dwóch kont | pgTAP testuje każdą politykę bezpośrednio, a E2E dowodzi resetu stanu w UI | Plan |
| Okres przejściowy | Do Supabase idzie tylko budżet; wydatki i foldery lokalnie do S-05/S-06 | Najmniejszy krok bez kodu do wyrzucenia; mieszany stan widać tylko lokalnie i w `test:e2e:auth` | Plan (fakt `DATA_BACKEND=local` na prod i Preview: deploy-plan) |
| Migracja zdalna | Staging w S-04, prod w S-08 | Wcześnie wychodzą różnice lokalny/zdalny; prod czeka na decyzję o planie i backupach | Plan |
| Własność wiersza | `user_id default auth.uid()` + RLS `(select auth.uid()) = user_id` na 4 operacjach | Model domenowy nie zna użytkownika, autoryzację egzekwuje baza | Research |
| Wybór implementacji | Jedna funkcja `provideRepositories()` według `DATA_BACKEND` | S-05 i S-06 zmieniają jedną linię | Research / deploy-plan |
| Cykl życia stanu | Reset i reload przy każdej zmianie `AuthService.userId`; spóźnione wyniki odrzucane | Działa tak samo w karcie, która nie zainicjowała zdarzenia (lekcja cross-tab) | Research / lessons |
| MVP bez maili, plan Supabase | Poza S-04 | Rozstrzygnięte w research §12; blokuje S-08 | Research |

## Scope

**In scope:**
- Migracja `monthly_budgets` z constraintami, uprawnieniami, czterema politykami RLS i triggerem `updated_at`
- Test pgTAP dwóch użytkowników i `anon`, skrypt `test:db`
- `SupabaseMonthlyBudgetRepository`, `provideRepositories()` i testy jednostkowe
- `AuthService.userId` oraz reset i reload `BudgetStateService` z testami
- Spec E2E `monthly-budget` (trwałość, dwa konta, inna karta)
- README, AGENTS.md, deploy-plan; `db push` na staging

**Out of scope:**
- Wydatki i foldery w Supabase (S-05, S-06), izolacja LocalStorage per użytkownik
- Prod: migracja i `DATA_BACKEND` (S-08)
- Zmiany UI, stany ładowania, `cap:build:apk`
- SMTP, potwierdzanie maila, seed

## Architecture / Approach

Dashboard → `BudgetStateService`, który obserwuje `AuthService.userId`. Serwis woła `MonthlyBudgetRepository`, a implementację (Supabase albo Local) wybiera `provideRepositories()`. Adapter Supabase używa `SupabaseClientService`, a dane trafiają przez PostgREST do `monthly_budgets`, gdzie RLS filtruje po `auth.uid()`. Adapter mapuje `date` ↔ `Period` i snake_case ↔ camelCase. Domena i komponenty się nie zmieniają.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Schemat, RLS i pgTAP | Tabela z RLS i `npm run test:db` | Niejawne uprawnienia różnią się lokalnie i zdalnie (rozwiązane jawnym `grant`) |
| 2. Adapter i providery | Budżet w Supabase przy `DATA_BACKEND=supabase` | Upsert bez `user_id` w payloadzie (zapasowo: `user_id` z sesji) |
| 3. Cykl życia stanu | Brak danych poprzedniego konta po zmianie użytkownika | Wyścig spóźnionej odpowiedzi (licznik generacji) |
| 4. E2E, dokumentacja, staging | Dowód end-to-end i migracja na stagingu | Krok zdalny wymaga akceptacji właściciela |

**Prerequisites:** S-02 i S-03 zamknięte; Docker z lokalnym stackiem (`npx supabase start`); dostęp właściciela do projektu staging.
**Estimated effort:** ok. 6–9 h w 3–4 sesjach (4 fazy).

## Open Risks & Assumptions

- Wartość `DATA_BACKEND` w Workers Builds opiera się na dokumentacji (`deploy-plan.md:25`). Panelu nie sprawdzano.
- Lokalnie przy `DATA_BACKEND=supabase` dwa konta nadal widzą wspólne wydatki i foldery do S-05/S-06.
- `effective_from` bez checku dnia: inny klient mógłby zapisać datę spoza 1. dnia, a domena ją zaokrągli do miesiąca. Aplikacja zawsze zapisuje 1. dzień.

## Success Criteria (Summary)

- Limit wraca po przeładowaniu i w nowej przeglądarce, wyłącznie na koncie właściciela.
- `npm run test:db` dowodzi izolacji każdej polityki dla dwóch użytkowników, a `npm run test:e2e:auth` dowodzi jej w UI, także przy wylogowaniu w innej karcie.
- `npm run check` i `npm run test:e2e` są zielone; tryb `local` bez zmian.
