# Plan pierwszego wdrożenia webowego

## Cel i zakres

Wdrożyć obecną aplikację webową jako publiczne demo na Cloudflare Pages, z repozytorium GitHub jako źródłem wdrożeń. To wdrożenie obejmuje wyłącznie frontend Angulara. Aplikacja pozostaje makietą z danymi przechowywanymi lokalnie w przeglądarce.

Ten dokument rozwija rekomendację z [oceny infrastruktury](../foundation/infrastructure.md), dopasowując ją do aktualnego stosu i stanu repozytorium opisanego w [ocenie stacku](../foundation/stack-assessment.md). Nie ma osobnego `tech-stack.md`; źródłem informacji o technologiach jest `stack-assessment.md`, a wersje zależności i komendy należy sprawdzać w `package.json` oraz `package-lock.json`.

Nie obejmuje to jeszcze Supabase, logowania, domeny własnej, aplikacji mobilnej ani CI. Połączenie GitHub–Cloudflare uruchomi automatyczne wdrożenia, ale samo w sobie nie uruchomi testów jednostkowych ani E2E.

## Ocena i korekty rekomendacji infrastruktury

Zachowujemy Cloudflare Pages, integrację z GitHubem, jawny katalog wynikowy `dist/cost-management-app/browser`, podglądy branchy, ograniczone uprawnienia i osobny proces cofania zmian webowych.

Przedstawiony pierwotnie plan wymaga następujących doprecyzowań:

- **Wybór sposobu wdrażania:** używamy Git integration. Wybór trybu projektu Pages jest istotny, ponieważ projektu Git-integrated nie można później przełączyć na Direct Upload. Nie dodajemy Wranglera do zależności projektu dla tego przepływu. Opcjonalny lokalny podgląd może użyć `npx wrangler pages dev`, ale nie jest bramką wdrożenia.
- **Katalog buildu:** Angular application builder tworzy stronę w `dist/cost-management-app/browser`. Tę ścieżkę należy wpisać jawnie w ustawieniach Cloudflare, zamiast polegać na automatycznym wykrywaniu.
- **Stan backendu:** Supabase jest planowany, ale nie został jeszcze zaimplementowany. Nie konfigurujemy teraz kluczy, Auth, callback URLs ani dostępu do danych Supabase.
- **Dostępność i indeksowanie:** demo ma być publiczne, ale oznaczone jako `noindex`. To ogranicza indeksowanie przez wyszukiwarki, lecz nie chroni strony ani jej treści. Nie umieszczamy w aplikacji danych osobowych ani sekretów.
- **Testy i bezpieczeństwo zależności:** ostatni zapisany health check wskazywał test jednostkowy, który nie kompiluje się, nieudany test dodawania wydatku na Mobile Pixel oraz podatne zależności. Przed wydaniem trzeba ponownie sprawdzić bieżący stan, naprawić oba testy i uzgodnić obsługę aktualnych wyników audytu. Dawny raport audytu nie jest dowodem bieżącego stanu.
- **Brak CI:** Cloudflare zbuduje aplikację, ale nie uruchomi automatycznie testów z obecnego repozytorium, bo nie ma workflow CI. Dopóki CI nie powstanie, lokalne testy są obowiązkową bramką przed połączeniem `master` z Pages i przed każdym późniejszym pushem na branch produkcyjny.
- **Konfiguracja npm:** `.npmrc` zawiera `strict-ssl=false`. Należy usunąć to ustawienie przed buildem w CI albo wyjaśnić je i zastąpić bezpieczną konfiguracją zaufanego certyfikatu. Nie należy utrwalać wyłączenia weryfikacji TLS jako rozwiązania problemu.
- **Wersja Node:** lokalnie używano Node 22, ale repozytorium nie przypina wersji. Przed konfiguracją buildu Pages należy sprawdzić zgodność Node 22 z używanym Angular CLI i ustawić tę samą główną wersję lokalnie oraz w środowisku Cloudflare, na przykład przez `.nvmrc` i ustawienie `NODE_VERSION`. Nie zakładać, że ustawienie jest skuteczne bez sprawdzenia logu buildu.
- **SPA i nagłówki:** sprawdzamy odświeżanie bezpośrednich adresów Angulara na Pages. Jeśli fallback platformy nie obsłuży ich poprawnie, dodajemy i testujemy regułę `/* /index.html 200` w `public/_redirects`. Ustawienia `noindex` i pozostałe nagłówki wdrażamy przez `public/_headers` tylko po sprawdzeniu, że plik trafia do katalogu przeglądarkowego i wartości są widoczne w odpowiedzi HTTP.

