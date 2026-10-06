---
project: Portfel Bez Spiny
version: 1
status: draft
created: 2026-10-04
updated: 2026-10-06
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
- **Done when:** every F-NN and S-NN below is `done`; FR-008 (S-09) może zostać przeniesiony do Parked bez blokowania zamknięcia, bo jest nice-to-have.
- **Scope anchors:** FR-001–FR-008, US-01; Guardrails i Observable quality requirements z PRD; fazy 2–8 z `change.md` (faza 1 i fundament Supabase z `context/deployment/deploy-plan.md` są już w Baseline).

## Vision recap

Portfel Bez Spiny oddziela codzienne wydatki od okazjonalnych (prezent, wyjazd), żeby okazje nie wywoływały fałszywego alarmu przekroczenia budżetu, i osobno pokazuje koszt zachcianek. Zmiana przenosi istniejącą regułę domenową z lokalnej makiety na prywatne, trwałe dane wielu użytkowników z logowaniem email i hasłem.

## North star

**S-05: Zalogowany użytkownik dodaje wydatek codzienny, okazjonalny i zachciankę, a dashboard z jego prywatnych danych pokazuje poprawny Safe-to-Spend** — to pierwszy pełny przepływ US-01 na prawdziwym backendzie; jakość (`main_goal: quality`) wymaga, żeby izolacja kont i zgodność obliczeń były udowodnione właśnie na nim.

> „North star” oznacza tu najmniejszy przepływ od końca do końca, którego działanie potwierdza główną hipotezę produktu; stoi tak wcześnie, jak pozwalają zależności, bo reszta ma sens dopiero, gdy on działa.

## At a glance

| ID   | Change ID                    | Outcome (user can …)                                                                 | Prerequisites              | PRD refs                       | Status   |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------- | ------------------------------ | -------- |
| F-01 | angular-security-upgrade     | (foundation) framework i toolchain bez krytycznych podatności, aplikacja działa jak dziś | —                          | FR-007, Guardrails             | done |
| F-02 | lint-and-format-checks       | (foundation) lint i formatowanie są deterministyczną bramką przed każdym przekazaniem   | F-01                       | FR-007                         | done        |
| S-01 | mvp-focused-dashboard        | otworzyć dashboard z samymi akcjami MVP i Safe-to-Spend widocznym bez przewijania; funkcje demo są ukryte | —                          | FR-006, US-01                  | done |
| S-02 | canonical-expense-classification | sklasyfikować wydatek jako codzienny, okazjonalny albo zachciankę i zobaczyć poprawny dashboard z wykresem według klasyfikacji (dane lokalne, jeden model) | F-01, S-01                 | US-01, FR-005, FR-006          | done |
| S-03 | email-password-sign-in       | zarejestrować się, zalogować i wylogować; niezalogowany trafia na ekran logowania       | F-01                       | FR-001, FR-002                 | proposed |
| S-04 | private-monthly-budget       | ustawić miesięczny budżet, który przetrwa ponowne otwarcie i jest widoczny tylko dla niego | S-02, S-03                 | FR-003, FR-002                 | proposed |
| S-05 | private-classified-expenses  | dodać wydatki trzech typów i zobaczyć Safe-to-Spend policzony z własnych, prywatnych danych | S-04                       | US-01, FR-004, FR-005, FR-006, FR-002 | proposed |
| S-06 | edit-delete-own-expenses     | poprawić, usunąć i przypisać do folderu własne wydatki, z zachowaniem tagów                   | S-05                       | FR-004, FR-002                 | proposed |
| S-07 | android-authenticated-flow   | przejść cały zalogowany przepływ w aplikacji Android                                   | S-06, Android SDK          | FR-007, US-01                  | proposed |
| S-08 | production-supabase-switch   | założyć konto na publicznym adresie produkcyjnym i korzystać z trwałych, prywatnych danych | F-01, F-02, S-06           | FR-001, FR-002, FR-007, US-01  | blocked  |
| S-09 | private-wants-radar          | zobaczyć radar zachcianek z roczną projekcją oszczędności na własnych danych           | S-01, S-05                 | FR-008                         | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                  | Chain                                | Note                                                                 |
| ------ | ---------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| A      | Bezpieczny toolchain i start produkcji | `F-01` → `F-02` → `S-08`             | Jakość: podatności i bramki przed zapisem prawdziwych danych; S-08 łączy się ze strumieniem B po S-06. |
| B      | Model i prywatne dane  | `S-01` → `S-02` → `S-04` → `S-05` → `S-06` | S-01 zawęża dashboard do MVP od razu; S-02 rozstrzyga główne ryzyko (model danych) po F-01. |
| C      | Konto użytkownika      | `S-03`                               | Równolegle do S-02; dołącza do strumienia B w S-04.                   |
| D      | Powierzchnia mobilna   | `S-07`                               | Po S-06; niezależne od S-08.                                          |
| E      | Radar zachcianek       | `S-09`                               | Opcjonalne; przywraca radar ukryty w S-01, po S-05, równolegle do S-06. |

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
- **Unlocks:** S-08 (zaakceptowane ryzyko podatności musi zniknąć przed zapisem prawdziwych danych w produkcji); S-02 i S-03 (nowy kod powstaje od razu na docelowej wersji frameworka).
- **Prerequisites:** —
- **Parallel with:** S-01
- **Blockers:** —
- **Unknowns:**
  - Czy upgrade po jednej wersji głównej zachowuje zgodność z Ionic i Capacitor? — Owner: team. Block: no.
