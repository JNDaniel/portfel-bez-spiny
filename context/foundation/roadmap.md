---
project: Portfel Bez Spiny
version: 1
status: draft
created: 2026-10-04
updated: 2026-10-04
prd_version: 2
main_goal: quality
top_blocker: decisions
milestone_id: private-accounts-mvp
milestone_seq: 1
milestone_status: open
---

# Roadmap: Portfel Bez Spiny

> Derived from `context/foundation/prd.md` (v2) + `context/changes/stabilize-and-supabase-mvp/change.md` + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-1: Prywatne konta i wiarygodny Safe-to-Spend** — Status: open

- **Intent:** Zamienić lokalną makietę w MVP, w którym zalogowany użytkownik zapisuje prywatny budżet i sklasyfikowane wydatki, a dashboard liczy Safe-to-Spend z jego danych, z izolacją kont egzekwowaną w bazie, na webie i Androidzie.
- **Source materials:** `context/foundation/prd.md` (v2) jako źródło wymagań; `context/changes/stabilize-and-supabase-mvp/change.md` jako plan dostarczenia (fazy 1–8, decyzje backendowe).
- **Done when:** every F-NN and S-NN below is `done`; FR-008 (S-08) może zostać przeniesiony do Parked bez blokowania zamknięcia, bo jest nice-to-have.
- **Scope anchors:** FR-001–FR-008, US-01; Guardrails i Observable quality requirements z PRD; fazy 2–8 z `change.md` (faza 1 i fundament Supabase z `context/deployment/deploy-plan.md` są już w Baseline).

## Vision recap

Portfel Bez Spiny oddziela codzienne wydatki od okazjonalnych (prezent, wyjazd), żeby okazje nie wywoływały fałszywego alarmu przekroczenia budżetu, i osobno pokazuje koszt zachcianek. Zmiana przenosi istniejącą regułę domenową z lokalnej makiety na prywatne, trwałe dane wielu użytkowników z logowaniem email i hasłem.

## North star

**S-04: Zalogowany użytkownik dodaje wydatek codzienny, okazjonalny i zachciankę, a dashboard z jego prywatnych danych pokazuje poprawny Safe-to-Spend** — to pierwszy pełny przepływ US-01 na prawdziwym backendzie; jakość (`main_goal: quality`) wymaga, żeby izolacja kont i zgodność obliczeń były udowodnione właśnie na nim.

> „North star” oznacza tu najmniejszy przepływ od końca do końca, którego działanie potwierdza główną hipotezę produktu; stoi tak wcześnie, jak pozwalają zależności, bo reszta ma sens dopiero, gdy on działa.

## At a glance

| ID   | Change ID                    | Outcome (user can …)                                                                 | Prerequisites              | PRD refs                       | Status   |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------- | ------------------------------ | -------- |
| F-01 | angular-security-upgrade     | (foundation) framework i toolchain bez krytycznych podatności, aplikacja działa jak dziś | —                          | FR-007, Guardrails             | ready    |
| F-02 | lint-and-format-checks       | (foundation) lint i formatowanie są deterministyczną bramką przed każdym przekazaniem   | F-01                       | FR-007                         | proposed |
| S-01 | canonical-expense-classification | sklasyfikować wydatek jako codzienny, okazjonalny albo zachciankę i zobaczyć poprawny dashboard (dane lokalne, jeden model) | F-01                       | US-01, FR-005, FR-006          | proposed |
| S-02 | email-password-sign-in       | zarejestrować się, zalogować i wylogować; niezalogowany trafia na ekran logowania       | F-01                       | FR-001, FR-002                 | proposed |
| S-03 | private-monthly-budget       | ustawić miesięczny budżet, który przetrwa ponowne otwarcie i jest widoczny tylko dla niego | S-01, S-02                 | FR-003, FR-002                 | proposed |
| S-04 | private-classified-expenses  | dodać wydatki trzech typów i zobaczyć Safe-to-Spend policzony z własnych, prywatnych danych | S-03                       | US-01, FR-004, FR-005, FR-006, FR-002 | proposed |
| S-05 | edit-delete-own-expenses     | poprawić i usunąć własne wydatki, z zachowaniem tagów i folderów                       | S-04                       | FR-004, FR-002                 | proposed |
| S-06 | android-authenticated-flow   | przejść cały zalogowany przepływ w aplikacji Android                                   | S-05, JDK 21 zainstalowany | FR-007, US-01                  | proposed |
| S-07 | production-supabase-switch   | założyć konto na publicznym adresie produkcyjnym i korzystać z trwałych, prywatnych danych | F-01, F-02, S-05           | FR-001, FR-002, FR-007, US-01  | blocked  |
| S-08 | private-wants-radar          | zobaczyć radar zachcianek z roczną projekcją oszczędności na własnych danych           | S-04                       | FR-008                         | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                  | Chain                                | Note                                                                 |
| ------ | ---------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| A      | Bezpieczny toolchain i start produkcji | `F-01` → `F-02` → `S-07`             | Jakość: podatności i bramki przed zapisem prawdziwych danych; S-07 łączy się ze strumieniem B po S-05. |
| B      | Model i prywatne dane  | `S-01` → `S-03` → `S-04` → `S-05`    | Rozstrzyga główne ryzyko (model danych) jako pierwszy krok po F-01.   |
| C      | Konto użytkownika      | `S-02`                               | Równolegle do S-01; dołącza do strumienia B w S-03.                   |
| D      | Powierzchnia mobilna   | `S-06`                               | Po S-05; niezależne od S-07.                                          |
| E      | Radar zachcianek       | `S-08`                               | Opcjonalne; po S-04, równolegle do S-05.                              |

