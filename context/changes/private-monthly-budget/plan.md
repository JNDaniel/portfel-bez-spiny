# Prywatny budżet miesięczny w Supabase — plan implementacji

## Overview

Roadmapa S-04 (`private-monthly-budget`, FR-003, FR-002). Przy `DATA_BACKEND=supabase` limit miesięczny jest zapisywany w tabeli `monthly_budgets`, chronionej przez RLS. Jest widoczny po ponownym otwarciu aplikacji i wyłącznie na koncie, które go ustawiło. Stan dashboardu czyści się i przeładowuje przy każdej zmianie zalogowanego użytkownika. Dzieje się tak także wtedy, gdy wylogowanie przyszło z innej karty. To pierwsza tabela użytkownika i wzorzec, który powtórzą S-05 (wydatki) i S-06 (foldery): migracja z RLS i testem pgTAP, adapter z mapowaniem, wybór providera w jednym miejscu, scenariusz E2E dwóch kont.

## Current State Analysis

Szczegóły i odwołania są w `context/changes/private-monthly-budget/research.md`. Tutaj tylko to, co wyznacza zakres:

- Kontrakt `MonthlyBudgetRepository` ma `list()` i `setLimit(effectiveFrom, limitMinor)` (`src/app/core/repositories/monthly-budget.repository.ts:3-6`) i nie wymaga zmian. Adapter lokalny robi upsert po `effectiveFrom` (`src/app/core/repositories/local/local-monthly-budget.repository.ts:15-31`).
- Model `MonthlyBudget {id, effectiveFrom: Period ('YYYY-MM'), limitMinor, currency: 'PLN'}` (`src/app/core/models/finance.model.ts:54-59`). Limit obowiązuje od `effectiveFrom` do następnego rekordu. Domena wybiera najnowszy `effectiveFrom <= period` (`src/app/core/domain/budget-summary.ts:33-44`).
- Providery są przypięte na sztywno do `Local*` (`src/app/app.config.ts:28-30`).
- `BudgetStateService` ładuje dane raz, w konstruktorze (`src/app/core/services/budget-state.service.ts:243-262`). Po błędzie mutacji wywołuje `reload()` (`:268-275`). Nie reaguje na zmianę użytkownika.
- `AuthService` trzyma sygnał `session` (`src/app/core/auth/auth.service.ts:27`), ale nie ma `userId`. `onAuthStateChange` (`:110-123`) ustawia sesję przy każdym zdarzeniu, także przy zdarzeniach z innych kart.
- Baza ma tylko `supabase/migrations/20261003202153_baseline.sql` z funkcją `public.set_updated_at()`. Wykonanie jest odebrane rolom `public`, `anon` i `authenticated`. Nie ma `supabase/tests/` ani skryptu `test:db`.
- `DATA_BACKEND` to `local` w Production i Preview (`context/deployment/deploy-plan.md:25`). Plan S-03 potwierdza to samo (`context/archive/2026-10-14-email-password-sign-in/plan.md:355`). Panelu Workers Builds nie sprawdzano. Tryb `supabase` działa dziś tylko lokalnie i w `npm run test:e2e:auth` (`playwright.auth.config.ts`, port 4300).

## Desired End State

- Przy `DATA_BACKEND=supabase`:
  - limit ustawiony przez użytkownika A przetrwa przeładowanie, wylogowanie i zalogowanie w nowej przeglądarce;
  - użytkownik B nie widzi limitu A ani go nie zmieni, ani przez UI, ani bezpośrednio przez API z kluczem publishable;
  - zmiana konta w tej samej karcie, także po wylogowaniu w innej karcie, nigdy nie pokazuje danych poprzedniego konta.
- Przy `DATA_BACKEND=local` aplikacja działa dokładnie jak dziś. Wszystkie dotychczasowe testy E2E przechodzą bez zmian i nie ma żądań do Supabase.
- `npm run test:db` (pgTAP) dowodzi izolacji dla każdej polityki SELECT/INSERT/UPDATE/DELETE na dwóch użytkownikach i dla roli `anon`.
- Migracja jest zastosowana lokalnie i na stagingu, ale nie na prod.

