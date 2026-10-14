# Rejestracja i logowanie email + hasło — plan implementacji

## Overview

Roadmapa S-03 (`email-password-sign-in`, FR-001, FR-002). Dodajemy Supabase Auth: rejestrację, logowanie, przywracanie sesji, wylogowanie i ochronę tras. Niezalogowana osoba trafia na `/login`. Auth działa wyłącznie przy `DATA_BACKEND=supabase`. Przy domyślnym `local` aplikacja zachowuje się dokładnie jak dziś, bez ekranów logowania i bez żądań do Supabase. Dane finansowe w tej zmianie zostają lokalne, bo tabele i RLS wchodzą w S-04.

Plan wykona tańszy model, dlatego kontrakty, nazwy, teksty UI i polecenia są podane dosłownie. Teksty widoczne dla użytkownika są po polsku i mają brzmieć dokładnie jak w planie, bo testy E2E na nich polegają.

## Current State Analysis

- Klient Supabase już istnieje: `src/app/core/supabase/supabase-client.service.ts:11-29`. Ma właściwość `enabled` (`dataBackend === 'supabase'`) i metodę `getClient()`, która ładuje `@supabase/supabase-js` dynamicznie. Przy `local` metoda odrzuca. Komponenty nie mogą używać tego serwisu (AGENTS.md); dostęp mają tylko serwisy w `core/`.
- Konfiguracja runtime: `src/app/core/config/runtime-config.ts` (token `RUNTIME_CONFIG`). Plik `src/environments/runtime-config.generated.ts` generuje `scripts/generate-runtime-config.mjs` przez hooki `prestart`, `prebuild` i `pretest`. Domyślny backend to `local`.
- Routing ma jedną trasę: `src/app/app.routes.ts` (`''` → `dashboard`, `dashboard` lazy, `**` → `dashboard`). Nie ma guardów.
- Nagłówek dashboardu: `src/app/features/budget-app/budget-main.component.ts:80-135`. Po lewej logo, w środku nawigacja miesięcy, po prawej przycisk „Dodaj wydatek” z klasą `hidden sm:flex`. Na mobile dodawanie obsługuje FAB.
- Wzorzec formularza: `budget-limit-modal.component.ts` (standalone, `ReactiveFormsModule`, `ChangeDetectionStrategy.Eager`, ciemne klasy Tailwind: `bg-[#111827]`, `border-slate-800`, akcent `emerald-500`).
- Toasty: `src/app/core/services/notification.service.ts`, `NotificationService` z metodą `show({ type, title, message })`.
- Lokalny Supabase działa w Dockerze. W `supabase/config.toml` jest `enable_confirmations = false`, `minimum_password_length = 6` i `sign_in_sign_ups = 30` (limit na 5 minut na IP). `npx supabase status -o env` zwraca `API_URL="http://127.0.0.1:54321"` i `PUBLISHABLE_KEY="sb_publishable_…"`.
- E2E: `playwright.config.ts` ma testDir `./e2e`, `npm start` na porcie 4200 i projekty Desktop Chrome oraz Mobile Pixel. 10 testów w `e2e/budget-dashboard.spec.ts` zakłada wejście na dashboard bez logowania.
- `process.loadEnvFile('.env')` w generatorze nie nadpisuje zmiennych już ustawionych w środowisku (sprawdzone). Zmienne przekazane przez Playwright `webServer.env` mają więc pierwszeństwo przed `.env`.

## Desired End State

- Przy `DATA_BACKEND=local`: aplikacja działa jak dziś, a 10 istniejących testów E2E przechodzi bez zmian. `/login` i `/register` przekierowują na `/dashboard`. Nie ma przycisku „Wyloguj” ani żądań do Supabase.
- Przy `DATA_BACKEND=supabase`:
  - wejście na `/dashboard` bez sesji przekierowuje na `/login`;
  - rejestracja na `/register` loguje od razu, gdy Supabase zwróci sesję. Gdy zwróci użytkownika bez sesji (włączone potwierdzanie maila), pokazuje panel „Sprawdź skrzynkę”;
  - logowanie na `/login` przenosi na `/dashboard`;
  - po odświeżeniu strony sesja jest przywracana, a użytkownik zostaje na dashboardzie;
  - „Wyloguj” w nagłówku dashboardu kończy sesję i przenosi na `/login`;
  - zalogowany użytkownik wchodzący na `/login` lub `/register` trafia na `/dashboard`;
  - utrata sesji bez akcji użytkownika (np. nieudane odświeżenie tokenu) przenosi na `/login` z toastem „Sesja wygasła”.