- **Risk:** Pierwszy, bo każdy późniejszy kod powstaje na nowej wersji; ryzyko to regresje UI i natywne, wyłapywane pełną walidacją web i Android po każdym kroku.
- **Status:** done

### F-02: Bramka lint i formatowania

- **Outcome:** (foundation) lint i sprawdzanie formatowania przechodzą lokalnie i są częścią walidacji przed każdym przekazaniem zmian.
- **Change ID:** lint-and-format-checks
- **PRD refs:** FR-007
- **Unlocks:** ścieżka weryfikacji dla S-02–S-09 (S-01 może ją wyprzedzić); S-08 (start produkcji wymaga zielonych bramek jakości).
- **Prerequisites:** F-01
- **Parallel with:** S-02, S-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Po F-01, bo narzędzia muszą pasować do nowej wersji frameworka; ryzyko to szerokie przepisywanie kodu, ograniczone do minimalnych poprawek.
- **Status:** done

## Slices

### S-01: Dashboard skupiony na MVP

- **Outcome:** użytkownik otwiera dashboard z samymi akcjami MVP (ręczne dodanie wydatku, foldery, lista transakcji) i Safe-to-Spend widocznym bez przewijania; funkcje demo spoza MVP — test powiadomienia z banku, skaner paragonów, głos AI, subskrypcje, radar zachcianek i podsumowanie AI — są ukryte, a ich kod zostaje do późniejszego przywrócenia.
- **Change ID:** mvp-focused-dashboard
- **PRD refs:** FR-006, US-01
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Najmniejsza zmiana z natychmiastowym efektem dla zasady jednej sekundy (PRD §Observable quality requirements) i PRD §Non-Goals; zawęża też to, co S-02 musi przenieść na docelowy model. Ryzyko to test E2E podsumowania AI, który trzeba dostosować.
- **Status:** done

### S-02: Klasyfikacja wydatków na jednym modelu

- **Outcome:** użytkownik może oznaczyć wydatek jako codzienny, okazjonalny albo zachciankę, a dashboard wyklucza okazje z codziennego limitu i Safe-to-Spend, a wykresy dashboardu grupują wydatki według tej klasyfikacji i wyraźnie wyróżniają zachcianki i okazje (zamiast kategorii, których nie da się wybrać przy transakcji) — na danych lokalnych, ale już na jednym docelowym modelu, z którego czyta każdy ekran z wydatkami.
- **Change ID:** canonical-expense-classification
- **PRD refs:** US-01, FR-005, FR-006
- **Prerequisites:** F-01, S-01
- **Parallel with:** S-03, F-02
- **Blockers:** —
- **Unknowns:**
  - Który model staje się docelowy i które ekrany starego modelu (`/expenses`, `/budgets`, `/analytics`) przechodzą na wspólny kontrakt, a które są usuwane lub izolowane jako poza MVP? — Owner: user. Block: no (rozstrzygane w planie tej zmiany).
  - Jak mapują się istniejące tagi (np. „Zachcianka”) na nową klasyfikację, przy zachowaniu tagowania wymaganego przez PRD? „Zbędne” i „Zachcianka” praktycznie się dublują. — Owner: user. Block: no.
  - Czy kategorie zostają w modelu (z wyborem przy transakcji), czy wykres kategorii znika na rzecz wykresu klasyfikacji? — Owner: user. Block: no (rozstrzygane w planie tej zmiany).