## Baseline

What's already in place in the codebase as of `2026-10-04` (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — Angular 19 + Ionic 8, standalone components, lazy routes `dashboard`, `expenses`, `budgets`, `analytics`, `settings` (`src/app/app.routes.ts`); testy unit 5/5 i E2E 10/10 zielone.
- **Backend / API:** absent jako własny serwer — backendem będzie Supabase; projekty staging i prod istnieją, aplikacja się z nimi nie łączy (`DATA_BACKEND=local`).
- **Data:** partial — główny ekran (`/dashboard`) zapisuje bezpośrednio do localStorage przez `BudgetStateService`, bez repozytorium; pozostałe ekrany (`/expenses`, `/budgets`, `/analytics`, `/settings`) używają osobnego modelu `Expense`/`Budget` z implementacjami mock/http; klasyfikacja to tagi, kwoty to liczby zmiennoprzecinkowe. `supabase/` ma tylko migrację bazową (`set_updated_at()`), bez tabel użytkownika.
- **Auth:** partial — brak logowania i ochrony tras w aplikacji; Supabase Auth skonfigurowany (email i hasło, Redirect URLs dla staging i prod), leniwy klient Supabase gotowy i wyłączony.
- **Deploy / infra:** present — Cloudflare Workers static assets z Workers Builds z GitHuba, wybór projektu Supabase po gałęzi podczas buildu, skan sekretów po buildzie (`context/deployment/deploy-plan.md`); brak CI na pull requestach.
- **Observability:** absent — brak monitoringu błędów; dostępne tylko logi buildu Cloudflare.

## Foundations

### F-01: Upgrade frameworka i toolchainu

- **Outcome:** (foundation) aplikacja działa na wspieranej wersji frameworka bez krytycznych podatności, a każde pozostałe wysokie ryzyko ma zapisaną decyzję; web i Android zachowują się jak dziś.
- **Change ID:** angular-security-upgrade
- **PRD refs:** FR-007, Guardrails
- **Unlocks:** S-07 (zaakceptowane ryzyko podatności musi zniknąć przed zapisem prawdziwych danych w produkcji); S-01 i S-02 (nowy kod powstaje od razu na docelowej wersji frameworka).
- **Prerequisites:** —
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Czy upgrade po jednej wersji głównej zachowuje zgodność z Ionic i Capacitor? — Owner: team. Block: no.
- **Risk:** Pierwszy, bo każdy późniejszy kod powstaje na nowej wersji; ryzyko to regresje UI i natywne, wyłapywane pełną walidacją web i Android po każdym kroku.
- **Status:** ready

### F-02: Bramka lint i formatowania

- **Outcome:** (foundation) lint i sprawdzanie formatowania przechodzą lokalnie i są częścią walidacji przed każdym przekazaniem zmian.
- **Change ID:** lint-and-format-checks
- **PRD refs:** FR-007
- **Unlocks:** ścieżka weryfikacji dla S-01–S-08; S-07 (start produkcji wymaga zielonych bramek jakości).
- **Prerequisites:** F-01
- **Parallel with:** S-01, S-02
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Po F-01, bo narzędzia muszą pasować do nowej wersji frameworka; ryzyko to szerokie przepisywanie kodu, ograniczone do minimalnych poprawek.
- **Status:** proposed

## Slices

### S-01: Klasyfikacja wydatków na jednym modelu