- `npm run test:e2e:auth` uruchamia pakiet Auth przeciw lokalnemu stackowi Supabase na porcie 4300 i przechodzi na Desktop Chrome i Mobile Pixel.

### Key Discoveries:

- `src/app/core/supabase/supabase-client.service.ts:18-28`: `getClient()` odrzuca przy `local`, więc guardy i `AuthService` muszą najpierw sprawdzić `enabled` i nigdy nie wołać `getClient()` w trybie local.
- `scripts/generate-runtime-config.mjs:9`: ścieżka wyjściowa jest stała. Drugi serwer dev z `DATA_BACKEND=supabase` nadpisałby config serwera na porcie 4200, dlatego potrzebny jest osobny plik wyjściowy i konfiguracja Angulara `e2e-auth`.
- `supabase/config.toml` `[auth.email] enable_confirmations = false`: lokalnie `signUp` zwraca sesję od razu, więc E2E nie musi czytać maili.
- `src/app/features/budget-app/budget-main.component.ts:126-134`: przycisk dodawania w nagłówku jest ukryty na mobile. Przycisk wylogowania musi być widoczny na każdej szerokości i nie może zwiększać wysokości nagłówka (Safe-to-Spend bez przewijania na Pixel 7).

## What We're NOT Doing

- Tabele, RLS i repozytoria Supabase dla danych (to S-04 i S-05). Dane finansowe zostają w localStorage, także po zalogowaniu.
- Izolacja lokalnych danych między kontami na jednym urządzeniu. Przy `DATA_BACKEND=supabase` dwa konta w tej samej przeglądarce widzą te same lokalne dane. To świadomy, tymczasowy stan, bo `supabase` nie jest włączony w żadnym deployu przed S-08, a S-04 wymienia repozytoria. Nie czyścimy danych przy wylogowaniu i nie dodajemy prefiksu z id użytkownika.
- Reset hasła, zmiana hasła, logowanie przez OAuth, magic link i anonimowe konta.
- Mockowy Auth w trybie local.
- Zachowywanie niezapisanego formularza przy wygaśnięciu sesji.
- Zmiany ustawień projektów Supabase staging/prod (potwierdzanie maila zostaje takie, jak jest w panelu) i zmiana `DATA_BACKEND` w Workers Builds.
- Deep linki Capacitor dla linku potwierdzającego maila (S-07).
- Parametr `returnUrl` po logowaniu. Jest tylko jedna chroniona trasa, więc po zalogowaniu zawsze idziemy na `/dashboard`.
- Zmiany w `e2e/budget-dashboard.spec.ts`.

## Implementation Approach

Auth ma tę samą granicę co repozytoria: jeden serwis w `src/app/core/auth/` korzysta z `SupabaseClientService`, a komponenty i guardy znają tylko ten serwis. Stan sesji trzymają Signals. Inicjalizacja jest leniwa: pierwsze wywołanie `whenReady()` (z guardu) odczytuje sesję i subskrybuje `onAuthStateChange`. W trybie local serwis jest od razu gotowy, nie ma sesji, a guardy przepuszczają. Błędy Supabase zamienia na polskie komunikaty czysta funkcja z testami. Pakiet E2E Auth działa na osobnym porcie z osobnym wygenerowanym configiem, więc domyślny `npm run test:e2e` nie wymaga Dockera.

## Critical Implementation Details

- **Callback `onAuthStateChange`**: supabase-js trzyma blokadę podczas wywołania callbacku. Wywołanie w nim `await` na innej metodzie `supabase.auth.*` może zakleszczyć klienta. Callback ma być synchroniczny: tylko ustawia signal sesji i ewentualnie wywołuje `router.navigateByUrl` oraz toast bez `await`.
- **Kolejność inicjalizacji**: guard musi poczekać na `whenReady()`. Inaczej po odświeżeniu strony z ważną sesją guard zobaczy `session === null` i błędnie przekieruje na `/login`. `whenReady()` rozwiązuje się dopiero po `getSession()`.
- **Rozróżnienie wylogowania**: `signOut()` ustawia prywatną flagę `signingOut = true` przed wywołaniem klienta. Callback `SIGNED_OUT` pokazuje toast „Sesja wygasła” tylko wtedy, gdy flaga jest `false`, a potem ją zeruje. W obu przypadkach nawiguje na `/login`.

## Phase 1: Rdzeń Auth

### Overview

Serwis sesji, mapowanie błędów i guardy z testami jednostkowymi. Dashboard dostaje `authGuard`, który w trybie local przepuszcza, więc zachowanie aplikacji się nie zmienia.

### Changes Required:

#### 1. Mapowanie błędów Auth