- **Risk:** Rozstrzyga główne ryzyko (dwa modele danych) przed powstaniem tabel; po tej zmianie żaden ekran nie zapisuje danych użytkownika do localStorage z pominięciem repozytorium.
- **Status:** done

### S-03: Rejestracja i logowanie email + hasło

- **Outcome:** niezalogowana osoba może założyć konto, zalogować się, wrócić do zalogowanej sesji i wylogować się; próba wejścia do chronionej części kończy się przekierowaniem do logowania.
- **Change ID:** email-password-sign-in
- **PRD refs:** FR-001, FR-002
- **Prerequisites:** F-01
- **Parallel with:** S-02, F-02
- **Blockers:** —
- **Unknowns:**
  - Czy rejestracja wymaga potwierdzenia adresu email i jak zachowuje się ono na stagingu i lokalnie? — Owner: user. Block: no.
- **Risk:** Niezależne od modelu danych, więc równolegle do S-02; ryzyko to błędne przekierowania Auth między hostami, weryfikowane na stagingu.
- **Status:** proposed

### S-04: Prywatny budżet miesięczny

- **Outcome:** zalogowany użytkownik może ustawić miesięczny budżet, który jest widoczny po ponownym otwarciu aplikacji i wyłącznie na jego koncie.
- **Change ID:** private-monthly-budget
- **PRD refs:** FR-003, FR-002
- **Prerequisites:** S-02, S-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Pierwsza tabela użytkownika, więc tu po raz pierwszy powstaje izolacja w bazie i test dwóch użytkowników; mały zakres ogranicza koszt pomyłki we wzorcu, który powielą S-05 i S-06.
- **Status:** proposed

### S-05: Prywatne wydatki trzech typów i Safe-to-Spend

- **Outcome:** zalogowany użytkownik może dodać wydatek codzienny, okazjonalny i zachciankę, a dashboard z jego prywatnych, trwałych danych pokazuje Safe-to-Spend zgodny z regułą domenową.
- **Change ID:** private-classified-expenses
- **PRD refs:** US-01, FR-004, FR-005, FR-006, FR-002
- **Prerequisites:** S-04
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Przepływ dowodowy dla całego produktu; ryzyko to rozjazd obliczeń między danymi lokalnymi a zapisanymi, ograniczony jedną przetestowaną warstwą obliczeń z S-02.
- **Status:** proposed

### S-06: Edycja i usuwanie własnych wydatków

- **Outcome:** zalogowany użytkownik może poprawić i usunąć własne wydatki, przypisać wydatek do istniejącego folderu (także akcją przesunięcia) lub go z folderu wyjąć, a tagi i foldery pozostają zachowane po ponownym otwarciu aplikacji.
- **Change ID:** edit-delete-own-expenses
- **PRD refs:** FR-004, FR-002
- **Prerequisites:** S-05
- **Parallel with:** S-09
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Domyka pełny CRUD, zgodność z istniejącym tagowaniem i dopracowanie folderów (dziś akcja folderu przy przesunięciu nie pozwala wybrać istniejącego folderu); ryzyko to cudzy wiersz zmieniony przez błędną politykę, wykluczany testem dwóch użytkowników.
- **Status:** proposed

### S-07: Zalogowany przepływ na Androidzie

- **Outcome:** zalogowany użytkownik może przejść cały przepływ (logowanie, budżet, wydatki trzech typów, dashboard) w aplikacji Android.
- **Change ID:** android-authenticated-flow
- **PRD refs:** FR-007, US-01
- **Prerequisites:** S-06, Android SDK (platform 36) zainstalowany
- **Parallel with:** S-08, S-09
- **Blockers:** Brak Android SDK lokalnie; `npm run cap:build:apk` nigdy nie przeszedł na tej maszynie. Pełny JDK 21 już jest (`~/workspace/jdks/jdk-21-temurin`). Pierwszy krok tej zmiany: instalacja SDK i zielony build APK, w tym zaległy krok 2.3 z S-01 (`mvp-focused-dashboard`) oraz zaległa weryfikacja APK po upgradzie do Angular 22 / Ionic 9 z F-01 (`angular-security-upgrade`).
- **Unknowns:**
  - Jak sesja i przekierowania Auth zachowują się w natywnej powłoce mobilnej? — Owner: team. Block: no.
