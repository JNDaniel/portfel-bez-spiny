# Rejestracja i logowanie email + hasło — Plan Brief

> Full plan: `context/changes/email-password-sign-in/plan.md`

## What & Why

Roadmapa S-03 (FR-001, FR-002): niezalogowana osoba może założyć konto, zalogować się, wrócić do sesji i się wylogować, a wejście na dashboard bez sesji kończy się przekierowaniem do logowania. To pierwszy krok do prywatnych danych, bo S-04 (prywatny budżet z RLS) wymaga zalogowanego użytkownika.

## Starting Point

Leniwy `SupabaseClientService` i przełącznik `DATA_BACKEND` (domyślnie `local`) już istnieją. Aplikacja ma jedną trasę `/dashboard` bez guardów i bez ekranów Auth. Lokalny stack Supabase działa w Dockerze z wyłączonym potwierdzaniem maila.

## Desired End State

Przy `DATA_BACKEND=supabase` dashboard jest chroniony. Działają `/login` i `/register`, sesja przetrwa odświeżenie, a „Wyloguj” w nagłówku wraca na `/login`. Przy `local` wszystko działa jak dziś. Osobny pakiet `npm run test:e2e:auth` udowadnia przepływ na prawdziwym lokalnym Supabase.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Zakres („F3”) | S-03 `email-password-sign-in` | Jedyna pozycja roadmapy z kompletem spełnionych wymagań wstępnych. |
| Tryb `local` | Auth działa tylko przy `supabase`; przy `local` guard przepuszcza, a `/login` przekierowuje na dashboard | Demo i 10 istniejących E2E zostają bez zmian, zgodnie z zasadą „local = zero żądań do Supabase”. |
| Potwierdzanie maila | UI obsługuje oba warianty (sesja albo panel „Sprawdź skrzynkę”) | Kod nie zależy od ustawienia projektu Supabase. |
| Ekrany | Dwie trasy `/login` i `/register` w `features/auth/` | Czytelne URL-e dla guardów, przekierowań i E2E. |
| Wylogowanie | Ikona „Wyloguj” w istniejącym nagłówku dashboardu | Bez nowego ekranu i bez przesuwania Safe-to-Spend. |
| Dane lokalne po zalogowaniu | Bez zmian, udokumentowane jako tymczasowe | S-04 i tak wymienia repozytoria; `supabase` nie jest włączony w żadnym deployu. |
| E2E | Osobny pakiet na lokalnym Supabase, port 4300, osobny wygenerowany config | Prawdziwy Auth bez kolizji z serwerem na 4200 i bez Dockera w domyślnym E2E. |
| Wygaśnięcie sesji | Auto-refresh supabase-js; `SIGNED_OUT` bez akcji użytkownika → `/login` + toast | Wbudowany mechanizm, minimum kodu. |

## Scope

**In scope:**
- `AuthService` (Signals, przywracanie sesji, signUp/signIn/signOut) i polskie komunikaty błędów
- `authGuard` i `guestGuard`, trasy `/login` i `/register`
- Przycisk „Wyloguj” w nagłówku
- Pakiet E2E Auth, test trybu local, dokumentacja

**Out of scope:**
- Tabele, RLS i repozytoria Supabase (S-04, S-05)
- Izolacja lokalnych danych między kontami
- Reset hasła, OAuth, magic link
- Mock Auth w trybie local
- Deep linki Capacitor (S-07)
- Zmiany ustawień projektów Supabase i `DATA_BACKEND` w deployu

## Architecture / Approach

Komponenty i guardy → `AuthService` (`core/auth/`) → `SupabaseClientService` → `supabase.auth`. Serwis inicjalizuje się leniwie przez `whenReady()`, które wywołuje guard. Przy `local` nie dotyka klienta. Callback `onAuthStateChange` jest synchroniczny i tylko aktualizuje signal oraz przy `SIGNED_OUT` nawiguje na `/login`. Pakiet E2E Auth: `npm run serve:e2e-auth` generuje config do osobnego pliku (`--out`), a konfiguracja Angulara `e2e-auth` podmienia go przez `fileReplacements`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Rdzeń Auth | `AuthService`, mapowanie błędów, guardy, guard na dashboardzie, testy unit | Guard przed `whenReady()` przekieruje zalogowanego po odświeżeniu |
| 2. Ekrany i wylogowanie | `/login`, `/register`, „Wyloguj”, test trybu local, APK | Nagłówek na Pixel 7 nie może urosnąć |
| 3. E2E Auth | `--out` w generatorze, config `e2e-auth`, `playwright.auth.config.ts`, 5 testów, docs | `fileReplacements` i równoległe serwery |

**Prerequisites:** lokalny stack Supabase (`npx supabase start`) do ręcznych testów fazy 2 i do fazy 3. Node 24.
**Estimated effort:** około 5–8 h, 3 sesje implementacji.

## Open Risks & Assumptions

- Przy `DATA_BACKEND=supabase` dwa konta na jednym urządzeniu widzą te same dane lokalne do czasu S-04. Ryzyko jest akceptowalne, bo tryb nie jest włączony w żadnym deployu.
- Link potwierdzający z maila na stagingu działa tylko dla hostów z Redirect allow list. W aplikacji Android (origin `https://localhost`) nie zadziała do S-07.
- Kody błędów (`code`) zakładają aktualne supabase-js 2.x. Nieznany kod daje komunikat ogólny, nie błąd aplikacji.

## Success Criteria (Summary)

- Użytkownik zakłada konto, loguje się, po odświeżeniu nadal jest zalogowany i może się wylogować. Bez sesji nie wejdzie na dashboard.
- Tryb `local` działa dokładnie jak dziś: wszystkie dotychczasowe E2E są zielone i nie ma żądań do Supabase.
- `npm run check`, `npm run test:e2e`, `npm run test:e2e:auth` i `npm run cap:build:apk` przechodzą.
