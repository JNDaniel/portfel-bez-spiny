---
date: 2026-10-14T20:42:21+02:00
researcher: Claude (Opus 5.5) dla Daniel Janowski
git_commit: 8d34c7b
branch: master
repository: cost-management-app
topic: "S-04: gotowość do przejścia z LocalStorage na Supabase oraz czy Supabase (Free) udźwignie ~50 użytkowników z działającymi mailami"
tags: [research, supabase, repositories, auth, rls, smtp, limits, s-04, s-08]
status: complete
last_updated: 2026-10-14
last_updated_by: Claude (Opus 5.5)
last_updated_note: "Sekcje 8-11: SMTP w SEOHOST, Resend/Brevo/SES, skala 5000/dzień, DNS w Cloudflare, Cloudflare Email Sending; sekcja 12: decyzja MVP bez maili (2026-10-14)"
---

# Research: gotowość S-04 i nośność Supabase dla ~50 użytkowników

**Date**: 2026-10-14T20:42:21+02:00
**Researcher**: Claude (Opus 5.5)
**Git Commit**: 8d34c7b
**Branch**: master
**Repository**: cost-management-app

## Research Question

1. Czy na etapie S-04 (`private-monthly-budget`) mamy przygotowane wszystko, żeby zacząć przechodzić z LocalStorage na Supabase?
2. Czy Supabase udźwignie „zwykły” ruch, a nie tylko testowy — konkretnie ok. 50 użytkowników — i czy będą działać maile (potwierdzenie konta, reset hasła)? Aktualne limity sprawdzone przez Exa web search.

## Summary

**Gotowość kodu (pytanie 1): tak, z czterema brakami, które są właściwym zakresem S-04.** Granica repozytoriów jest gotowa: wszystkie trzy kontrakty są asynchroniczne (`Promise`) i `MonthlyBudgetRepository` ma tylko `list()` i `setLimit()` (`src/app/core/repositories/monthly-budget.repository.ts:3-6`), więc adapter Supabase zmieści się bez zmiany kontraktu. Klient Supabase, `DATA_BACKEND`, logowanie, skan sekretów i lokalny stack (Mailpit) już działają. Brakuje:
- tabeli `monthly_budgets` z RLS (jedyna migracja to `supabase/migrations/20261003202153_baseline.sql` z funkcją `set_updated_at()`);
- adaptera `SupabaseMonthlyBudgetRepository` oraz przełączania providerów według `DATA_BACKEND` (dziś `src/app/app.config.ts:28-30` wiąże na sztywno klasy `Local*`);
- przeładowania/czyszczenia stanu `BudgetStateService` przy zmianie użytkownika (ładuje dane raz, w konstruktorze: `src/app/core/services/budget-state.service.ts:243-262`);
- infrastruktury testu izolacji dwóch użytkowników (brak `supabase/tests/`, pgTAP i skryptu `supabase test db`).

**Nośność (pytanie 2): baza i API Supabase Free bez problemu udźwigną 50 użytkowników. Maile na domyślnym mailerze nie zadziałają.** Wąskim gardłem nie jest wydajność, tylko trzy rzeczy:
- **Maile:** wbudowany SMTP Supabase wysyła wyłącznie na adresy członków zespołu organizacji i ma limit 2 maile/h na projekt. Obcy adres dostaje błąd „Email address not authorized”. Dotyczy to też resetu hasła. Potrzebny jest własny SMTP, np. Resend (Free: 100/dzień, 3000/mies.) albo Brevo (Free: 300/dzień). **Oba wymagają zweryfikowanej domeny z dostępem do DNS**, a plan wdrożenia nie obejmuje własnej domeny.
- **Kopie zapasowe:** plan Free ich nie ma.
- **Pauzowanie:** projekt Free jest wstrzymywany po tygodniu bez aktywności.

To są blokery S-08, a nie S-04. S-04 może iść dalej na lokalnym stacku i na stagingu.

## Detailed Findings

### 1. Granica repozytoriów i model budżetu

- Kontrakty (wszystkie metody zwracają `Promise`):
  - `ExpenseRepository`: `list/create/update/delete(ids)` (`src/app/core/repositories/expense.repository.ts:3-8`);
  - `ExpenseFolderRepository` (`src/app/core/repositories/expense-folder.repository.ts:3-7`);
  - `MonthlyBudgetRepository`: `list()`, `setLimit(effectiveFrom, limitMinor)` (`src/app/core/repositories/monthly-budget.repository.ts:3-6`).