**File**: `src/app/core/auth/auth-errors.ts` (+ `auth-errors.spec.ts`)

**Intent**: Jedna czysta funkcja zamienia błąd z supabase-js (lub dowolny wyjątek) na polski komunikat dla formularza, żeby komponenty nie znały kodów Supabase.

**Contract**: `export function authErrorMessage(error: unknown): string`. Odczytuje `code` (string) z obiektu błędu, jeśli istnieje. Dokładna tabela:

| `code` | Komunikat |
|---|---|
| `invalid_credentials` | `Nieprawidłowy email lub hasło.` |
| `user_already_exists`, `email_exists` | `Konto z tym adresem już istnieje.` |
| `weak_password` | `Hasło jest za słabe. Użyj co najmniej 6 znaków.` |
| `email_not_confirmed` | `Potwierdź adres email, klikając link w wiadomości.` |
| `over_request_rate_limit`, `over_email_send_rate_limit` | `Zbyt wiele prób. Spróbuj ponownie za kilka minut.` |
| `validation_failed`, `email_address_invalid` | `Sprawdź poprawność adresu email.` |
| błąd o `name === 'AuthRetryableFetchError'` albo `TypeError` (brak sieci) | `Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.` |
| każdy inny | `Coś poszło nie tak. Spróbuj ponownie.` |

Test sprawdza każdy wiersz tabeli oraz `null` i `undefined` (wynik domyślny).

#### 2. Serwis sesji

**File**: `src/app/core/auth/auth.service.ts` (+ `auth.service.spec.ts`)

**Intent**: Jedyne miejsce w aplikacji, które woła `supabase.auth`. Trzyma stan sesji w Signals, przywraca sesję przy starcie, udostępnia rejestrację, logowanie i wylogowanie oraz reaguje na utratę sesji.

**Contract**: `@Injectable({ providedIn: 'root' }) export class AuthService` z zależnościami `SupabaseClientService`, `Router` i `NotificationService`.

- `readonly enabled: boolean`: kopia `SupabaseClientService.enabled`.
- `readonly session: Signal<Session | null>` (typ `Session` z `@supabase/supabase-js`, importowany wyłącznie jako `import type`).
- `readonly userEmail: Signal<string | null>`: computed z `session()?.user.email`.
- `readonly isAuthenticated: Signal<boolean>`: computed.
- `whenReady(): Promise<void>`: idempotentne, tworzy jedną współdzieloną obietnicę. Przy `!enabled` rozwiązuje się od razu i nie woła `getClient()`. Przy `enabled` woła `getClient()`, potem `auth.getSession()` i ustawia `session`, a następnie rejestruje `auth.onAuthStateChange(callback)`. Jeśli `getClient()` albo `getSession()` rzuci, ustawia `session = null` i się rozwiązuje (nie odrzuca), więc guard przekieruje na `/login`.
- `signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; message: string }>`: `signInWithPassword`. Przy sukcesie ustawia `session` z odpowiedzi. Błąd zamienia przez `authErrorMessage`. Nigdy nie rzuca.
- `signUp(email: string, password: string): Promise<{ status: 'signed-in' } | { status: 'confirmation-required' } | { status: 'error'; message: string }>`: `auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } })`. Gdy `data.session` istnieje, zwraca `signed-in` i ustawia `session`. Gdy jej nie ma i nie ma błędu, zwraca `confirmation-required`. Nigdy nie rzuca.
- `signOut(): Promise<void>`: ustawia flagę `signingOut`, woła `auth.signOut()`. Przy błędzie pokazuje toast `{ type: 'error', title: 'Nie udało się wylogować' }`, zeruje flagę i nie nawiguje. Przy sukcesie nawigację wykonuje callback `SIGNED_OUT`.
- Callback `onAuthStateChange(event, session)`: zawsze ustawia `session` signal. Przy `event === 'SIGNED_OUT'` wywołuje `router.navigateByUrl('/login')`, a gdy `signingOut === false`, także `notifications.show({ type: 'warning', title: 'Sesja wygasła', message: 'Zaloguj się ponownie.' })`. Na koniec zeruje flagę. Zero `await` w callbacku (patrz Critical Implementation Details).