### Key Discoveries:

- `budget-limit-modal.component.ts:83` waliduje `Validators.min(1)`, więc w bazie obowiązuje `check (limit_minor > 0)`.
- `supabase/config.toml:23`: `auto_expose_new_tables` jest zakomentowane, a projekty zdalne mogą mieć inne domyślne uprawnienia. Migracja nadaje uprawnienia jawnie.
- `auth.service.spec.ts:10-41` mockuje klienta (`getClient` zwraca fałszywy obiekt i emituje zdarzenia z `stateCallback`). Testy adaptera i cyklu życia stanu powielają ten wzorzec.
- `e2e/auth/auth-flow.spec.ts:6-25` ma helpery `uniqueEmail`, `register`, `signOut` i `signIn` lokalne w pliku. Nowy spec potrzebuje tych samych.
- `SupabaseClientService` ładuje `@supabase/supabase-js` dynamicznie (`supabase-client.service.ts:20-33`). Adapter importuje z biblioteki wyłącznie typy (`import type`), więc bundle trybu `local` nie rośnie.

## What We're NOT Doing

- Wydatki i foldery w Supabase (S-05, S-06). Przy `DATA_BACKEND=supabase` zostają w LocalStorage. Dwa konta w jednej przeglądarce lokalnie dalej widzą wspólne wydatki i foldery. To świadomy stan przejściowy, widoczny tylko lokalnie i w `test:e2e:auth`.
- Prefiks użytkownika w kluczu LocalStorage i czyszczenie danych lokalnych przy wylogowaniu.
- Migracja na prod i zmiana `DATA_BACKEND` w jakimkolwiek deployu (S-08).
- Ograniczenie „1. dzień miesiąca” na `effective_from` i limit liczony od innego dnia niż pierwszy. Kolumna to zwykła `date`, adapter zapisuje 1. dzień miesiąca, a domena nadal operuje na `Period`.
- Zmiany UI, ekranów i stanów ładowania (Phase 7 change.md, S-05+). Dlatego bez `cap:build:apk`.
- SMTP, potwierdzanie maila i plan Supabase (rozstrzygnięte w research §12, blokują S-08).
- Seed `supabase/seed.sql`, na który wskazuje `config.toml`. Testy tworzą swoje dane same.

## Implementation Approach

Kolejność: baza → adapter → stan → E2E. Każda warstwa ma własny test, zanim zacznie na niej polegać następna.

1. RLS jest jedyną autoryzacją, więc najpierw powstaje tabela i test pgTAP, który symuluje dwóch użytkowników przez `request.jwt.claims` na roli `authenticated`.
2. Adapter nie zna `user_id`. Kolumna ma `default auth.uid()`, a polityki pilnują reszty. Model domenowy zostaje bez zmian.
3. Wybór implementacji siedzi w jednej funkcji `provideRepositories()`, a `app.config.ts` tylko ją wywołuje. S-05 i S-06 zmieniają jedną linię w tej funkcji.
4. `BudgetStateService` reaguje na `AuthService.userId` (sygnał wyprowadzony z `session`). Każda zmiana czyści stan i ładuje dane nowego użytkownika. Wynik zapytania rozpoczętego dla poprzedniego użytkownika jest odrzucany. Reakcja zależy wyłącznie od wartości `userId`, a nie od tego, która karta zainicjowała zdarzenie (lekcja „Per-tab auth state vs cross-tab Supabase events”).

## Critical Implementation Details

**Upsert bez `user_id` w payloadzie.** `setLimit` wysyła tylko `effective_from` i `limit_minor`, z `onConflict: 'user_id,effective_from'`. Postgres wypełnia `user_id` wartością domyślną przed sprawdzeniem konfliktu. Ścieżka `ON CONFLICT DO UPDATE` wymaga jednocześnie polityk SELECT i UPDATE. Zachowanie przy powtórnym zapisie w tym samym miesiącu potwierdzają test pgTAP (1.x) i scenariusz E2E (4.x). Jeśli PostgREST nie zastosuje domyślnej wartości w upsercie, adapter dosyła `user_id` z `AuthService.userId()`. Polityka `with check` i tak wymusza zgodność z JWT.