- Model `MonthlyBudget {id, effectiveFrom: Period, limitMinor, currency: 'PLN'}` (`src/app/core/models/finance.model.ts:54-59`). `Period` to string `'YYYY-MM'` (`finance.model.ts:1`), a kwota to grosze (integer).
- Limit to historia typu „obowiązuje od”, a nie wiersz na każdy miesiąc. Według komentarza w `finance.model.ts:56` limit obowiązuje od danego miesiąca do następnego rekordu. Dla danego okresu domena wybiera najnowszy `effectiveFrom <= period` (`src/app/core/domain/budget-summary.ts:33-44`).
- Adapter lokalny robi upsert po `effectiveFrom` i ustawia na sztywno `currency: 'PLN'` (`src/app/core/repositories/local/local-monthly-budget.repository.ts:8-31`). Dane trzyma w jednym globalnym kluczu `pbs_finance_v1`, bez podziału na użytkowników (`local/local-finance.store.ts:12`).
- Wniosek dla schematu:
  - naturalny kształt tabeli to `unique(user_id, effective_from)`, a `setLimit` robi upsert z `onConflict: 'user_id,effective_from'`;
  - `user_id` nie występuje w modelu domenowym, więc adapter musi go dostarczyć: z domyślnej wartości kolumny `auth.uid()` albo z sesji;
  - sposób zapisu `'YYYY-MM'` (`text` z check constraintem czy `date` z pierwszym dniem miesiąca) jest wyborem projektowym S-04, repo go nie przesądza.

### 2. Przełącznik `DATA_BACKEND`

- Typ i token: `src/app/core/config/runtime-config.ts:5-17`.
- Wartości generuje `scripts/generate-runtime-config.mjs`:
  - domyślnie `local` (`:45`);
  - dane projektu prod albo staging wybiera po `WORKERS_CI_BRANCH` (`:50-53`);
  - przyjmuje tylko klucze `sb_publishable_` (`:55`).
- Skrypt uruchamiają hooki `prestart/prebuild/pretest/prewatch` (`package.json:6-15`).
- **Providery nie zależą od backendu.** `src/app/app.config.ts:28-30` wiąże `ExpenseRepository`, `MonthlyBudgetRepository` i `ExpenseFolderRepository` z klasami `Local*` niezależnie od `RUNTIME_CONFIG.dataBackend`. W sprawdzonym `src/app/core/**` nie ma żadnej implementacji repozytorium Supabase. S-04 musi dodać wybór providera, np. `useFactory` na `RUNTIME_CONFIG`.
- Konsekwencja: S-04 przełącza na Supabase tylko budżet, a wydatki i foldery zostają lokalne do S-05/S-06. Przez ten okres dane są mieszane i trzeba to świadomie opisać w planie.

### 3. Klient Supabase, AuthService i cykl życia danych

- Klient Supabase:
  - `SupabaseClientService.getClient()` ładuje `@supabase/supabase-js` leniwie i odrzuca wywołanie przy backendzie `local` (`src/app/core/supabase/supabase-client.service.ts:11-35`);
  - sesja jest w localStorage z automatycznym odświeżaniem (domyślne opcje `createClient`);
  - komentarz w `:7` dopuszcza użycie tylko w repozytoriach core i w AuthService.
- AuthService:
  - ma sygnał `session` (`src/app/core/auth/auth.service.ts:27`), ale nie ma pola `userId`; trzeba je wyprowadzić z `session()?.user.id`;
  - `whenReady()` (`:31-34`) przywraca sesję;
  - `onAuthStateChange` (`:110-123`) przy `SIGNED_OUT` tylko nawiguje na `/login`.
- Kolejność startu jest dziś poprawna, ale tylko pośrednio:
  - `authGuard` czeka na `whenReady()` (`src/app/core/auth/auth.guards.ts:7-15`), zanim dashboard wstrzyknie `BudgetStateService`;
  - konstruktor serwisu wywołuje `reload()` (`budget-state.service.ts:243-245`), więc zapytania idą już z przywróconą sesją.
- **Luka:** `BudgetStateService` (`providedIn: 'root'`) ładuje dane tylko w konstruktorze. W sprawdzonym kodzie `reload()` wołają dwa miejsca: `:244` (konstruktor) i `:274` (po błędzie). Po wylogowaniu i zalogowaniu innego użytkownika w tej samej karcie sygnały zachowują dane poprzedniego konta.
  - Dziś to nie wyciek, bo dane są lokalne i wspólne.
  - Po przejściu na Supabase pokazałoby to cudzy budżet do czasu przeładowania strony.
  - Plan S-03 świadomie przesunął to do S-04 (`context/archive/2026-10-14-email-password-sign-in/plan.md:44`).
  - Lekcja „Per-tab auth state vs cross-tab Supabase events” (`context/foundation/lessons.md`) dotyczy tego miejsca: `SIGNED_OUT` przychodzi we wszystkich kartach, więc czyszczenie stanu musi być poprawne także w karcie, która nie zainicjowała wylogowania.

### 4. Katalog `supabase/` i testy

- `supabase/config.toml`:
  - migracje włączone (`:62`);
  - seed wskazuje `./seed.sql` (`:67-72`), ale **tego pliku nie ma**;
  - Mailpit działa na porcie 54324 (`:106-109`);
  - `enable_confirmations = false` (`:227`);
  - limity w `[auth.rate_limit]` (`:198-212`): `email_sent = 2`, `sign_in_sign_ups = 300`;
  - blok `[auth.email.smtp]` jest zakomentowany.