**Testy** (`auth.service.spec.ts`, Vitest `expect`, `vi.fn()`; `SupabaseClientService` podstawiony w TestBed przez `useValue: { enabled, getClient: () => Promise.resolve(fakeClient) }`, a `fakeClient.auth` to obiekt z `vi.fn()` dla `getSession`, `onAuthStateChange`, `signInWithPassword`, `signUp`, `signOut`; `Router` jako `{ navigateByUrl: vi.fn() }`):
- przy `enabled: false` `whenReady()` się rozwiązuje, `getClient` nie jest wołany, a `isAuthenticated()` zwraca `false`;
- `whenReady()` przywraca sesję z `getSession` i woła `getSession` tylko raz przy dwóch wywołaniach;
- `signIn` przy sukcesie zwraca `{ ok: true }`, a przy błędzie `{ code: 'invalid_credentials' }` zwraca komunikat z tabeli;
- `signUp` zwraca `signed-in`, gdy jest sesja, i `confirmation-required`, gdy jej nie ma;
- `SIGNED_OUT` bez `signOut()` nawiguje na `/login` i pokazuje toast; po `signOut()` nawiguje bez toastu.

#### 3. Guardy tras

**File**: `src/app/core/auth/auth.guards.ts` (+ `auth.guards.spec.ts`)

**Intent**: `authGuard` chroni dashboard, a `guestGuard` zamyka ekrany logowania przed zalogowanymi i przed trybem local.

**Contract**: dwie funkcje `CanActivateFn` (async, `inject(AuthService)`, `inject(Router)`):
- `authGuard`: `!auth.enabled` → `true`; w pozostałych przypadkach `await auth.whenReady()`, a potem `auth.isAuthenticated() ? true : router.createUrlTree(['/login'])`.
- `guestGuard`: `!auth.enabled` → `router.createUrlTree(['/dashboard'])`; w pozostałych przypadkach `await auth.whenReady()`, a potem `auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true`.

Testy przez `TestBed.runInInjectionContext` z zamockowanym `AuthService` obejmują wszystkie 6 kombinacji (local / supabase bez sesji / supabase z sesją × 2 guardy).

#### 4. Podpięcie guardu pod dashboard

**File**: `src/app/app.routes.ts`

**Intent**: Dashboard staje się chroniony. W trybie local guard przepuszcza, więc zachowanie się nie zmienia.

**Contract**: trasa `dashboard` dostaje `canActivate: [authGuard]`. Trasy `/login` i `/register` dochodzą w fazie 2.

### Success Criteria:

#### Automated Verification:

- Testy jednostkowe Auth przechodzą: `npm test -- --watch=false --include src/app/core/auth`
- Pełna bramka przechodzi: `npm run check`
- Istniejące E2E przechodzą bez zmian (tryb local): `npm run test:e2e`

#### Manual Verification:

- Przy `DATA_BACKEND=local` (`npm start`) zakładka Network nie pokazuje żadnych żądań do `127.0.0.1:54321` ani `*.supabase.co`

**Implementation Note**: Po przejściu weryfikacji automatycznej zatrzymaj się na ręczne potwierdzenie przed fazą 2.

---

## Phase 2: Ekrany logowania, rejestracji i wylogowanie

### Overview

Dwa lazy-loaded ekrany w `src/app/features/auth/`, trasy z `guestGuard` i przycisk „Wyloguj” w nagłówku dashboardu (tylko przy `auth.enabled`).

### Changes Required:

#### 1. Ekran logowania

**File**: `src/app/features/auth/login.component.ts` (+ `login.component.spec.ts`)

**Intent**: Formularz email i hasło, który loguje przez `AuthService` i po sukcesie przechodzi na dashboard.

**Contract**: standalone, `selector: 'app-login'`, `ReactiveFormsModule`, `RouterLink`, `ChangeDetectionStrategy.Eager`, inline template (jak w `budget-limit-modal.component.ts`). Layout: wyśrodkowana karta `max-w-sm` w stylu modali dashboardu (`bg-[#111827] border border-slate-800 rounded-3xl p-6`) na tle `bg-[#0b0f19]`, `min-h-screen`. Elementy, dokładne teksty:
- nagłówek `<h1>`: `Zaloguj się`, pod nim podtytuł `Portfel Bez Spiny`;
- pole `<input id="auth-email" type="email" autocomplete="email">` z `<label for="auth-email">Email</label>`, walidatory `required` i `email`;
- pole `<input id="auth-password" type="password" autocomplete="current-password">` z `<label for="auth-password">Hasło</label>`, walidator `required`;
- przycisk submit z tekstem `Zaloguj się`, a podczas wysyłania `Logowanie…`. Jest wyłączony, gdy formularz jest niepoprawny albo trwa wysyłanie;
- komunikat błędu `<p role="alert" data-testid="auth-error">` z tekstem z `signIn`, widoczny tylko przy błędzie;
- link `routerLink="/register"` z tekstem `Nie masz konta? Załóż konto`.