- **Outcome:** użytkownik może oznaczyć wydatek jako codzienny, okazjonalny albo zachciankę, a dashboard wyklucza okazje z codziennego limitu i Safe-to-Spend i osobno pokazuje zachcianki — na danych lokalnych, ale już na jednym docelowym modelu, z którego czyta każdy ekran z wydatkami.
- **Change ID:** canonical-expense-classification
- **PRD refs:** US-01, FR-005, FR-006
- **Prerequisites:** F-01
- **Parallel with:** S-02, F-02
- **Blockers:** —
- **Unknowns:**
  - Który model staje się docelowy i które ekrany starego modelu (`/expenses`, `/budgets`, `/analytics`) przechodzą na wspólny kontrakt, a które są usuwane lub izolowane jako poza MVP? — Owner: user. Block: no (rozstrzygane w planie tej zmiany).
  - Jak mapują się istniejące tagi (np. „Zachcianka”) na nową klasyfikację, przy zachowaniu tagowania wymaganego przez PRD? — Owner: user. Block: no.
- **Risk:** Rozstrzyga główne ryzyko (dwa modele danych) przed powstaniem tabel; po tej zmianie żaden ekran nie zapisuje danych użytkownika do localStorage z pominięciem repozytorium.
- **Status:** proposed

### S-02: Rejestracja i logowanie email + hasło

- **Outcome:** niezalogowana osoba może założyć konto, zalogować się, wrócić do zalogowanej sesji i wylogować się; próba wejścia do chronionej części kończy się przekierowaniem do logowania.
- **Change ID:** email-password-sign-in
- **PRD refs:** FR-001, FR-002
- **Prerequisites:** F-01
- **Parallel with:** S-01, F-02
- **Blockers:** —
- **Unknowns:**
  - Czy rejestracja wymaga potwierdzenia adresu email i jak zachowuje się ono na stagingu i lokalnie? — Owner: user. Block: no.
- **Risk:** Niezależne od modelu danych, więc równolegle do S-01; ryzyko to błędne przekierowania Auth między hostami, weryfikowane na stagingu.
- **Status:** proposed

### S-03: Prywatny budżet miesięczny

- **Outcome:** zalogowany użytkownik może ustawić miesięczny budżet, który jest widoczny po ponownym otwarciu aplikacji i wyłącznie na jego koncie.
- **Change ID:** private-monthly-budget
- **PRD refs:** FR-003, FR-002
- **Prerequisites:** S-01, S-02
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Pierwsza tabela użytkownika, więc tu po raz pierwszy powstaje izolacja w bazie i test dwóch użytkowników; mały zakres ogranicza koszt pomyłki we wzorcu, który powielą S-04 i S-05.
- **Status:** proposed

### S-04: Prywatne wydatki trzech typów i Safe-to-Spend

- **Outcome:** zalogowany użytkownik może dodać wydatek codzienny, okazjonalny i zachciankę, a dashboard z jego prywatnych, trwałych danych pokazuje Safe-to-Spend zgodny z regułą domenową.
- **Change ID:** private-classified-expenses
- **PRD refs:** US-01, FR-004, FR-005, FR-006, FR-002
- **Prerequisites:** S-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Przepływ dowodowy dla całego produktu; ryzyko to rozjazd obliczeń między danymi lokalnymi a zapisanymi, ograniczony jedną przetestowaną warstwą obliczeń z S-01.
- **Status:** proposed

### S-05: Edycja i usuwanie własnych wydatków

- **Outcome:** zalogowany użytkownik może poprawić i usunąć własne wydatki, a tagi i foldery pozostają zachowane po ponownym otwarciu aplikacji.
- **Change ID:** edit-delete-own-expenses
- **PRD refs:** FR-004, FR-002
- **Prerequisites:** S-04
- **Parallel with:** S-08
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Domyka pełny CRUD i zgodność z istniejącym tagowaniem; ryzyko to cudzy wiersz zmieniony przez błędną politykę, wykluczany testem dwóch użytkowników.
- **Status:** proposed

### S-06: Zalogowany przepływ na Androidzie

- **Outcome:** zalogowany użytkownik może przejść cały przepływ (logowanie, budżet, wydatki trzech typów, dashboard) w aplikacji Android.
- **Change ID:** android-authenticated-flow
- **PRD refs:** FR-007, US-01
- **Prerequisites:** S-05, JDK 21 zainstalowany
- **Parallel with:** S-07, S-08
- **Blockers:** Brak pełnego JDK 21 lokalnie (wymaga instalacji przez właściciela maszyny).
- **Unknowns:**
  - Jak sesja i przekierowania Auth zachowują się w natywnej powłoce mobilnej? — Owner: team. Block: no.
- **Risk:** Po pełnym CRUD, żeby walidować kompletny przepływ raz; ryzyko to różnice sesji i przekierowań między webem a powłoką natywną.
- **Status:** proposed

### S-07: Start produkcji na Supabase