**Wyścig przy zmianie konta.** `reload()` dla użytkownika A może się zakończyć już po przełączeniu na B. To samo dotyczy mutacji wykonywanej przez `run()`. Licznik generacji, zwiększany przy każdej zmianie `userId`, pozwala odrzucić spóźniony wynik albo ponownie zresetować stan. Niezmiennik: po zmianie `userId` w sygnałach nie zostaje żaden rekord pobrany lub zapisany dla poprzedniego użytkownika.

**Indeks na `user_id`.** `unique (user_id, effective_from)` tworzy indeks z `user_id` na pierwszej pozycji. Obsługuje on predykat RLS, więc osobny indeks na `user_id` byłby zbędny. Tabele S-05 i S-06 bez takiego unikatu potrzebują jawnego `create index … (user_id)`.

## Faza 1: Schemat, RLS i testy izolacji w bazie

### Overview

Tabela `monthly_budgets` z RLS oraz test pgTAP dwóch użytkowników uruchamiany przez `npm run test:db`.

### Changes Required:

#### 1. Migracja

**File**: `supabase/migrations/<timestamp>_monthly_budgets.sql` (utworzyć przez `npx supabase migration new monthly_budgets`)

**Intent**: Pierwsza tabela użytkownika. Własność wymusza baza, a nie klient (PRD §Access Control). Plik ma być szablonem dla `expenses` i `expense_folders`.

**Contract**:

- Tabela `public.monthly_budgets`:
  - `id uuid primary key default gen_random_uuid()`;
  - `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`;
  - `effective_from date not null`;
  - `limit_minor integer not null check (limit_minor > 0)`;
  - `currency text not null default 'PLN' check (currency ~ '^[A-Z]{3}$')`;
  - `created_at` i `updated_at timestamptz not null default now()`;
  - `unique (user_id, effective_from)`.
- Trigger `before update … for each row execute function public.set_updated_at()`.
- `alter table … enable row level security`.
- `revoke all on public.monthly_budgets from anon, authenticated`; `grant select, insert, update, delete … to authenticated`.
- Cztery polityki `to authenticated`, każda na predykacie `(select auth.uid()) = user_id`:
  - SELECT: `using`;
  - INSERT: `with check`;
  - UPDATE: `using` + `with check`;
  - DELETE: `using`.
- Krótki komentarz SQL: `effective_from` to dzień, od którego obowiązuje limit, a aplikacja zapisuje 1. dzień miesiąca.

#### 2. Test pgTAP

**File**: `supabase/tests/monthly_budgets_rls.test.sql`

**Intent**: Spełnić wymóg PRD „Every read and write policy is covered by a two-user isolation test” bezpośrednio na politykach, deterministycznie i bez przeglądarki.

**Contract**:

- Jedna transakcja `begin … rollback` z `create extension if not exists pgtap with schema extensions` i `plan(n)`.
- Jako `postgres`: dwóch użytkowników w `auth.users` (stałe UUID) i po jednym wierszu budżetu każdego.
- Przełączanie tożsamości: `set local role authenticated` i `set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true)`. Dla `anon` analogicznie z `role anon`.
- Wymagane asercje (minimum):
  - SELECT: A widzi tylko swój wiersz, B tylko swój;
  - INSERT: A dodaje wiersz bez `user_id`, który dostaje `user_id = A`. A nie wstawi wiersza z `user_id = B` (`42501`);
  - UPDATE: aktualizacja wiersza B przez A zmienia 0 wierszy, a wiersz B jest nietknięty (sprawdzone jako B). A nie przepisze własnego wiersza na `user_id = B` (`42501`). Aktualizacja własnego wiersza zmienia `updated_at`;
  - DELETE: usunięcie wiersza B przez A usuwa 0 wierszy, a wiersz B nadal istnieje;
  - upsert `insert … on conflict (user_id, effective_from) do update` jako A aktualizuje istniejący miesiąc zamiast tworzyć drugi wiersz;
  - constrainty: `limit_minor = 0` → `23514`; drugi wiersz A w tym samym miesiącu bez `on conflict` → `23505`;
  - `anon`: SELECT i INSERT kończą się `42501` (brak uprawnień).