- **Risk:** Po pełnym CRUD, żeby walidować kompletny przepływ raz; ryzyko to różnice sesji i przekierowań między webem a powłoką natywną.
- **Status:** proposed

### S-08: Start produkcji na Supabase

- **Outcome:** nowa osoba może założyć konto na publicznym adresie produkcyjnym i korzystać z trwałych, prywatnych danych; demo lokalne przestaje być trybem produkcyjnym.
- **Change ID:** production-supabase-switch
- **PRD refs:** FR-001, FR-002, FR-007, US-01
- **Prerequisites:** F-01, F-02, S-06
- **Parallel with:** S-07, S-09
- **Blockers:** —
- **Unknowns:**
  - Który plan Supabase i jaka polityka kopii zapasowych są wymagane przed zapisem prawdziwych danych (plan Free wstrzymuje nieaktywne projekty i nie daje kopii odpowiednich dla produkcji)? — Owner: user. Block: yes.
- **Risk:** Ostatni krok, bo jest najtrudniej odwracalny: dane zapisane w produkcji nie wrócą do trybu lokalnego.
- **Status:** blocked

### S-09: Radar zachcianek na prywatnych danych

- **Outcome:** zalogowany użytkownik może zobaczyć istniejący radar zachcianek z roczną projekcją oszczędności, policzony z własnych danych.
- **Change ID:** private-wants-radar
- **PRD refs:** FR-008
- **Prerequisites:** S-01, S-05
- **Parallel with:** S-06, S-07, S-08
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Nice-to-have; nie blokuje MVP i może trafić do Parked, jeśli termin zrobi się ciasny.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                        | Suggested issue title                                         | Ready for `/10x-plan` | Notes |
| ---------- | -------------------------------- | ------------------------------------------------------------- | --------------------- | ----- |
| F-01       | angular-security-upgrade         | Upgrade frameworka i toolchainu bez krytycznych podatności    | yes                   | Run `/10x-plan angular-security-upgrade` |
| F-02       | lint-and-format-checks           | Dodać lint i formatowanie jako bramkę jakości                 | no                    | Po F-01 |
| S-01       | mvp-focused-dashboard            | Ukryć funkcje demo i skupić dashboard na MVP                  | yes                   | Run `/10x-implement mvp-focused-dashboard phase 1` |
| S-02       | canonical-expense-classification | Klasyfikacja wydatków na jednym modelu danych                 | no                    | Po F-01 i S-01 |
| S-03       | email-password-sign-in           | Rejestracja, logowanie i ochrona tras                         | no                    | Po F-01 |
| S-04       | private-monthly-budget           | Prywatny, trwały budżet miesięczny                            | no                    | Po S-02 i S-03 |
| S-05       | private-classified-expenses      | Prywatne wydatki trzech typów i Safe-to-Spend z backendu      | no                    | Po S-04 |
| S-06       | edit-delete-own-expenses         | Edycja, usuwanie i przypisanie do folderów własnych wydatków  | no                    | Po S-05 |
| S-07       | android-authenticated-flow       | Zalogowany przepływ na Androidzie                             | no                    | Po S-06; wymaga Android SDK |
| S-08       | production-supabase-switch       | Przełączenie produkcji na Supabase                            | no                    | Zablokowane decyzją o planie i kopiach zapasowych |
| S-09       | private-wants-radar              | Radar zachcianek na prywatnych danych                         | no                    | Po S-01 i S-05; opcjonalne |

## Open Roadmap Questions