Stan to Signals: `pending = signal(false)` i `error = signal<string | null>(null)`. Po `{ ok: true }` następuje `router.navigateByUrl('/dashboard')`.

Testy z zamockowanym `AuthService`: błąd pokazuje `auth-error` z komunikatem, a sukces wywołuje nawigację na `/dashboard`.

#### 2. Ekran rejestracji

**File**: `src/app/features/auth/register.component.ts` (+ `register.component.spec.ts`)

**Intent**: Formularz zakładania konta, który obsługuje oba warianty: natychmiastową sesję i wymagane potwierdzenie maila.

**Contract**: ten sam styl i struktura co logowanie. `selector: 'app-register'`. Różnice:
- nagłówek `Załóż konto`;
- hasło: `id="auth-password"`, `autocomplete="new-password"`, walidatory `required` i `minLength(6)`, podpowiedź pod polem `Co najmniej 6 znaków.`;
- przycisk `Załóż konto`, a podczas wysyłania `Zakładanie konta…`;
- wynik `signed-in` → `router.navigateByUrl('/dashboard')`;
- wynik `confirmation-required` → formularz zostaje zastąpiony panelem `data-testid="auth-confirmation"` z tekstem `Sprawdź skrzynkę` (nagłówek) i `Wysłaliśmy link potwierdzający na adres {{ email }}. Po kliknięciu linku wrócisz do aplikacji.` oraz linkiem `routerLink="/login"` z tekstem `Przejdź do logowania`;
- wynik `error` → `auth-error` jak w logowaniu;
- link pod formularzem `routerLink="/login"`: `Masz już konto? Zaloguj się`.

Testy: `confirmation-required` pokazuje panel z emailem, `signed-in` nawiguje na `/dashboard`.

#### 3. Trasy

**File**: `src/app/app.routes.ts`

**Intent**: Udostępnić ekrany Auth, chronione przed zalogowanymi i przed trybem local.

**Contract**: przed trasą `**` dochodzą dwie trasy:
- `{ path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent), title: 'Logowanie | Portfel Bez Spiny' }`
- `{ path: 'register', canActivate: [guestGuard], loadComponent: …RegisterComponent, title: 'Rejestracja | Portfel Bez Spiny' }`

#### 4. Wylogowanie w nagłówku dashboardu

**File**: `src/app/features/budget-app/budget-main.component.ts`

**Intent**: Pozwolić zalogowanemu użytkownikowi się wylogować bez nowego ekranu i bez przesuwania Safe-to-Spend.

**Contract**: wstrzyknąć `AuthService` jako `readonly auth`. Prawą część nagłówka owinąć w `<div class="flex items-center gap-2">`, a w nim: istniejący przycisk „Dodaj wydatek” (bez zmian klas) oraz `@if (auth.enabled) { <button type="button" (click)="auth.signOut()" aria-label="Wyloguj" title="Wyloguj" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"><ion-icon name="log-out-outline" class="text-lg"></ion-icon></button> }`. Ikonę `logOutOutline` dodać do istniejącego `addIcons({...})` w konstruktorze. Przycisk musi być widoczny także na mobile, bez klasy `hidden`. Wysokość nagłówka nie może wzrosnąć.

#### 5. Test trybu local

**File**: `e2e/local-mode.spec.ts`

**Intent**: Zabezpieczyć, że w trybie local ekrany Auth są niedostępne, a wylogowania nie ma.

**Contract**: jeden `test.describe('Portfel Bez Spiny — tryb local bez logowania')` z testem `11. Login and register redirect to the dashboard in local mode`: `page.goto('/login')` → `expect(page).toHaveURL(/\/dashboard$/)`. To samo dla `/register`. Na koniec `expect(page.getByRole('button', { name: 'Wyloguj' })).toHaveCount(0)`.

### Success Criteria:

#### Automated Verification:

- Testy jednostkowe komponentów Auth przechodzą: `npm test -- --watch=false --include src/app/features/auth`
- Pełna bramka przechodzi: `npm run check`
- Wszystkie E2E w trybie local przechodzą (10 istniejących + test 11): `npm run test:e2e`
- Build APK przechodzi: `npm run cap:build:apk`

#### Manual Verification:

- Przy `.env` z `DATA_BACKEND=supabase` i lokalnym stackiem (`SUPABASE_URL_STAGING=http://127.0.0.1:54321`, `SUPABASE_PUBLISHABLE_KEY_STAGING` z `npx supabase status -o env`) `npm start` → `/dashboard` przekierowuje na `/login`, rejestracja loguje, odświeżenie zachowuje sesję, a „Wyloguj” wraca na `/login`
- Na widoku Pixel 7 (DevTools) przycisk „Wyloguj” mieści się w nagłówku, a „Bezpiecznie na dziś:” jest widoczne bez przewijania
- Po teście ręcznym `.env` wraca do `DATA_BACKEND=local`