#### 3. Skrypt i dokumentacja komendy

**File**: `package.json`, `README.md` (sekcja „Uruchamianie i weryfikacja”)

**Intent**: Jedna komenda do testów bazy. Wzorem `test:e2e:auth` wymaga działającego lokalnego stacka i nie wchodzi do `npm run check`.

**Contract**: skrypt `"test:db": "supabase test db"`. W README dopisać, że przed uruchomieniem trzeba wykonać `npx supabase start`, a po nowej migracji `npx supabase db reset`.

### Success Criteria:

#### Automated Verification:

- `npx supabase db reset` stosuje obie migracje od zera bez błędów
- `npm run test:db` przechodzi, a każda polityka SELECT/INSERT/UPDATE/DELETE ma co najmniej jedną asercję dwóch użytkowników
- `npm run check` przechodzi

#### Manual Verification:

- W Studio (`http://127.0.0.1:54323`) tabela `monthly_budgets` ma włączone RLS i cztery polityki, a Security Advisor nie zgłasza dla niej ostrzeżeń

**Implementation Note**: Po zielonej weryfikacji automatycznej zatrzymaj się na ręczne potwierdzenie przed fazą 2.

---

## Faza 2: Adapter Supabase i wybór providerów

### Overview

`SupabaseMonthlyBudgetRepository` realizuje istniejący kontrakt. Implementację repozytoriów wybiera jedna funkcja według `DATA_BACKEND`.

### Changes Required:

#### 1. Adapter

**File**: `src/app/core/repositories/supabase/supabase-monthly-budget.repository.ts`

**Intent**: Budżet w Supabase za tym samym kontraktem co adapter lokalny. Mapowanie snake_case ↔ camelCase i `Period` ↔ `date` odbywa się wyłącznie tutaj.

**Contract**:

- `@Injectable() class SupabaseMonthlyBudgetRepository extends MonthlyBudgetRepository`, wstrzykuje `SupabaseClientService`. Z `@supabase/supabase-js` importuje tylko typy.
- `list()`: `select('id, effective_from, limit_minor, currency')` posortowane po `effective_from`, bez filtra `user_id` (filtruje RLS).
- `setLimit(effectiveFrom, limitMinor)`: upsert `{ effective_from: '<YYYY-MM>-01', limit_minor }` z `onConflict: 'user_id,effective_from'`, `.select(...).single()`. Zwraca zmapowany rekord.
- Mapowanie wiersza: `effective_from.slice(0, 7)` → `effectiveFrom`, `limit_minor` → `limitMinor`, `currency` → `'PLN'` (inna wartość to błąd: kontrakt dopuszcza tylko PLN).
- Błąd Supabase (`error`) jest rzucany jako `Error` z komunikatem. `BudgetStateService.run()` już go raportuje i przeładowuje stan.

#### 2. Wybór providerów w jednym miejscu

**File**: `src/app/core/repositories/provide-repositories.ts`, `src/app/app.config.ts`

**Intent**: Zastąpić `app.config.ts:28-30` jedną funkcją, w której S-05 i S-06 przełączą swoje repozytoria (`deploy-plan.md:254`).

**Contract**: `provideRepositories(): Provider[]`. Dla `MonthlyBudgetRepository` `useFactory` czyta `inject(RUNTIME_CONFIG).dataBackend` i tworzy `SupabaseMonthlyBudgetRepository` albo `LocalMonthlyBudgetRepository`. `ExpenseRepository` i `ExpenseFolderRepository` zostają `Local*` z komentarzem „S-05/S-06”. `app.config.ts` wywołuje `...provideRepositories()`.