- Jedna migracja: `supabase/migrations/20261003202153_baseline.sql`. Nie ma tabel ani polityk RLS.
- Brak testów bazy: nie ma `supabase/tests/`, pgTAP ani skryptu npm dla `supabase test db`. Test izolacji dwóch użytkowników (wymóg PRD, Approved Implementation Decisions) jest budowany od zera. Są dwie drogi: pgTAP + `supabase test db` albo Playwright/supabase-js z dwoma kontami.
- E2E auth można rozbudować:
  - `playwright.auth.config.ts` pobiera URL i klucz z `npx supabase status -o env` (`:6-34`);
  - `e2e/auth/auth-flow.spec.ts` ma helpery `uniqueEmail()`, `register` i `signIn` (`:6`, `:8`, `:21`), ale żadnych asercji danych.

### 5. Limity Supabase (źródła oficjalne, pobrane 2026-10-14 przez Exa)

Plan Free, według [supabase.com/pricing](https://supabase.com/pricing) i [Billing on Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase):

| Pozycja | Free | Pro ($25/mies.) |
|---|---|---|
| Monthly Active Users | 50 000 | 100 000 |
| Rozmiar bazy | 500 MB na projekt (shared CPU, 500 MB RAM) | 8 GB dysku |
| Egress | 5 GB + 5 GB cached | 250 GB |
| Żądania API | bez limitu | bez limitu |
| Automatyczne backupy | brak | 7 dni |
| Pauzowanie | po 1 tygodniu bez aktywności | nigdy |
| Aktywne projekty | 2 | — |
| Realtime peak connections | 200 | 500 |

Połączenia (według [Compute and Disk](https://supabase.com/docs/guides/platform/compute-add-ons)): Nano (Free) ma 60 połączeń bezpośrednich do Postgresa i 200 klientów poolera. Aplikacja łączy się przez HTTP (PostgREST/Auth), a nie bezpośrednio z Postgresem, więc liczba użytkowników nie przekłada się 1:1 na połączenia do bazy (wniosek z architektury, niezmierzony).

Limity Auth (według [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)):
- maile: 2/h na projekt przy wbudowanym mailerze; po włączeniu własnego SMTP limit podnosi się do 30/h i da się go ustawić ([Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp));
- rejestracje i logowania: 30 na 5 min **na adres IP**;
- `/token` (logowanie hasłem i odświeżanie tokenu): 150 na 5 min na IP.

Wbudowany SMTP (według [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) i [changelog 29370](https://supabase.com/changelog/29370-supabase-auth-changes-to-default-email-provider)):
- wysyła tylko na adresy członków zespołu organizacji; każdy inny adres kończy się błędem „Email address not authorized”;
- dotyczy to także resetu hasła, nawet przy wyłączonym potwierdzaniu maila;
- Supabase opisuje go jako „not meant for production use”.

### 6. Ocena dla 50 użytkowników (wniosek, nie pomiar)

- **MAU:** 50 to 0,1% limitu 50 000.
- **Baza:** przyjmując 100 wydatków na użytkownika miesięcznie i rząd wielkości ~0,5 KB na wiersz z indeksami (założenie, niezmierzone), rok danych 50 użytkowników to ~60 000 wierszy i ~30 MB, czyli ok. 6% z 500 MB. Budżety to pojedyncze wiersze.
- **Egress (to rośnie najszybciej):** `ExpenseRepository.list()` nie ma filtra okresu (`expense.repository.ts:4`), a `reload()` pobiera całą historię przy każdym starcie (`budget-state.service.ts:249-253`).
  - Przy 1000 wydatków na użytkownika (~200 KB JSON, założenie) i 10 otwarciach dziennie daje to 50 × 10 × 30 × 0,2 MB ≈ 3 GB miesięcznie, czyli 60% limitu 5 GB.
  - Na start (dziesiątki wydatków) to setne części GB.
  - Ryzyko pojawia się dopiero po wielu miesiącach danych. Mitygacja to filtr okresu w `list()` w S-05, do rozważenia w planie.
- **Rate limit per IP:** jeżeli 50 osób rejestruje się naraz zza jednego NAT (np. biuro albo sala szkoleniowa), limit rejestracji (30 na 5 min) zacznie zwracać HTTP 429. Limit da się podnieść w panelu (Authentication → Rate Limits). Staging i prod mają dziś 30 (`context/deployment/deploy-plan.md:171`).
- **Maile przy 50 rejestracjach:** każda rejestracja to 1 mail potwierdzający. Z własnym SMTP domyślne 30/h nie wystarczy na jednorazowy „nabór” 50 osób w godzinę, więc limit trzeba podnieść (np. do 100/h). Resend Free (100/dzień) mieści 50 rejestracji i resetów dziennie, Brevo Free (300/dzień) z zapasem.
- **Wydajność bazy:** zapytania typu `select ... where user_id = auth.uid()` na kilkudziesięciu tysiącach wierszy z indeksem na `user_id` to nieznaczne obciążenie dla Nano (wniosek; RLS warto pisać jako `(select auth.uid())` i indeksować `user_id`, co jest zgodne z zaleceniami Supabase, ale nie zostało tu zmierzone).

### 7. Maile: wymagana domena

- Resend:
  - bez zweryfikowanej domeny wysyła tylko na adres właściciela konta, inne zwracają 403 ([Resend errors](https://resend.com/docs/api-reference/errors));
  - Free: 100 maili dziennie i 3000 miesięcznie ([Resend quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits));
  - ma gotową integrację z Supabase ([Resend + Supabase](https://resend.com/docs/send-with-supabase-smtp)).
- Brevo:
  - Free: 300 maili dziennie ([Brevo Free limits](https://help.brevo.com/hc/en-us/articles/208580669));
  - konfiguracja SMTP zaczyna się od dodania i uwierzytelnienia domeny ([Brevo SMTP](https://help.brevo.com/hc/en-us/articles/7924908994450)).
- `deploy-plan.md` wyklucza własną domenę („Plan nie obejmuje własnej domeny”, `context/deployment/deploy-plan.md:13`). Na subdomenie `*.workers.dev` nie ustawi się rekordów DNS. **Działające maile do obcych osób wymagają więc zakupu i podpięcia domeny**, nawet taniej. To nowa, nierozpoznana dotąd zależność S-08.

### 8. Kontynuacja (2026-10-14): SMTP i domena w SEOHOST.pl

Pytanie: czy w SEOHOST da się kupić SMTP dla Supabase Auth. Źródła pobrane przez Exa 2026-10-14. Oficjalne strony seohost.pl, chyba że zaznaczono inaczej.

**Odpowiedź: tak, ale nie jako osobną usługę SMTP.** SEOHOST sprzedaje hosting współdzielony (panel DirectAdmin), w którym są skrzynki w domenie, a każda skrzynka ma SMTP z logowaniem. Taką skrzynkę (np. `no-reply@twojadomena.pl`) wpisuje się w Supabase → Authentication → SMTP Settings. W znalezionych materiałach nie ma osobnego produktu „transactional SMTP relay” w stylu Resend czy Brevo.

**Fakty z oficjalnych stron:**

Cennik:
- **SH 1**: 37 zł netto za pierwszy rok, odnowienie 127 zł netto. W pakiecie 50 kont e-mail i domen ([seohost.pl](https://seohost.pl/), [specyfikacja](https://seohost.pl/specyfikacja-techniczna)).
- Wyższe pakiety są droższe przy odnowieniu ([zmiany w ofercie 2026](https://seohost.pl/zmiany-w-ofercie-seohost-2026)).
- **Domena** ([seohost.pl/domeny](https://seohost.pl/domeny)): `.pl` od 14,87 zł netto za pierwszy rok, `.eu` od 29 zł, `.com` od 59 zł. Odnowienie `.pl`, `.com` i `.eu` kosztuje 99 zł netto ([zmiany w ofercie 2026](https://seohost.pl/zmiany-w-ofercie-seohost-2026)).

Limity wysyłki ([specyfikacja](https://seohost.pl/specyfikacja-techniczna), [zakładanie skrzynki](https://seohost.pl/pomoc/jak-zalozyc-adres-email-w-swojej-domenie)):
- **dzienny limit wysyłki ustawia się per skrzynka**, a opcja „max” to obecnie **1000 wiadomości dziennie**;
- 100 odbiorców w jednej wiadomości;
- 50 równoczesnych połączeń IMAP/POP3/SMTP;
- godzinowego limitu nie znalazłem na stronach SEOHOST.

Dostarczalność:
- SPF, DKIM i DMARC konfiguruje się w DNS domeny ([SPF/DKIM/DMARC](https://seohost.pl/pomoc/uwierzytelnianie-emaili-spf-dkim-dmarc));
- logi wysłanej poczty SMTP są w DirectAdmin ([logi poczty](https://seohost.pl/pomoc/jak-sprawdzic-logi-poczty-e-mail-w-panelu-seohost)).

Parametry SMTP (źródło nieoficjalne, [blog Mailer PRO, 2026-05-09](https://mailerpro.pl/blog/seohost-smtp-porty-ssl-i-najczestsze-bledy)):
- host `mail.<domena>` albo nazwa serwera z panelu, port 587 (STARTTLS) lub 465 (SSL);
- login to pełny adres e-mail.
- Ten sam blog podaje „orientacyjnie” 500–1000 wiadomości na godzinę. To nie jest dane SEOHOST, więc przed konfiguracją trzeba je potwierdzić w panelu.

**Ocena dla 50 użytkowników (wniosek):**
- **Wolumen:** 1000 maili dziennie z jednej skrzynki z dużym zapasem pokrywa 50 rejestracji i resety haseł. Po stronie Supabase i tak trzeba podnieść limit `email_sent` z domyślnych 30/h po włączeniu własnego SMTP.
- **Dostarczalność to słabszy punkt niż w Resend czy Brevo.** Hosting współdzielony wysyła ze współdzielonego IP, którego reputację psują inni klienci serwera. Bez poprawnych SPF, DKIM i DMARC maile potwierdzające mogą trafiać do spamu (Gmail i Outlook wymagają uwierzytelnienia nadawcy). Nie zmierzono tego; wymaga testu, np. Mail-Tester, który SEOHOST sam poleca ([test wysyłki](https://seohost.pl/pomoc/czy-serwer-wysyla-poczte)).
- **Bezpieczeństwo:** hasło skrzynki trafia do panelu Supabase, a nie do klienta. Nie narusza to reguły „tylko publishable key w kliencie”. Skrzynka powinna być osobna, z dziennym limitem ustawionym rozsądnie, a nie na „max”, żeby ograniczyć szkody po przejęciu hasła; tak radzi poradnik SEOHOST.

**Warianty z SEOHOST (koszty netto z cenników powyżej):**

| Wariant | Rok 1 | Kolejne lata | Limit maili | Uwagi |
|---|---|---|---|---|
| A. Domena `.pl` w SEOHOST + Resend Free | ~15 zł | 99 zł | 100/dzień, 3000/mies. | Domena służy tylko do rekordów DNS dla Resend. Najlepsza dostarczalność, gotowa integracja z Supabase. |
| B. Domena `.pl` w SEOHOST + Brevo Free | ~15 zł | 99 zł | 300/dzień | Jak A, większy dzienny limit. |
| C. Domena `.pl` + hosting SH 1 (SMTP skrzynki) | ~52 zł | ~226 zł | do 1000/dzień na skrzynkę | Jeden dostawca, polska faktura i support. Gorsza reputacja IP; trzeba samemu włączyć DKIM i dodać SPF/DMARC. |

Wniosek: kupno **samej domeny** w SEOHOST rozwiązuje główny bloker z sekcji 7, bo daje dostęp do DNS. Hosting SH 1 jest potrzebny tylko wtedy, gdy SMTP ma pochodzić od SEOHOST, a nie od Resend lub Brevo. Dla maili potwierdzających konto lepsza jest dedykowana usługa transakcyjna (A lub B). Wariant C jest sensowny, jeśli i tak potrzebujesz skrzynki pocztowej w domenie.

### 9. Kontynuacja (2026-10-14): czym są Resend i Brevo oraz scenariusz 5000 rejestracji dziennie

**Czym są:** Resend i Brevo to usługi wysyłki maili transakcyjnych (ESP), czyli maili wyzwalanych akcją użytkownika: potwierdzenie konta, reset hasła. Udostępniają SMTP relay i API. Utrzymują reputację swoich adresów IP i pilnują uwierzytelnienia domeny (SPF/DKIM), dzięki czemu maile trafiają do skrzynki, a nie do spamu. Supabase wysyła przez nie maile Auth po wpisaniu danych SMTP (sekcja 7). Brevo to dawny Sendinblue, ma też narzędzia marketingowe. Resend jest nastawiony na deweloperów. Trzecia popularna opcja to Amazon SES.

**Cenniki przy wyższym wolumenie (oficjalne strony, pobrane przez Exa 2026-10-14):**
- **Resend** ([pricing](https://resend.com/pricing)): Pro $20/mies. za 50 000 maili i $35/mies. za 100 000; Scale $160/mies. za 200 000. Płatne plany nie mają dziennego limitu. Nadwyżka kosztuje $0,80–0,90 za 1000.
- **Brevo** ([plany](https://help.brevo.com/hc/en-us/articles/208589409)): Starter od $9/mies. za 5000 maili miesięcznie, progi do 100 000 miesięcznie, bez dziennego limitu.
- **Amazon SES** ([pricing](https://aws.amazon.com/ses/pricing/), [quotas](https://docs.aws.amazon.com/ses/latest/dg/quotas.html)):
  - koszt to $0,10 za 1000 maili przy rozliczeniu à la carte albo $0,16 za 1000 w planie Essentials;
  - nowe konto startuje w sandboxie (200 maili na dobę, tylko na zweryfikowane adresy) i wymaga wniosku o dostęp produkcyjny;
  - najtańsze przy dużej skali, ale najwięcej konfiguracji.

**Scenariusz: 5000 rejestracji dziennie (szacunek, nie pomiar):**

Założenia: każda rejestracja to 1 mail potwierdzający, plus resety haseł i ponowne wysyłki rzędu 20–30% tej liczby. Daje to ok. 6000–6500 maili dziennie, czyli ok. 180 000–200 000 miesięcznie.

| Dostawca | Koszt miesięczny przy ~200 tys. maili |
|---|---|
| Resend Scale | ~$160 |
| Amazon SES | ~$20–32 |
| Brevo | powyżej progów Startera (100 tys.); potrzebny wyższy plan, ceny nie sprawdziłem |

Po stronie Supabase:
- **Plan Free odpada.** 50 000 MAU wyczerpie się po ok. 10 dniach takiego naboru.
- **Pro:** 100 000 MAU w cenie, potem $0,00325 za MAU.
  - Przy 150 000 nowych kont miesięcznie, ze wszystkimi aktywnymi, to ok. $25 + $160 MAU w pierwszym miesiącu.
  - Przy 500 000 aktywnych użytkowników to ok. $1 400/mies. za samo MAU.
  - Retencji nie znamy; to PRD Open Questions 4–5.
- **Baza i compute:** przy założeniu ~0,6 MB danych na aktywnego użytkownika rocznie (100 wydatków miesięcznie × ~0,5 KB) 500 000 aktywnych daje ~300 GB rocznie.
  - Dysk kosztuje $0,125 za GB ponad 8 GB.
  - Micro (1 GB RAM) nie wystarczy. Realny jest Large lub XL za $110–210/mies. ([compute](https://supabase.com/pricing)), do potwierdzenia testem obciążeniowym.
- **Egress:** obecne `ExpenseRepository.list()` pobiera całą historię (sekcja 6). Przy takiej skali to pierwszy koszt, który wymknie się spod kontroli (Pro: 250 GB w cenie, potem $0,09/GB). Filtr okresu lub paginacja w S-05 jest wtedy obowiązkowy, nie opcjonalny.
- **Limity Auth:**
  - `email_sent` trzeba podnieść do szczytu godzinowego (np. 1000/h);
  - limit rejestracji per IP (30 na 5 min) nie przeszkadza przy ruchu z wielu adresów.

**Co zabezpiecza „na lata” niezależnie od skali (rekomendacje):**
1. **Własna domena, najlepiej osobna subdomena do maili Auth** (np. `auth.twojadomena.pl`) z SPF, DKIM i DMARC. Reputacja wysyłki należy wtedy do Ciebie, a nie do dostawcy, i przenosi się przy zmianie ESP.
2. **Wysyłka przez standardowe SMTP w ustawieniach Supabase.** Zmiana dostawcy (Resend → SES) to zmiana konfiguracji w panelu, bez zmian w kodzie aplikacji; potwierdza to obecny brak kodu mailowego w repo.
3. **CAPTCHA przy rejestracji.** Supabase obsługuje Cloudflare Turnstile i hCaptcha (`supabase/config.toml`, sekcja `[auth.captcha]`, dziś zakomentowana). Publiczny formularz przy takim ruchu przyciąga boty, które zużywają limit maili i psują reputację domeny. To nowy wymóg przed S-08, nieujęty w roadmapie.
4. **Plan Pro i monitoring zużycia** (MAU, egress, dysk) zanim ruch przekroczy limity Free.

### 10. Kontynuacja (2026-10-14): domena `portfelbezspiny.pl` już istnieje

Nowy fakt od użytkownika: domena `portfelbezspiny.pl` jest wykupiona w SEOHOST, a aplikacja częściowo już na niej działa. **Zastępuje to założenie z sekcji 7**, że projekt nie ma własnej domeny, oraz wiersz o koszcie domeny w tabeli wariantów z sekcji 8. `context/deployment/deploy-plan.md:13` („Plan nie obejmuje własnej domeny”) jest w tym punkcie nieaktualny.

**Stan DNS** (`dig +short`, 2026-10-14):
- **NS:** `bayan.ns.cloudflare.com`, `arely.ns.cloudflare.com`. Strefą DNS zarządza **Cloudflare**, nie SEOHOST. SEOHOST jest tylko rejestratorem.
- **A:** adresy Cloudflare (`104.21.41.116`, `172.67.146.230`).
- **MX, TXT (SPF) i `_dmarc`:** brak rekordów. Domena nie ma dziś żadnej poczty.

**Czy w SEOHOST da się dokupić samo SMTP:**
- Nie ma takiej usługi w znalezionych materiałach.
- SEOHOST pisze wprost, że sama domena „stanowi wyłącznie adres internetowy” i do poczty potrzebna jest usługa hostingowa ([pomoc SEOHOST](https://seohost.pl/pomoc/czy-moge-korzystac-z-kont-email-jesli-mam-zarejestrowana-tylko-domene)).
- Najtańsza droga u nich to hosting SH 1 (37 zł netto za pierwszy rok, potem 127 zł netto) ze skrzynkami i SMTP; limit do 1000 maili dziennie na skrzynkę (sekcja 8).

**Konsekwencje:**
- **Każdy wariant (Resend, Brevo, SES albo skrzynka SEOHOST)** wymaga dodania rekordów **w panelu DNS Cloudflare**, nie w SEOHOST:
  - przy dostawcy zewnętrznym: SPF/DKIM (TXT, CNAME) i ewentualnie MX dla zwrotów;
  - przy SEOHOST: MX, SPF i DKIM wskazujące na serwer SEOHOST.
- **Rekomendowany wariant:** Resend albo Brevo na subdomenie (np. `auth.portfelbezspiny.pl`), z rekordami dodanymi w Cloudflare DNS.
  - Koszt dodatkowy: 0 zł (Free).
  - Nie trzeba niczego kupować w SEOHOST.
  - Przy wzroście ruchu wystarczy zmiana planu albo dostawcy, bez zmian w kodzie (sekcja 9).
- **Wariant SEOHOST SH 1** ma sens tylko wtedy, gdy potrzebna jest też zwykła skrzynka do odbierania poczty (np. `kontakt@portfelbezspiny.pl`). Nawet wtedy maile Auth lepiej wysyłać przez Resend lub Brevo z osobnej subdomeny.
  - Uwaga: rekord SPF może być na domenie tylko jeden. Przy dwóch nadawcach na tej samej domenie trzeba je połączyć w jednym rekordzie; osobna subdomena dla Auth omija ten problem.

### 11. Kontynuacja (2026-10-14): SMTP w Cloudflare (Email Service)

Źródła: oficjalna dokumentacja Cloudflare pobrana przez Exa 2026-10-14 ([Email Service](https://developers.cloudflare.com/email-service/), [SMTP](https://developers.cloudflare.com/email-service/api/send-emails/smtp/), [pricing](https://developers.cloudflare.com/email-service/platform/pricing/), [limits](https://developers.cloudflare.com/email-service/platform/limits/)).

- **Usługa istnieje.** Cloudflare Email Service ma dwie części:
  - **Email Sending** (status **Beta**) do maili transakcyjnych;
  - **Email Routing**: odbiór i przekierowanie poczty, darmowe.
- **SMTP jest dostępne:**
  - host `smtp.mx.cloudflare.net`, port **465** (implicit TLS); STARTTLS na 587 nie jest obsługiwany;
  - login to dosłownie `api_token`;
  - hasło to token API Cloudflare z uprawnieniem „Email Sending: Edit”;
  - domena nadawcy musi być dodana w Email Service → Email Sending.
- **Koszt:**
  - wysyłka do dowolnych odbiorców wymaga planu **Workers Paid**;
  - w planie jest 3000 maili miesięcznie, potem $0,35 za 1000;
  - na Workers Free wysyłka jest dostępna tylko do zweryfikowanych adresów na własnym koncie, czyli nie nadaje się do rejestracji użytkowników;
  - ceny samego planu Workers Paid nie pobierałem w tej sesji.
- **Limity:** nowe konto startuje z „konserwatywnym” dziennym limitem, który rośnie z reputacją. Konkretnej liczby dokumentacja nie podaje.

**Ocena dla projektu (wniosek):**
- Plusy:
  - DNS `portfelbezspiny.pl` już jest w Cloudflare (sekcja 10), więc dodanie domeny wysyłkowej jest najprostsze;
  - jeden dostawca dla hostingu, DNS i maili;
  - przy 200 tys. maili miesięcznie to ok. $69 za wysyłkę, plus plan Workers Paid, czyli taniej niż Resend Scale (sekcja 9).
- Minusy:
  - status Beta;
  - wymaga płatnego planu już od pierwszego maila do obcej osoby;
  - nieznany startowy dzienny limit;
  - hasło SMTP to token API Cloudflare; musi być osobny, z jedynym uprawnieniem „Email Sending: Edit”, i trzymany wyłącznie w ustawieniach Supabase.
- Na start (bezpłatnie, sprawdzone rozwiązanie) Resend Free nadal jest prostszy. Cloudflare Email Sending to sensowna opcja na później, po wyjściu z Beta albo gdy i tak przejdziesz na Workers Paid. Zmiana dostawcy to tylko zmiana ustawień SMTP w Supabase.

### 12. Decyzja (2026-10-14): MVP bez maili, Resend później

**Decyzja użytkownika:** do MVP idzie to, co jest najprostsze i sprawdzone. Maile Auth nie wchodzą do MVP.

- W S-08 wyłączamy „Confirm email” na prod. Konto działa od razu po rejestracji i żaden mail nie wychodzi: ani z Resend, ani z Supabase. Wbudowany mailer Supabase i tak nie dociera do obcych adresów (sekcja 5).
- Koszt: adres nie jest weryfikowany (literówka albo cudzy adres przejdzie) i nie ma resetu hasła. Resetu w aplikacji i tak nie ma: w `src/app/core/auth/` brak `resetPassword`. Dla MVP z testerami to akceptowalne.
- Do sprawdzenia w S-08: przy wyłączonym potwierdzaniu Supabase inaczej zgłasza zajęty adres. `auth.service.ts:65-70` rozpoznaje go dziś po użytkowniku bez `identities`. Niezweryfikowane.
- Plan na później (pozycja Parked w roadmapie): Resend z domeną `auth.portfelbezspiny.pl` w regionie EU, rekordy DKIM/SPF/MX (i opcjonalnie DMARC) z panelu Resend dodane w Cloudflare DNS jako „DNS only”, klucz API z uprawnieniem tylko do wysyłki. W Supabase SMTP: host `smtp.resend.com`, port 465, użytkownik `resend`, hasło = klucz API, nadawca `no-reply@auth.portfelbezspiny.pl`. Potem podnieść limit maili (np. 100/h), włączyć ponownie „Confirm email” i dodać reset hasła. Parametry SMTP pochodzą z dokumentacji Resend z sekcji 7; przed konfiguracją potwierdzić je w panelu Resend.

## Code References

- `src/app/core/repositories/monthly-budget.repository.ts:3-6` - kontrakt budżetu (`list`, `setLimit`)
- `src/app/core/repositories/expense.repository.ts:3-8` - kontrakt wydatków; `list()` bez filtra okresu
- `src/app/core/models/finance.model.ts:1,54-59` - `Period`, `MonthlyBudget`
- `src/app/core/domain/budget-summary.ts:33-44` - wybór obowiązującego limitu
- `src/app/core/repositories/local/local-monthly-budget.repository.ts:8-31` - upsert po `effectiveFrom`
- `src/app/core/repositories/local/local-finance.store.ts:12` - wspólny klucz `pbs_finance_v1`
- `src/app/app.config.ts:28-30` - providery na sztywno `Local*`
- `src/app/core/services/budget-state.service.ts:243-262` - jednorazowy `reload()` w konstruktorze
- `src/app/core/auth/auth.service.ts:27,31-34,110-123` - sesja, gotowość, obsługa `SIGNED_OUT`
- `src/app/core/auth/auth.guards.ts:7-15` - guard czeka na sesję
- `src/app/core/supabase/supabase-client.service.ts:11-35` - leniwy klient
- `scripts/generate-runtime-config.mjs:45,50-55` - `DATA_BACKEND` i wybór projektu
- `supabase/config.toml:62,67-72,198-212,227` - migracje, brakujący seed, rate limity, potwierdzenia
- `supabase/migrations/20261003202153_baseline.sql` - jedyna migracja
- `playwright.auth.config.ts:6-34`, `e2e/auth/auth-flow.spec.ts:6-21` - E2E na lokalnym stacku

## Architecture Insights

- Wzorzec S-04 powielą S-05 i S-06, więc warto od razu ustalić cztery rzeczy:
  1. migracja z RLS na `(select auth.uid()) = user_id` dla SELECT, INSERT, UPDATE i DELETE oraz indeksem na `user_id`;
  2. `user_id default auth.uid()`, żeby model domenowy nie znał użytkownika;
  3. mapowanie snake_case ↔ camelCase w adapterze;
  4. wybór providera według `DATA_BACKEND` w jednym miejscu.
- Cykl życia danych musi być powiązany z tożsamością: reset i `reload()` przy zmianie `user.id` (w tym `SIGNED_OUT` z innej karty).
- PRD wymaga „Every read and write policy is covered by a two-user isolation test”, a w repo nie ma jeszcze żadnego testu bazy. To największy nowy element S-04.

## Historical Context (from prior changes)

- `context/archive/2026-10-14-email-password-sign-in/plan.md:44` - czyszczenie i przeładowanie danych przy zmianie użytkownika świadomie odłożone do S-04. Werdykt: nadal aktualne, luka potwierdzona w kodzie.
- `context/deployment/deploy-plan.md:65` - „Plan Free nie daje kopii zapasowych odpowiednich dla danych produkcyjnych”, projekt prod może zostać wstrzymany. Werdykt: potwierdzone aktualnym cennikiem (pauza po 1 tygodniu, brak backupów na Free).
- `context/deployment/deploy-plan.md:176` - „Przed S-08 sprawdzić wysyłkę maili… czy domyślny mailer dociera do obcych adresów”. Werdykt: rozstrzygnięte przez dokumentację; nie dociera (tylko członkowie zespołu, 2/h), własny SMTP jest konieczny.
- `context/foundation/roadmap.md` S-08, Unknowns 1–2 - pytania o plan, backupy i mailer. Werdykt: fakty są już znane (sekcje 5–7), pozostaje decyzja użytkownika.

## Related Research

Nie dotyczy: brak innych `research.md` dla tego obszaru w `context/changes/` i `context/archive/`.

## Open Questions

1. **Plan Supabase dla prod:** Free (bez backupów, pauza po tygodniu ciszy) czy Pro ($25/mies., 7 dni backupów, bez pauzy)? Na Free trzeba zaakceptować ryzyko utraty danych albo robić własny `pg_dump`. — Owner: user. Blokuje S-08, nie S-04.
2. ~~**Wysyłka maili dla `portfelbezspiny.pl`**~~ Rozstrzygnięte 2026-10-14 (sekcja 12): MVP bez maili, „Confirm email” wyłączone na prod; Resend na `auth.portfelbezspiny.pl` później.
3. **Zapis `effective_from`:** `text 'YYYY-MM'` z check constraintem czy `date` (pierwszy dzień miesiąca)? — Owner: plan S-04.
4. **Test izolacji:** pgTAP (`supabase test db`) czy Playwright/supabase-js z dwoma kontami? — Owner: plan S-04.
5. **Okres przejściowy:** czy w S-04 przełączyć tylko budżet (wydatki i foldery lokalne do S-05/S-06), czy ukryć tryb `supabase` za flagą do S-05? — Owner: plan S-04.
6. **Nieweryfikowane:** rzeczywisty rozmiar wiersza i egress nie zostały zmierzone. Oszacowania z sekcji 6 to założenia. Nie sprawdzono też, czy staging i prod mają zdalnie zastosowane inne migracje.