- **Outcome:** nowa osoba może założyć konto na publicznym adresie produkcyjnym i korzystać z trwałych, prywatnych danych; demo lokalne przestaje być trybem produkcyjnym.
- **Change ID:** production-supabase-switch
- **PRD refs:** FR-001, FR-002, FR-007, US-01
- **Prerequisites:** F-01, F-02, S-05
- **Parallel with:** S-06, S-08
- **Blockers:** —
- **Unknowns:**
  - Który plan Supabase i jaka polityka kopii zapasowych są wymagane przed zapisem prawdziwych danych (plan Free wstrzymuje nieaktywne projekty i nie daje kopii odpowiednich dla produkcji)? — Owner: user. Block: yes.
- **Risk:** Ostatni krok, bo jest najtrudniej odwracalny: dane zapisane w produkcji nie wrócą do trybu lokalnego.
- **Status:** blocked

### S-08: Radar zachcianek na prywatnych danych

- **Outcome:** zalogowany użytkownik może zobaczyć istniejący radar zachcianek z roczną projekcją oszczędności, policzony z własnych danych.
- **Change ID:** private-wants-radar
- **PRD refs:** FR-008
- **Prerequisites:** S-04
- **Parallel with:** S-05, S-06, S-07
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Nice-to-have; nie blokuje MVP i może trafić do Parked, jeśli termin zrobi się ciasny.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                        | Suggested issue title                                         | Ready for `/10x-plan` | Notes |
| ---------- | -------------------------------- | ------------------------------------------------------------- | --------------------- | ----- |
| F-01       | angular-security-upgrade         | Upgrade frameworka i toolchainu bez krytycznych podatności    | yes                   | Run `/10x-plan angular-security-upgrade` |
| F-02       | lint-and-format-checks           | Dodać lint i formatowanie jako bramkę jakości                 | no                    | Po F-01 |
| S-01       | canonical-expense-classification | Klasyfikacja wydatków na jednym modelu danych                 | no                    | Po F-01 |
| S-02       | email-password-sign-in           | Rejestracja, logowanie i ochrona tras                         | no                    | Po F-01 |
| S-03       | private-monthly-budget           | Prywatny, trwały budżet miesięczny                            | no                    | Po S-01 i S-02 |
| S-04       | private-classified-expenses      | Prywatne wydatki trzech typów i Safe-to-Spend z backendu      | no                    | Po S-03 |
| S-05       | edit-delete-own-expenses         | Edycja i usuwanie własnych wydatków z tagami i folderami      | no                    | Po S-04 |
| S-06       | android-authenticated-flow       | Zalogowany przepływ na Androidzie                             | no                    | Po S-05; wymaga JDK 21 |
| S-07       | production-supabase-switch       | Przełączenie produkcji na Supabase                            | no                    | Zablokowane decyzją o planie i kopiach zapasowych |
| S-08       | private-wants-radar              | Radar zachcianek na prywatnych danych                         | no                    | Po S-04; opcjonalne |

## Open Roadmap Questions

1. **Jaka jest obecna rzeczywista baza użytkowników makiety?** — Owner: user. Block: roadmap-wide (nie blokuje kolejności).
2. **Jaki konkretny czynnik sprawia, że ta zmiana jest potrzebna właśnie teraz?** — Owner: user. Block: roadmap-wide (nie blokuje kolejności).
3. **Jak użytkownik radzi sobie dziś z opisanym problemem i jaki jest koszt tego obejścia?** — Owner: user. Block: roadmap-wide (nie blokuje kolejności).
4. **Jaki jest oczekiwany orientacyjny poziom równoległego użycia produktu?** — Owner: user. Block: S-07.
5. **Jaki jest oczekiwany orientacyjny wolumen danych użytkownika?** — Owner: user. Block: S-07.

## Parked

- **Nasłuchiwanie powiadomień bankowych i automatyczny import wydatków** — Why parked: PRD §Non-Goals.
- **Produkcyjny OCR paragonów, wprowadzanie głosowe i automatyczna analiza AI** — Why parked: PRD §Non-Goals; istniejące demonstracje nie są zobowiązaniem MVP.
- **Konta rodzinne, współdzielone budżety i rola administratora** — Why parked: PRD §Non-Goals; jedna płaska rola.
- **Subskrypcje i podsumowania** — Why parked: PRD §Non-Goals; nie są warunkiem ukończenia MVP.
- **Migracja lokalnych danych demonstracyjnych do kont** — Why parked: PRD §Constraints; nowe konta zaczynają od pustych danych.
- **Funkcje serwerowe z zaufanym sekretem** — Why parked: PRD §Approved Implementation Decisions; brak zidentyfikowanego przypadku użycia.
- **CI/CD na pull requestach i monitoring błędów** — Why parked: `change.md` §Excluded; wdrożenie z GitHuba już działa, CI w osobnym zakresie.

## Milestone History

## Done