#### 3. Testy jednostkowe

**File**: `src/app/core/repositories/supabase/supabase-monthly-budget.repository.spec.ts`, `src/app/core/repositories/provide-repositories.spec.ts`

**Intent**: Sprawdzić mapowanie, kształt wywołań i wybór implementacji bez sieci.

**Contract**:

- Fałszywy klient z łańcuchem `from().select().order()` / `upsert().select().single()` wzorem `auth.service.spec.ts:10-41`.
- Przypadki adaptera:
  - `list()` mapuje `'2026-10-01'` → `'2026-10'` i snake_case → camelCase;
  - `setLimit('2026-10', 310000)` wysyła `effective_from: '2026-10-01'`, nie wysyła `user_id` i używa `onConflict: 'user_id,effective_from'`;
  - `error` z klienta kończy się odrzuceniem obietnicy.
- `provideRepositories`: przy `RUNTIME_CONFIG.dataBackend = 'supabase'` wstrzyknięty `MonthlyBudgetRepository` jest instancją adaptera Supabase, przy `local` instancją adaptera lokalnego. Wydatki i foldery są zawsze `Local*`.

### Success Criteria:

#### Automated Verification:

- Nowe testy jednostkowe przechodzą: `npm test -- --watch=false --include src/app/core/repositories`
- `npm run check` przechodzi (build w trybie `local` nie dołącza `@supabase/supabase-js` do głównego chunka; skan sekretów zielony)
- `npm run test:e2e` przechodzi bez zmian w testach

#### Manual Verification:

- Przy `.env` z `DATA_BACKEND=supabase` i lokalnym stackiem (`npm start`) ustawiony limit pojawia się w Studio w `monthly_budgets` z `user_id` zalogowanego konta, a `effective_from` to 1. dzień bieżącego miesiąca
- Po teście ręcznym `.env` wraca do `DATA_BACKEND=local`

**Implementation Note**: Po zielonej weryfikacji automatycznej zatrzymaj się na ręczne potwierdzenie przed fazą 3.

---

## Faza 3: Cykl życia stanu powiązany z tożsamością

### Overview

`BudgetStateService` czyści się i przeładowuje przy każdej zmianie zalogowanego użytkownika, w tym przy `SIGNED_OUT` i `SIGNED_IN` z innej karty. Tryb `local` zostaje bez zmian.

### Changes Required:

#### 1. `AuthService.userId`

**File**: `src/app/core/auth/auth.service.ts`

**Intent**: Jedno źródło tożsamości dla serwisów danych.

**Contract**: `readonly userId = computed(() => this._session()?.user.id ?? null)`. Odświeżenie tokenu (`TOKEN_REFRESHED`) nie zmienia wartości, więc nie powoduje przeładowania.

#### 2. Reset i reload w `BudgetStateService`

**File**: `src/app/core/services/budget-state.service.ts`

**Intent**: Po przejściu na Supabase nie można pokazać cudzego budżetu do czasu przeładowania strony (research §3).

**Contract**:

- Przy `auth.enabled === false` konstruktor wywołuje `reload()` tak jak dziś i nic więcej się nie zmienia.
- Przy `auth.enabled === true` konstruktor nie wywołuje `reload()` bezpośrednio. Efekt śledzi wyłącznie `auth.userId()`, a resztę wykonuje w `untracked`. Przy każdej zmianie wartości, także przy pierwszej:
  - zwiększa licznik generacji;
  - czyści `expenses`, `budgets` i `folderList`;
  - przywraca stan UI do domyślnego: `selectedFolderId`, tryb zaznaczania, `expandedIds`, otwarte modale, `currentPeriod` = bieżący miesiąc;
  - ustawia `loaded = false`;
  - gdy `userId !== null`, wywołuje `reload()`.
- `reload()` zapamiętuje generację na starcie i nie zapisuje wyników ani błędów, jeśli generacja się zmieniła. Przy `enabled` i `userId === null` nie odpytuje repozytoriów.
- `run()`: jeśli generacja zmieniła się w trakcie akcji, stan zostaje ponownie zresetowany dla bieżącego `userId`, zamiast zostawić wynik poprzedniego konta.