**Implementation Note**: Po przejściu weryfikacji automatycznej zatrzymaj się na ręczne potwierdzenie przed fazą 3.

---

## Phase 3: Pakiet E2E Auth na lokalnym Supabase

### Overview

Osobna konfiguracja Playwright uruchamia drugi serwer dev na porcie 4300 z `DATA_BACKEND=supabase` i lokalnym stackiem. Używa własnego wygenerowanego configu, więc nie koliduje z `npm start` na porcie 4200. Domyślne `npm run test:e2e` ignoruje ten pakiet.

### Changes Required:

#### 1. Generator configu z parametrem `--out`

**File**: `scripts/generate-runtime-config.mjs`

**Intent**: Pozwolić wygenerować config do innego pliku, nie ruszając domyślnego, z którego korzysta serwer na porcie 4200.

**Contract**: opcjonalny argument CLI `--out <ścieżka względna do root>`. Bez argumentu zachowanie jest identyczne jak dziś. Z argumentem config trafia do wskazanego pliku. Dodatkowo, jeśli domyślny `src/environments/runtime-config.generated.ts` nie istnieje, generator zapisuje go z `dataBackend: 'local'`, `supabaseTarget: 'staging'` i pustymi URL i kluczem. Plik musi istnieć, żeby import w `runtime-config.ts` się rozwiązywał. Istniejącego pliku nie nadpisuje. Walidacje (prefiks `sb_publishable_`, https poza localhost) działają w obu trybach.

#### 2. Konfiguracja Angulara `e2e-auth`

**File**: `angular.json`

**Intent**: Build dev, który podmienia wygenerowany config na plik pakietu Auth.

**Contract**: w `architect.build.configurations` nowa konfiguracja `"e2e-auth"`: kopia `"development"` (`optimization: false`, `extractLicenses: false`, `sourceMap: true`) plus `"fileReplacements": [{ "replace": "src/environments/runtime-config.generated.ts", "with": "src/environments/runtime-config.e2e-auth.generated.ts" }]`. W `architect.serve.configurations` nowa konfiguracja `"e2e-auth": { "buildTarget": "cost-management-app:build:e2e-auth" }`.

#### 3. Skrypty npm i ignorowane pliki

**File**: `package.json`, `.gitignore`

**Intent**: Jedno polecenie do serwera pakietu Auth i jedno do testów. Wygenerowany plik nie trafia do Gita ani do Prettiera (Prettier respektuje `.gitignore`).

**Contract**:
- `"serve:e2e-auth": "node scripts/generate-runtime-config.mjs --out src/environments/runtime-config.e2e-auth.generated.ts && ng serve --configuration e2e-auth --port 4300"`
- `"test:e2e:auth": "playwright test -c playwright.auth.config.ts"`
- `.gitignore`: dopisać `/src/environments/runtime-config.e2e-auth.generated.ts` pod istniejącym wpisem `/src/environments/runtime-config.generated.ts`.

#### 4. Konfiguracje Playwright

**File**: `playwright.config.ts`, `playwright.auth.config.ts` (nowy)

**Intent**: Rozdzielić pakiety. Pakiet Auth sam pobiera URL i publishable key lokalnego stacka.

**Contract**:
- `playwright.config.ts`: dodać `testIgnore: 'auth/**'`. Nic więcej nie zmieniać.
- `playwright.auth.config.ts`: `testDir: './e2e/auth'`, `baseURL: 'http://localhost:4300'`, te same `forbidOnly`, `retries`, `reporter`, `use` (trace, screenshot, video) i te same dwa projekty co w `playwright.config.ts`. Na górze pliku synchronicznie (`execSync('npx supabase status -o env', { encoding: 'utf8' })`) odczytać `API_URL` i `PUBLISHABLE_KEY`: sparsować linie `KEY="value"` i zdjąć cudzysłowy. Jeśli polecenie się nie powiedzie albo brakuje wartości, rzucić `Error('Lokalny Supabase nie działa. Uruchom: npx supabase start')`. `webServer`: `{ command: 'npm run serve:e2e-auth', url: 'http://localhost:4300', reuseExistingServer: !process.env['CI'], timeout: 120_000, env: { DATA_BACKEND: 'supabase', SUPABASE_URL_STAGING: apiUrl, SUPABASE_PUBLISHABLE_KEY_STAGING: publishableKey } }`. Nigdy nie czytać ani nie przekazywać `SECRET_KEY` ani `SERVICE_ROLE_KEY`.