Docelowe nagłówki dla publicznego demo:

```text
/*
  X-Robots-Tag: noindex
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
```

`X-Robots-Tag: noindex` ma ograniczyć indeksowanie, a nie ograniczać dostęp. Przed wdrożeniem sprawdzić te nagłówki przez HTTP; nie dodawać Content Security Policy bez osobnego sprawdzenia używanych zasobów aplikacji.

## Wymagania wstępne

### Potrzebne do pierwszego publicznego demo

- **Konto GitHub** z dostępem administracyjnym lub wystarczającym do autoryzacji aplikacji Cloudflare GitHub App dla repozytorium `JNDaniel/portfel-bez-spiny`. Repozytorium istnieje i obecny branch `master` śledzi `origin/master`.
- **Konto Cloudflare** z dostępem do Workers & Pages. Włączenie GitHub App musi ograniczyć dostęp do tego repozytorium, o ile Cloudflare pozwala wybrać repozytoria indywidualnie.
- Dostęp do ustawień i logów projektu Pages oraz możliwość wybrania branchu produkcyjnego i ustawienia build command/output directory.
- Lokalnie działające narzędzia zgodne z projektem: Node.js w wybranej wspólnej wersji, npm i zależności instalowane z lockfile przez `npm ci`.
- Naprawiony lokalny zestaw testów: build produkcyjny, testy jednostkowe i wymagane scenariusze E2E, w tym Mobile Pixel.
- Decyzja, że `master` jest branchem produkcyjnym i że jego pierwszy push po podłączeniu Pages może opublikować publiczny serwis. Przed aktywacją integracji należy zaakceptować zawartość aktualnego commita na `master`.
- Potwierdzenie, że demo nie zawiera sekretów, prywatnych danych ani treści, które nie powinny być publiczne. `noindex` nie zastępuje kontroli dostępu.
- Uzgodniony sposób usunięcia lub bezpiecznego zastąpienia `strict-ssl=false` z `.npmrc`.

### Nie jest potrzebne do pierwszego demo

- Konto Supabase, projekt Supabase, klucze Supabase ani ustawienia Auth. Kod aplikacji nie używa obecnie Supabase, a dane demonstracyjne pozostają w LocalStorage.
- GitHub CLI (`gh`) ani lokalny Wrangler jako zależności projektu. GitHub repo jest już dostępne, a Cloudflare Git integration wykonuje build i deploy.
- Własna domena, Cloudflare API token, Pages Functions, Worker, baza danych albo migracja danych z przeglądarki.

### Wymagane przed późniejszym wdrożeniem Supabase

- Konto i osobne projekty Supabase dla stagingu/testów oraz produkcji, z ustalonym właścicielem, regionem i planem kopii zapasowych.
- Wersjonowane migracje bazy, polityki RLS i automatyczne testy izolacji danych użytkowników.
- Osobna konfiguracja kliencka dla preview/staging i produkcji. Do publicznego bundla mogą trafić wyłącznie Supabase URL i publishable key.
- Ograniczone adresy redirect/callback dla produkcyjnej domeny i konkretnych hostów preview. Nie używać szerokich wildcardów jako obejścia.
- Osobny plan wdrożenia i odtworzenia bazy. Rollback Cloudflare cofa frontend, nie migracje, dane ani ustawienia Supabase.

## Etap 0: przygotować i zweryfikować repozytorium

Nie podłączać jeszcze repozytorium do Pages. Najpierw:

1. Sprawdzić aktualny `git status`, branch produkcyjny i zawartość commita, który Cloudflare miałby wdrożyć.
2. Naprawić nieaktualne asercje testu jednostkowego oraz przyczynę niepowodzenia mobilnego testu dodawania wydatku.
3. Sprawdzić aktualny `npm audit` i zaktualizować podatne zależności zgodnie z osobnym planem migracji Angulara. Nie używać `npm audit fix --force`; jeśli jakieś ryzyko zostanie zaakceptowane na czas demo, zapisać zakres, uzasadnienie i termin ponownej oceny.
4. Usunąć `strict-ssl=false` albo zastąpić go udokumentowaną konfiguracją zaufanego certyfikatu. Zweryfikować `npm ci` z normalną weryfikacją TLS.
5. Ustalić i przypiąć wspieraną wersję Node (docelowo sprawdzić lokalną Node 22), na przykład w `.nvmrc`. Ustawić analogiczną wersję w Cloudflare.
6. Dodać regułę SPA tylko wtedy, gdy test potwierdzi, że domyślny fallback Pages nie obsługuje bezpośrednich tras. Dodać `noindex` i nagłówki przez `public/_headers`, a potem sprawdzić ich obecność w zbudowanych plikach i odpowiedziach HTTP.
7. Uruchomić z czystej instalacji:

   ```bash
   npm ci
   npm run build
   npm test -- --watch=false
   npm run test:e2e
   ```