#### 3. Testy jednostkowe

**File**: `src/app/core/services/budget-state.service.spec.ts`, `src/app/core/auth/auth.service.spec.ts`

**Intent**: Udowodnić niezmiennik „po zmianie `userId` w stanie nie ma danych poprzedniego konta”, w tym dla zdarzenia z innej karty.

**Contract**:

- Istniejące testy stanu działają bez zmian w trybie `local`, z `AuthService.enabled = false`.
- Nowy `describe` z fałszywym `AuthService` (sygnał `userId`, `enabled = true`) i repozytoriami w pamięci, rozróżniającymi użytkownika.
- Przypadki:
  - A → `null`: stan pusty, brak zapytań;
  - A → B: widoczny tylko budżet B;
  - spóźnione `list()` dla A, rozwiązane po przełączeniu na B, nie nadpisuje stanu B;
  - zmiana `userId` przy tym samym id (odświeżenie tokenu) nie wywołuje `reload()`;
  - otwarty modal limitu i wybrany folder są zamykane i zerowane przy zmianie konta.
- `auth.service.spec.ts`: `userId` zmienia się po `emit('SIGNED_OUT', null)` i `emit('SIGNED_IN', otherSession)`, czyli tak jak przy zdarzeniu z innej karty.

### Success Criteria:

#### Automated Verification:

- Testy stanu i auth przechodzą: `npm test -- --watch=false --include src/app/core/services/budget-state.service.spec.ts` oraz `--include src/app/core/auth/auth.service.spec.ts`
- `npm run check` przechodzi
- `npm run test:e2e` przechodzi bez zmian w testach

#### Manual Verification:

- Przy `DATA_BACKEND=supabase` i lokalnym stacku: dwie karty, wylogowanie w karcie 1. Karta 2 trafia na `/login`, a po zalogowaniu innym kontem nie pokazuje limitu poprzedniego

**Implementation Note**: Po zielonej weryfikacji automatycznej zatrzymaj się na ręczne potwierdzenie przed fazą 4.

---

## Faza 4: E2E dwóch kont, dokumentacja i staging

### Overview

Dowód end-to-end na lokalnym stacku, aktualizacja dokumentów i migracja na zdalnym stagingu.

### Changes Required:

#### 1. Wspólne helpery auth E2E

**File**: `e2e/auth/auth-helpers.ts`, `e2e/auth/auth-flow.spec.ts`

**Intent**: Nowy spec używa tych samych `uniqueEmail`, `register`, `signOut` i `signIn`, bez kopiowania.

**Contract**: przenieść helpery z `auth-flow.spec.ts:3-25` do `auth-helpers.ts` (wraz z `PASSWORD`) i dodać `setLimit(page, amount)` w kształcie z `e2e/budget-dashboard.spec.ts:5-10`. `auth-flow.spec.ts` je importuje, a jego testy się nie zmieniają.

#### 2. Scenariusze budżetu

**File**: `e2e/auth/monthly-budget.spec.ts`

**Intent**: Pokazać FR-003 i FR-002 na prawdziwym Supabase, w tym reset stanu przy zmianie konta.

**Contract**: bez `page.clock`, bo stały czas może zakłócić ważność tokenów Auth. Asercje nie zależą od miesiąca. Scenariusze:

1. **Limit jest trwały i należy do konta.**
   - A rejestruje się i ustawia 3100. Ten sam miesiąc zmienia na 3200 (ścieżka upsertu).
   - Po `reload` `[data-testid=hero-limit]` pokazuje „3200 zł”.
   - W nowym kontekście przeglądarki, bez LocalStorage, A loguje się i widzi „3200 zł”.
2. **Dwa konta w jednej karcie.**
   - A ustawia 3100 i wylogowuje się. B rejestruje się i widzi przycisk „Ustaw limit miesięczny” oraz `safe-to-spend` = „—”.
   - B ustawia 2000 i wylogowuje się. A loguje się i widzi „3100 zł”.