#### 5. Testy E2E Auth

**File**: `e2e/auth/auth-flow.spec.ts`

**Intent**: Udowodnić FR-001 i przekierowania FR-002 na prawdziwym Supabase Auth.

**Contract**: helper `uniqueEmail()` zwraca `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`. Hasło testowe: stała `'Haslo-testowe-123'`. Helper `register(page, email)` wchodzi na `/register`, wypełnia `#auth-email` i `#auth-password`, klika `getByRole('button', { name: 'Załóż konto' })` i czeka na `toHaveURL(/\/dashboard$/)`. Testy w `test.describe('Portfel Bez Spiny — logowanie')`:
1. `Unauthenticated visitor is redirected to login`: `goto('/dashboard')` → URL `/login`, widoczny nagłówek `Zaloguj się`.
2. `Register, restore session after reload, sign out`: `register` → widoczny `[data-testid=safe-to-spend]` → `page.reload()` → nadal `/dashboard` → klik `getByRole('button', { name: 'Wyloguj' })` → URL `/login` → `goto('/dashboard')` → URL `/login`.
3. `Sign in with an existing account and redirect away from login`: `register` → Wyloguj → na `/login` wypełnić dane i kliknąć `Zaloguj się` → URL `/dashboard` → `goto('/login')` → URL `/dashboard`.
4. `Wrong password shows an error`: `register` → Wyloguj → logowanie z hasłem `'zle-haslo-999'` → `[data-testid=auth-error]` ma tekst `Nieprawidłowy email lub hasło.`, URL zostaje `/login`.
5. `Registering an existing email shows an error`: `register` → Wyloguj → `/register` z tym samym emailem → `[data-testid=auth-error]` ma tekst `Konto z tym adresem już istnieje.`

Każdy test używa własnego unikalnego emaila. 5 testów × 2 projekty to około 10 rejestracji na przebieg, poniżej limitu `sign_in_sign_ups = 30` na 5 minut.

#### 6. Dokumentacja

**File**: `README.md`, `.env.example`

**Intent**: Opisać, jak uruchomić pakiet Auth i jak lokalnie przetestować logowanie.

**Contract**:
- `README.md`, sekcja „Uruchamianie i weryfikacja”: dodać `npm run test:e2e:auth` do bloku poleceń i jedno zdanie, że pakiet wymaga `npx supabase start` i sam pobiera URL oraz publishable key lokalnego stacka.
- `README.md`, sekcja „Status projektu”: jedno zdanie, że przy `DATA_BACKEND=supabase` działa logowanie, ale dane nadal są lokalne dla przeglądarki do czasu prywatnych repozytoriów (S-04).
- `.env.example`: komentarz, że `DATA_BACKEND=supabase` z lokalnym stackiem włącza ekrany logowania, a klucz pochodzi z `npx supabase status -o env` (`PUBLISHABLE_KEY`).

### Success Criteria:

#### Automated Verification:

- Pakiet Auth przechodzi na obu projektach (wymaga `npx supabase start`): `npm run test:e2e:auth`
- Domyślne E2E nie uruchamia testów z `e2e/auth` i przechodzi: `npm run test:e2e`
- Pełna bramka przechodzi: `npm run check`
- Plik `src/environments/runtime-config.e2e-auth.generated.ts` jest ignorowany: `git check-ignore src/environments/runtime-config.e2e-auth.generated.ts`
- Bundle nie zawiera kluczy uprzywilejowanych (postbuild w `npm run build` kończy się sukcesem)

#### Manual Verification:

- Równoległe `npm start` (4200, local) i `npm run test:e2e:auth` (4300) nie przełączają serwera 4200 w tryb supabase: po przebiegu `/login` na 4200 nadal przekierowuje na `/dashboard`
- Opcjonalnie na stagingu (`.env` z danymi stagingu, `DATA_BACKEND=supabase`, `npm start`): rejestracja prawdziwym adresem. Jeśli staging wymaga potwierdzenia, pojawia się panel „Sprawdź skrzynkę”, a link z maila prowadzi na `/dashboard` zalogowanego użytkownika (Redirect URL `http://localhost:4200/**` jest w allow list stagingu)

---

## Testing Strategy

### Unit Tests:

- `authErrorMessage`: każdy kod z tabeli, błąd sieci i wartość nieznana.
- `AuthService`: tryb wyłączony bez kontaktu z klientem, jednokrotne przywracanie sesji, wyniki `signIn` i `signUp`, rozróżnienie wygaśnięcia i wylogowania.
- `authGuard` i `guestGuard`: 6 kombinacji trybu i sesji.
- `LoginComponent` i `RegisterComponent`: komunikat błędu, nawigacja po sukcesie, panel potwierdzenia.