1. **Jaka jest obecna rzeczywista baza użytkowników makiety?** — Owner: user. Block: roadmap-wide (nie blokuje kolejności).
2. **Jaki konkretny czynnik sprawia, że ta zmiana jest potrzebna właśnie teraz?** — Owner: user. Block: roadmap-wide (nie blokuje kolejności).
3. **Jak użytkownik radzi sobie dziś z opisanym problemem i jaki jest koszt tego obejścia?** — Owner: user. Block: roadmap-wide (nie blokuje kolejności).
4. **Jaki jest oczekiwany orientacyjny poziom równoległego użycia produktu?** — Owner: user. Block: S-08.
5. **Jaki jest oczekiwany orientacyjny wolumen danych użytkownika?** — Owner: user. Block: S-08.

## Parked

- **Nasłuchiwanie powiadomień bankowych i automatyczny import wydatków** — Why parked: PRD §Non-Goals.
- **Produkcyjny OCR paragonów, wprowadzanie głosowe i automatyczna analiza AI** — Why parked: PRD §Non-Goals; istniejące demonstracje nie są zobowiązaniem MVP.
- **Konta rodzinne, współdzielone budżety i rola administratora** — Why parked: PRD §Non-Goals; jedna płaska rola.
- **Subskrypcje i podsumowania** — Why parked: PRD §Non-Goals; nie są warunkiem ukończenia MVP. Ukryte w S-01.
- **Rozwijany przycisk „Dodaj wydatek” z wyborem: ręcznie, głosem, skanem paragonu** — Why parked: głos i OCR są poza MVP (PRD §Non-Goals); wraca razem z nimi. Ręczne dodanie musi wtedy nadal zajmować jedno tapnięcie, bez dodatkowego kroku.
- **Migracja lokalnych danych demonstracyjnych do kont** — Why parked: PRD §Constraints; nowe konta zaczynają od pustych danych.
- **Funkcje serwerowe z zaufanym sekretem** — Why parked: PRD §Approved Implementation Decisions; brak zidentyfikowanego przypadku użycia.
- **CI/CD na pull requestach i monitoring błędów** — Why parked: `change.md` §Excluded; wdrożenie z GitHuba już działa, CI w osobnym zakresie.
- **Migracja Tailwind 3 → 4** — Why parked: wyłączona z F-01 (`angular-security-upgrade`); jedyna droga do usunięcia 5 pozostałych wysokich podatności `npm audit` (`tailwindcss`, `braces`, `chokidar`, `fast-glob`, `micromatch`), wszystkie tylko w toolchainie buildu. Decyzje: `context/archive/2026-10-05-angular-security-upgrade/audit-triage.md` §Final. Wraca przed S-08 albo jako osobna zmiana, jeśli Tailwind 4 wymaga zmian wyglądu.

## Milestone History

## Done

- **S-01: użytkownik otwiera dashboard z samymi akcjami MVP (ręczne dodanie wydatku, foldery, lista transakcji) i Safe-to-Spend widocznym bez przewijania; funkcje demo spoza MVP — test powiadomienia z banku, skaner paragonów, głos AI, subskrypcje, radar zachcianek i podsumowanie AI — są ukryte, a ich kod zostaje do późniejszego przywrócenia.** — Archived 2026-10-05 → `context/archive/2026-10-05-mvp-focused-dashboard/`. Lesson: —.
- **F-01: (foundation) aplikacja działa na wspieranej wersji frameworka bez krytycznych podatności, a każde pozostałe wysokie ryzyko ma zapisaną decyzję; web i Android zachowują się jak dziś.** — Archived 2026-10-06 → `context/archive/2026-10-05-angular-security-upgrade/`. Lesson: —.
- **F-02: (foundation) lint i sprawdzanie formatowania przechodzą lokalnie i są częścią walidacji przed każdym przekazaniem zmian.** — Archived 2026-10-06 → `context/archive/2026-10-06-lint-and-format-checks/`. Lesson: —.
- **S-02: użytkownik może oznaczyć wydatek jako codzienny, okazjonalny albo zachciankę, a dashboard wyklucza okazje z codziennego limitu i Safe-to-Spend, a wykresy dashboardu grupują wydatki według tej klasyfikacji i wyraźnie wyróżniają zachcianki i okazje (zamiast kategorii, których nie da się wybrać przy transakcji) — na danych lokalnych, ale już na jednym docelowym modelu, z którego czyta każdy ekran z wydatkami.** — Archived 2026-10-06 → `context/archive/2026-10-06-canonical-expense-classification/` (follow-ups: `context/archive/2026-10-06-dashboard-review-followups/`). Lesson: —.