8. Sprawdzić, że statyczny serwis jest w `dist/cost-management-app/browser`. W razie potrzeby uruchomić lokalny podgląd:

   ```bash
   npx wrangler pages dev dist/cost-management-app/browser
   ```

9. Jeżeli wprowadzono zmiany UI, pluginów Capacitor lub konfiguracji natywnej, wykonać również `npm run cap:build:apk` zgodnie z `AGENTS.md`. Samo webowe wdrożenie nie zastępuje walidacji Androida.
10. Zatwierdzić wynik audytu bezpieczeństwa i zaakceptować produkcyjne wdrożenie publicznego demo.

**Bramka:** nie podłączać `master` do automatycznego wdrażania, dopóki build, testy jednostkowe, wymagane E2E i decyzja o podatnościach nie są zakończone.

## Etap 1: utworzyć projekt Cloudflare Pages

Ten krok wymaga działania właściciela konta w panelu Cloudflare:

1. Otworzyć **Workers & Pages → Create application → Pages → Connect to Git** (nazwy pozycji mogą się zmienić w panelu).
2. Autoryzować GitHub App wyłącznie do potrzebnego repozytorium, jeśli dostępna jest taka opcja.
3. Wybrać `JNDaniel/portfel-bez-spiny`.
4. Wybrać `master` jako production branch. Pozostałe branche mogą tworzyć preview deployments; dostęp do preview traktować jako publiczny, dopóki nie włączono i nie zweryfikowano ochrony dostępu.
5. Ustawić build:
   - Framework preset: `None` lub równoważne ustawienie bez automatycznego presetowania.
   - Build command: `npm run build`.
   - Build output directory: `dist/cost-management-app/browser`.
   - Node: ta sama przypięta wersja co w repozytorium.
6. Nie konfigurować sekretów ani Supabase variables. W obecnej aplikacji nie są potrzebne.
7. Przed potwierdzeniem utworzenia sprawdzić, czy branch, katalog wyjściowy i ustawienia publicznego dostępu są prawidłowe. Pierwszy udany build `master` będzie wdrożeniem produkcyjnym.

Cloudflare Git integration uruchamia build po pushu. Do czasu dodania CI nie należy utożsamiać udanego buildu Cloudflare z przejściem testów.

## Etap 2: smoke test pierwszego wdrożenia

Po udanym buildzie sprawdzić adres `*.pages.dev`:

- Strona główna przekierowuje do `/dashboard`.
- `/dashboard`, `/expenses`, `/budgets`, `/analytics` i `/settings` otwierają się bezpośrednio.
- Odświeżenie bezpośredniej trasy, w szczególności `/expenses` i `/settings`, nie zwraca 404.
- Kluczowy widok jest czytelny na desktopie oraz profilu Pixel 7. Safe-to-Spend i jego ostrzeżenie pozostają widoczne bez przewijania.
- Demonstracyjne dane pozostają lokalne dla przeglądarki i nie są przedstawiane jako prywatne, synchronizowane konto.
- Odpowiedź HTTP zawiera oczekiwany nagłówek `X-Robots-Tag: noindex` oraz skonfigurowane nagłówki bezpieczeństwa. Sprawdzić także `robots`/metadane, jeśli dodano je w HTML.
- Pliki `_headers` i `_redirects` są w katalogu wynikowym, jeśli zostały skonfigurowane.
- Build log w Cloudflare pokazuje oczekiwaną wersję Node i output directory.

Połączenie branchu niebędącego produkcyjnym powinno utworzyć preview. Zweryfikować jego URL i upewnić się, że nie zakłada on ochrony dostępu, jeśli jej nie włączono. Nie wpisywać do formularzy testowych rzeczywistych danych finansowych ani danych osobowych.