3. **Wylogowanie w innej karcie.**
   - Dwie strony w jednym kontekście, A zalogowany i z limitem. Wylogowanie na stronie 1 przenosi stronę 2 na `/login`.
   - Zalogowanie B na stronie 2 nie pokazuje limitu A.

#### 3. Dokumentacja

**File**: `README.md`, `AGENTS.md`, `context/deployment/deploy-plan.md`

**Intent**: Opisać stan przejściowy i wzorzec walidacji migracji dla S-05 i S-06.

**Contract**:

- README, „Status projektu”: przy `DATA_BACKEND=supabase` limit jest prywatny w Supabase, a wydatki i foldery są lokalne dla przeglądarki do S-05/S-06.
- AGENTS.md, „Testing and Delivery”: jedno zdanie, że zmiany w `supabase/migrations/` wymagają `npx supabase db reset`, `npm run test:db` i `npm run test:e2e:auth`.
- `deploy-plan.md`: notatka stanu z datą, że migracja `monthly_budgets` jest na stagingu, a nie na prod.

#### 4. Migracja na staging (właściciel projektu)

**Intent**: Wcześnie wykryć różnice między lokalnym a zdalnym projektem, np. uprawnienia lub `auto_expose`. Prod czeka do S-08.

**Contract**: krok ręczny, zatwierdzany przez właściciela (`deploy-plan.md:304`):
- `npx supabase migration list --linked` potwierdza, że link wskazuje staging (`zkiopvcinvhzsqemypev`);
- następnie `npx supabase db push`;
- bez `config push` (`deploy-plan.md:178`).

### Success Criteria:

#### Automated Verification:

- `npm run test:e2e:auth` przechodzi na obu projektach (desktop i Mobile Pixel), łącznie z dotychczasowymi testami logowania
- `npm run test:e2e` przechodzi (tryb `local` bez zmian)
- `npm run test:db` przechodzi
- `npm run check` przechodzi

#### Manual Verification:

- `npx supabase migration list --linked` pokazuje migrację `monthly_budgets` jako zastosowaną na stagingu; na prod nie była uruchamiana
- Security Advisor na stagingu nie zgłasza ostrzeżeń dla `monthly_budgets`
- README, AGENTS.md i `deploy-plan.md` opisują stan przejściowy i komendy

**Implementation Note**: Krok 4 wykonuje lub zatwierdza właściciel projektu, bo zmienia zdalne środowisko.

---

## Testing Strategy

### Unit Tests:

- Adapter: mapowanie `date` ↔ `Period`, kształt upsertu bez `user_id`, propagacja błędu.
- `provideRepositories`: wybór implementacji według `DATA_BACKEND`.
- `BudgetStateService`: reset i reload przy A → `null` i A → B, odrzucenie spóźnionego wyniku, brak przeładowania przy tym samym id, reset UI.
- `AuthService.userId` przy zdarzeniach `SIGNED_OUT` i `SIGNED_IN`.

### Integration Tests:

- pgTAP (`npm run test:db`): każda polityka × dwóch użytkowników, `anon`, constrainty, upsert, `updated_at`.
- Playwright (`npm run test:e2e:auth`): trwałość między przeglądarkami, dwa konta w jednej karcie, wylogowanie w innej karcie.

### Manual Testing Steps:

1. `npx supabase start`, `npx supabase db reset`, `.env` z `DATA_BACKEND=supabase` i lokalnym kluczem, `npm start`.
2. Zarejestrować A, ustawić limit, przeładować i sprawdzić wiersz w Studio.
3. Otworzyć drugą kartę, wylogować się w pierwszej, zalogować B w drugiej i sprawdzić, że nie widać limitu A.
4. Przywrócić `.env` do `DATA_BACKEND=local` i potwierdzić, że `npm start` działa jak dawniej.

## Performance Considerations