### Integration Tests:

- `e2e/local-mode.spec.ts`: tryb local bez ekranów Auth.
- `e2e/auth/auth-flow.spec.ts`: rejestracja, przywracanie sesji, wylogowanie, logowanie, przekierowania i błędy na lokalnym Supabase.

### Manual Testing Steps:

1. `npm start` w trybie local: dashboard bez zmian, brak przycisku „Wyloguj”, brak żądań do Supabase.
2. `.env` z `DATA_BACKEND=supabase` i lokalnym stackiem: pełny przepływ rejestracji, odświeżenia i wylogowania. Pixel 7: nagłówek mieści przycisk, Safe-to-Spend jest widoczny bez przewijania.
3. Opcjonalnie: staging z prawdziwym adresem email i panelem potwierdzenia.

## Performance Considerations

`@supabase/supabase-js` ładuje się nadal dynamicznie i tylko przy `DATA_BACKEND=supabase`. `AuthService` importuje typy wyłącznie przez `import type`, więc bundle trybu local nie rośnie o bibliotekę. `whenReady()` przy `enabled` dodaje jedno odczytanie sesji z localStorage przed pierwszym wejściem na dashboard (bez sieci, chyba że token wymaga odświeżenia).

## Migration Notes

Brak migracji danych i schematu. Przełącznik `DATA_BACKEND` pozostaje `local` we wszystkich deployach. Wycofanie zmiany to revert commitów, bez skutków dla danych użytkowników.

## References

- Roadmapa: `context/foundation/roadmap.md` (S-03)
- PRD: `context/foundation/prd.md` (FR-001, FR-002, Access Control Changes)
- Plan dostarczenia: `context/changes/stabilize-and-supabase-mvp/change.md` (faza 6)
- Fundament Supabase: `context/deployment/deploy-plan.md` (Etap 2, Etap 4, Etap 6)
- Klient: `src/app/core/supabase/supabase-client.service.ts:11-29`
- Generator configu: `scripts/generate-runtime-config.mjs`
- Wzorzec formularza: `src/app/features/budget-app/budget-limit-modal.component.ts`
- Nagłówek dashboardu: `src/app/features/budget-app/budget-main.component.ts:80-135`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Rdzeń Auth

#### Automated

- [x] 1.1 Testy jednostkowe Auth przechodzą: `npm test -- --watch=false --include src/app/core/auth`
- [x] 1.2 Pełna bramka przechodzi: `npm run check`
- [x] 1.3 Istniejące E2E przechodzą bez zmian (tryb local): `npm run test:e2e`

#### Manual

- [x] 1.4 Przy `DATA_BACKEND=local` brak żądań do Supabase w zakładce Network

### Phase 2: Ekrany logowania, rejestracji i wylogowanie

#### Automated

- [ ] 2.1 Testy jednostkowe komponentów Auth przechodzą: `npm test -- --watch=false --include src/app/features/auth`
- [ ] 2.2 Pełna bramka przechodzi: `npm run check`
- [ ] 2.3 Wszystkie E2E w trybie local przechodzą (10 istniejących + test 11): `npm run test:e2e`
- [ ] 2.4 Build APK przechodzi: `npm run cap:build:apk`

#### Manual

- [ ] 2.5 Przepływ rejestracja → odświeżenie → wylogowanie działa przy `DATA_BACKEND=supabase` z lokalnym stackiem
- [ ] 2.6 Na Pixel 7 przycisk „Wyloguj” mieści się w nagłówku, Safe-to-Spend widoczny bez przewijania
- [ ] 2.7 `.env` przywrócony do `DATA_BACKEND=local`

### Phase 3: Pakiet E2E Auth na lokalnym Supabase

#### Automated

- [ ] 3.1 Pakiet Auth przechodzi na obu projektach: `npm run test:e2e:auth`
- [ ] 3.2 Domyślne E2E nie uruchamia testów z `e2e/auth` i przechodzi: `npm run test:e2e`
- [ ] 3.3 Pełna bramka przechodzi: `npm run check`
- [ ] 3.4 Wygenerowany config pakietu Auth jest ignorowany przez Git
- [ ] 3.5 Skan bundla w postbuild kończy się sukcesem

#### Manual

- [ ] 3.6 Równoległe serwery 4200 (local) i 4300 (supabase) nie kolidują
- [ ] 3.7 Opcjonalnie: rejestracja na stagingu z panelem potwierdzenia i linkiem z maila