## Kolejne wdrożenia i bramki

- Przed każdym pushem do `master` uruchomić lokalnie build, testy jednostkowe i E2E. Rozważyć ochronę `master` przez pull request, jeśli sposób pracy repozytorium na to pozwala.
- Dodać GitHub Actions lub inny CI w osobnym zakresie. Po jego skonfigurowaniu wymagane status checks powinny przechodzić przed merge do `master`.
- Ocenę braku CI i brak testów w workflow zapisać jawnie. Cloudflare Pages nie wykonuje obecnie tych kontroli.
- Przy zmianie output directory, Angular buildera albo głównej wersji Wrangler ponownie sprawdzić publikowane pliki i deep links.
- Nie dodawać Pages Functions/Workers bez nowej oceny kosztów, logowania, sekretów i odpowiedzialności serwerowej.

## Rollback, logi i odpowiedzialność

- Cloudflare Pages przywraca frontend, ale nie bazę, ustawienia Auth ani aplikacje Capacitor.
- Przy pierwszym wdrożeniu może nie być wcześniejszej stabilnej wersji do przywrócenia. W takim przypadku poprawić build lub wdrożyć naprawczy commit. Gdy istnieje poprzedni sprawdzony deployment, można go przywrócić z panelu Pages.
- Użyć build/deployment logs i listy deploymentów w panelu Pages do diagnozy. Aplikacja statyczna nie ma logów działającego serwera; przyszłe błędy klienta i Supabase wymagają osobnej obserwowalności.
- Właściciel projektu zatwierdza pierwsze publiczne wdrożenie, zmiany domeny/DNS, uprawnień GitHub App i ustawień konta. Nie tworzyć szerokiego tokenu API dla agenta, jeśli Git integration wystarcza.
- Nie committować sekretów. Ponieważ klient Angulara jest publiczny, każda wartość w bundlu jest jawna.

## Ryzyka

| Ryzyko | Ograniczenie |
|---|---|
| Cloudflare publikuje zły katalog mimo udanego buildu | Ustawić `dist/cost-management-app/browser` jawnie i sprawdzić zawartość wdrożenia. |
| Push do `master` publikuje niezatwierdzony lub nieprzetestowany stan | Naprawić testy przed integracją, zatwierdzać zawartość produkcyjnego commita i uruchamiać lokalne bramki przed push. |
| Demo jest publiczne mimo `noindex` | Nie umieszczać danych prywatnych; `noindex` nie jest autoryzacją. |
| Zmiana hosta preview powoduje błąd przyszłego logowania | Supabase nie jest częścią tego wdrożenia; przy jego dodaniu jawnie ustawić callback URLs i użyć środowiska stagingowego. |
| Brak CI pozwala wdrożyć kod bez testów | Do czasu dodania CI wymagać lokalnego uruchomienia testów przed `master`; później dodać wymagane status checks. |
| Wyłączenie weryfikacji TLS osłabia pobieranie zależności | Usunąć `strict-ssl=false` albo zastosować zatwierdzony certyfikat CA i potwierdzić `npm ci`. |
| Stare podatności pozostały w zależnościach | Ponowić audyt przed wdrożeniem; zaakceptować każde nierozwiązane ryzyko jawnie i czasowo. |
| Rollback frontendu nie pasuje do zmian backendu | W tym etapie nie ma backendu; przyszłe migracje Supabase wdrażać oddzielnie, kompatybilnie i z planem odtworzenia. |

## Kryteria zakończenia

- Projekt Pages jest połączony z właściwym repozytorium, a `master` jest jawnie oznaczony jako branch produkcyjny.
- Cloudflare wykonuje produkcyjny build z `npm run build` i publikuje `dist/cost-management-app/browser`.
- Build, testy jednostkowe i wymagane testy desktop/mobile przechodzą lokalnie przed wydaniem.
- Główna trasa, bezpośrednie wejścia i odświeżenia tras działają na `*.pages.dev`.
- Demo wysyła `noindex`, nie zawiera sekretów ani danych prywatnych i jest opisane jako lokalna makieta.
- Uprawnienia GitHub App są ograniczone do potrzebnego repozytorium, jeśli to możliwe.
- Brak CI, brak backendu Supabase i znane ryzyka zależności są jawnie odnotowane; udany Cloudflare build nie jest przedstawiany jako dowód przejścia testów.