Jeden wiersz na zmianę limitu, czyli kilka wierszy na użytkownika. `list()` pobiera całą historię limitów, co przy tej skali jest pomijalne. Predykat RLS `(select auth.uid())` liczy się raz na zapytanie i korzysta z indeksu unikatu.

## Migration Notes

- Migracja jest addytywna (nowa tabela) i nie dotyka danych lokalnych. Dane LocalStorage nie są migrowane (PRD §Constraints).
- Wycofanie kodu to revert commitów. Tabela na stagingu może zostać, bo nic jej nie używa przy `DATA_BACKEND=local`. Ewentualne usunięcie wymaga nowej migracji `drop table`, a nie edycji istniejącej.
- Kolejność środowisk: lokalnie → staging (S-04) → prod (S-08, po akceptacji właściciela).

## References

- Research: `context/changes/private-monthly-budget/research.md` (§1–4, Architecture Insights, Open Questions 3–5)
- Lekcja: `context/foundation/lessons.md` — „Per-tab auth state vs cross-tab Supabase events”
- Poprzednia zmiana: `context/archive/2026-10-14-email-password-sign-in/plan.md:44` (reset stanu odłożony do S-04)
- Wzorzec mocka klienta: `src/app/core/auth/auth.service.spec.ts:10-41`
- Wzorzec repozytorium: `src/app/core/repositories/local/local-monthly-budget.repository.ts`
- Wdrożenie: `context/deployment/deploy-plan.md:25,254,281-290,304`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Schemat, RLS i testy izolacji w bazie

#### Automated

- [x] 1.1 `npx supabase db reset` stosuje obie migracje od zera bez błędów
- [x] 1.2 `npm run test:db` przechodzi, a każda polityka SELECT/INSERT/UPDATE/DELETE ma co najmniej jedną asercję dwóch użytkowników
- [x] 1.3 `npm run check` przechodzi

#### Manual

- [ ] 1.4 W Studio tabela `monthly_budgets` ma włączone RLS i cztery polityki, a Security Advisor nie zgłasza dla niej ostrzeżeń

### Phase 2: Adapter Supabase i wybór providerów

#### Automated

- [ ] 2.1 Nowe testy jednostkowe repozytoriów przechodzą
- [ ] 2.2 `npm run check` przechodzi (build `local` bez `@supabase/supabase-js` w głównym chunku, skan sekretów zielony)
- [ ] 2.3 `npm run test:e2e` przechodzi bez zmian w testach

#### Manual

- [ ] 2.4 Przy `DATA_BACKEND=supabase` limit pojawia się w `monthly_budgets` z `user_id` konta i `effective_from` = 1. dzień miesiąca
- [ ] 2.5 Po teście ręcznym `.env` wraca do `DATA_BACKEND=local`

### Phase 3: Cykl życia stanu powiązany z tożsamością

#### Automated

- [ ] 3.1 Testy `budget-state.service.spec.ts` i `auth.service.spec.ts` przechodzą
- [ ] 3.2 `npm run check` przechodzi
- [ ] 3.3 `npm run test:e2e` przechodzi bez zmian w testach

#### Manual

- [ ] 3.4 Wylogowanie w karcie 1 przenosi kartę 2 na `/login`, a po zalogowaniu innym kontem karta 2 nie pokazuje poprzedniego limitu

### Phase 4: E2E dwóch kont, dokumentacja i staging

#### Automated

- [ ] 4.1 `npm run test:e2e:auth` przechodzi na obu projektach, łącznie z dotychczasowymi testami logowania
- [ ] 4.2 `npm run test:e2e` przechodzi
- [ ] 4.3 `npm run test:db` przechodzi
- [ ] 4.4 `npm run check` przechodzi

#### Manual

- [ ] 4.5 `npx supabase migration list --linked` pokazuje migrację `monthly_budgets` na stagingu; prod nietknięty
- [ ] 4.6 Security Advisor na stagingu nie zgłasza ostrzeżeń dla `monthly_budgets`
- [ ] 4.7 README, AGENTS.md i `deploy-plan.md` opisują stan przejściowy i komendy
