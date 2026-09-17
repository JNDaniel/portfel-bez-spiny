---
project: "Portfel Bez Spiny"
context_type: brownfield
created: 2026-09-16
updated: 2026-09-17
product_type: hybrid-web-mobile
target_scale:
  users: medium
  qps: unknown
  data_volume: unknown
timeline_budget:
  delivery_weeks: 6
  hard_deadline: 2026-11-04
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: context type
      decision: brownfield
    - topic: change category
      decision: Produkcyjne MVP na bazie makiety, z nowym backendem i kontami użytkowników.
    - topic: primary pain
      decision: Najważniejsze są fałszywe alarmy wywołane przez wydatki wyjątkowe oraz brak widoczności kosztu zachcianek; automatyczne wprowadzanie stanie się istotne na etapie Androida.
    - topic: primary persona
      decision: Wielu indywidualnych użytkowników zarządzających własnymi wydatkami.
    - topic: preserved behavior
      decision: Zachować izolację wydatków okazjonalnych, odczyt sytuacji w około sekundę, ręczne dodawanie i tagowanie oraz działanie webowe i mobilne przez Capacitor.
    - topic: access control
      decision: Rejestracja i logowanie emailem oraz hasłem, jedna płaska rola użytkownika, izolacja danych między kontami i przekierowanie niezalogowanych osób do logowania.
    - topic: first delivery slice
      decision: Logowanie, ustawienie budżetu, dodanie i oznaczenie wydatku oraz dashboard oddzielający okazje i pokazujący koszt zachcianek.
    - topic: secondary outcome
      decision: Radar zachcianek z roczną projekcją oszczędności jest dodatkiem, a nie warunkiem działania MVP.
    - topic: delivery guardrails
      decision: Brak przecieków danych, poprawne saldo i Safe-to-Spend, izolacja okazji oraz czytelność głównego statusu w około sekundę.
    - topic: domain rule
      decision: Okazja wpływa na wydatki całkowite, ale nie na codzienny limit ani Safe-to-Spend; zachcianka wpływa na oba i jest raportowana osobno.
    - topic: local data migration
      decision: Nie migrować danych demonstracyjnych z LocalStorage; nowe konta zaczynają od pustych danych.
    - topic: observable quality
      decision: Status zrozumiały w 1 sekundę, brak ujawnienia danych między kontami, trwałość zapisanych operacji oraz działanie podstawowego przepływu na aktualnych wersjach web i Android.
    - topic: product surface
      decision: Bez zmiany; hybrydowa aplikacja webowa i mobilna przez Capacitor.
    - topic: target scale
      decision: Od dziesiątek do około stu użytkowników; przy 100x większej skali reguła domenowa pozostaje taka sama, ale rośnie znaczenie izolacji i poprawności danych.
    - topic: delivery timing
      decision: Do sześciu tygodni pracy po godzinach, około 5–10 godzin tygodniowo, z twardym terminem 2026-11-04. Zakres obejmuje stabilizację istniejącego projektu i backend Supabase.
    - topic: excluded scope
      decision: Bez realnego importu z powiadomień, produkcyjnego OCR/głosu/AI, kont współdzielonych i administratorów; radar, subskrypcje i podsumowania nie warunkują ukończenia podstawowego MVP.
    - topic: backend platform
      decision: Produkcyjne MVP użyje Supabase bezpośrednio z warstwy repozytoriów Angulara; Supabase Auth obsłuży email i hasło, Postgres trwałość danych, a Row Level Security wymusi izolację danych. Edge Functions pozostają poza MVP, chyba że pojawi się operacja wymagająca zaufanego sekretu serwerowego.
  frs_drafted: 8
  quality_check_status: accepted
---

## Seed Idea

kontynuacja tego projektu gdzie sie znajdujemy wlasnie - byl zaczety w ostatnim czasie przez antigravity z gemini 3.7-3.8 flash medium effort - ogolem myslalem o aplikacji gdzie mvp byloby ze kazdy  moze sie zalogowac uzupelniac swoje wydatki i moze w przejrzysty sposob tagowac wydatki - tego mi brakuje w innych aplikacjiach - tzn latwo oddzielic wydatek wyjatkowy tj prezent na weseel albo jakis wyjazd zeby nei rujnowac budzetu miesiecznego ktory sobie ustalimy , latwo tagujemy cos jako zachcianka / niepotrzebny wydatek np jakies zakupy w zabce typu kanapka zamiast zrobiena sobie sniadania zeby moc potem widziec ile realnie idzie na takie rzeczy ktorych nie do konca potrzebujemy. To jako mvp ale ooglem to chce isc dlaej i tworzyc aplikacje na andrida ktora nasluchujac powaidomienai wykryje ze powiadomienie dotyczy np wydatku np aplikacja google pay lub bankowa i wykruje uzywajac np api do geminie 1.5 flash  wydatek i jak tyko uruchomimi apikcje to odpali sie monit ze wykryto tyle i tyle wydatkow i zosaytly automatycznie dodane do wydatkow i tak samo np glosowe wprwodzanie. zreszta masz plik readme i testament i dokumentacje dcreenshotow i inne pliki md wiec mozesz to przejrzec

## Current System

Portfel Bez Spiny istnieje dziś jako interaktywna makieta aplikacji do zarządzania wydatkami. Działa lokalnie w przeglądarce i przechowuje dane w LocalStorage. Obecne widoki obejmują dashboard budżetowy, rejestr transakcji, ręczne dodawanie i tagowanie, izolowanie wydatków okazjonalnych oraz demonstracyjne przepływy automatycznego wprowadzania danych.

Istniejący stos obejmuje Angular, Ionic i Capacitor, a projekt ma przygotowaną powierzchnię webową i mobilną. Produkcyjny backend, konta użytkowników i rzeczywiste integracje Android nie są jeszcze gotowe.

Wybranym backendem dla MVP jest Supabase. Aplikacja będzie korzystać z Supabase Auth oraz Postgresa przez dedykowane implementacje istniejących kontraktów repozytoriów. Dostęp do danych będzie egzekwowany w bazie przez Row Level Security, nie tylko przez filtrowanie w interfejsie.

## Vision & Problem Statement

Zmiana ma przekształcić lokalną makietę w produkcyjne MVP z backendem i kontami dla wielu indywidualnych użytkowników. Najważniejszym problemem jest to, że typowe aplikacje traktują każdy wydatek jednakowo: prezent, wyjazd albo inny wydatek okazjonalny może wywołać fałszywy alarm przekroczenia codziennego budżetu. Równolegle użytkownik nie widzi jasno, ile wydaje na zachcianki i niepotrzebne zakupy.

Wydatki okazjonalne mają pozostać oddzielone od codziennego budżetu, a zachcianki mają być widoczne bez odbierania użytkownikowi poczucia kontroli. Automatyczne wprowadzanie wydatków będzie ważne na późniejszym etapie Androida, ale nie jest głównym celem pierwszej zmiany.

## User & Persona

Główną personą jest indywidualny użytkownik zarządzający własnym budżetem i wydatkami. Produkt od początku ma obsługiwać wielu takich użytkowników z oddzielonymi danymi.

## Access Control

Obecna makieta nie ma produkcyjnego uwierzytelniania ani rozdzielenia danych między kontami. MVP dodaje rejestrację i logowanie emailem oraz hasłem.

Wszyscy zalogowani użytkownicy mają jedną płaską rolę i mogą zarządzać wyłącznie własnymi danymi. Niezalogowana osoba próbująca wejść do chronionej części aplikacji jest przekierowywana do logowania.

## Preserved Behavior

- Wydatki okazjonalne pozostają odseparowane od codziennego budżetu.
- Użytkownik może ocenić sytuację finansową w około sekundę.
- Ręczne dodawanie i tagowanie wydatków nadal działa.
- Aplikacja zachowuje działanie webowe i mobilne przez Capacitor.

## Success Criteria

### Primary

- Zalogowany użytkownik może ustawić miesięczny budżet, dodać wydatek, oznaczyć go jako codzienny, okazjonalny albo zachciankę i zobaczyć wynik na dashboardzie.
- Dashboard pokazuje codzienny budżet bez zafałszowania przez wydatki okazjonalne oraz osobno ujawnia koszt zachcianek.

### Secondary

- Radar zachcianek pokazuje roczną projekcję oszczędności, ale nie jest wymagany do uznania podstawowego przepływu za działający.

### Guardrails

- Dane jednego konta nie są dostępne z innego konta.
- Saldo i Safe-to-Spend pozostają zgodne z zapisanymi wydatkami.
- Wydatki okazjonalne nigdy nie obciążają codziennego limitu.
- Główny status sytuacji finansowej pozostaje czytelny w około sekundę.

## User Stories

### US-01: Użytkownik ocenia codzienny budżet bez zafałszowania przez okazje

- **Given** zalogowany użytkownik ma ustawiony miesięczny budżet
- **When** dodaje zwykły wydatek, wydatek okazjonalny i zachciankę, a następnie otwiera dashboard
- **Then** zwykły wydatek wpływa na codzienny budżet, okazja jest od niego odseparowana, zachcianka jest widoczna osobno, a Safe-to-Spend pozostaje zgodny z tymi zasadami

#### Acceptance Criteria

- Każdy wydatek jest widoczny wyłącznie na koncie użytkownika, który go zapisał.
- Wydatek okazjonalny nie zmniejsza codziennego limitu ani Safe-to-Spend.
- Zachcianka jest uwzględniona w codziennym budżecie i widoczna jako osobna klasyfikacja.
- Saldo i Safe-to-Spend odpowiadają zapisanym wydatkom i ich klasyfikacji.
- Główny status sytuacji finansowej pozostaje czytelny w około sekundę.

## Functional Requirements

### Access and account data

- FR-001: Niezalogowana osoba can register and sign in with email and password. Priority: must-have. Change: new
  > Socrates: Rozważono ryzyko bezpieczeństwa i odzyskiwania kont. Rozstrzygnięcie: zachować email i hasło jako must-have.
- FR-002: Zalogowany użytkownik can access only private data assigned to their account. Priority: must-have. Change: new
  > Socrates: Izolacja utrudni użycie obecnych danych demo. Rozstrzygnięcie: zachować FR, a dane demo traktować jako nieprodukcyjne.
- FR-003: Zalogowany użytkownik can set and persist their monthly budget. Priority: must-have. Change: new
  > Socrates: Stały domyślny budżet skróciłby pierwszy przepływ. Rozstrzygnięcie: zachować ustawianie budżetu jako must-have.

### Expenses and classification

- FR-004: Zalogowany użytkownik can create, read, update, and delete their own expenses with persistent storage. Priority: must-have. Change: modified
  > Socrates: Pełny CRUD zwiększa zakres. Rozstrzygnięcie: zachować go jako podstawę poprawiania błędnych danych.
- FR-005: Zalogowany użytkownik can classify an expense as everyday, occasional, or a want. Priority: must-have. Change: modified
  > Socrates: Dodatkowy wybór zwiększa tarcie. Rozstrzygnięcie: zachować trzy klasy, ponieważ realizują główną wartość produktu.

### Budget insight

- FR-006: Zalogowany użytkownik can view a dashboard calculated from their own data that isolates occasional expenses, shows wants separately, and presents Safe-to-Spend. Priority: must-have. Change: modified
  > Socrates: Nadmiar informacji może naruszyć zasadę jednej sekundy. Rozstrzygnięcie: zachować FR, ale główny status musi pozostać dominujący.

### Preserved surfaces

- FR-007: Zalogowany użytkownik can continue using the application on the web and through the existing Capacitor mobile surface. Priority: must-have. Change: preserved
  > Socrates: Dwie powierzchnie zwiększają koszt weryfikacji. Rozstrzygnięcie: zachować obie, ponieważ obecna baza już je wspiera.
- FR-008: Zalogowany użytkownik can view the existing wants radar with an annual savings projection. Priority: nice-to-have. Change: preserved
  > Socrates: Radar może odciągać od podstawowego przepływu. Rozstrzygnięcie: zachować go jako nice-to-have, bez blokowania MVP.

## Business Logic

System zalicza każdy wydatek do wydatków całkowitych, wyklucza wydatki okazjonalne z codziennego limitu i Safe-to-Spend, a zachcianki zalicza do tych obliczeń i raportuje osobno.

Ta zmiana nie modyfikuje reguły domenowej. Uruchamia istniejącą regułę na prywatnych, trwałych danych przypisanych do kont użytkowników.

## Constraints & Preserved Behavior

- Dane demonstracyjne zapisane wcześniej w LocalStorage nie są migrowane; nowe konta zaczynają od pustych danych.
- Ręczne tworzenie, odczytywanie, edytowanie i usuwanie wydatków musi nadal działać.
- Istniejące tagowanie wydatków musi nadal działać.
- Istniejące przepływy webowe i mobilne przez Capacitor muszą nadal działać.
- Saldo i Safe-to-Spend muszą pozostać zgodne z zaakceptowaną regułą domenową.
- Wydatki okazjonalne nie mogą zacząć obciążać codziennego limitu ani Safe-to-Spend.

## Non-Functional Requirements

- Główny status finansowy jest widoczny i zrozumiały dla użytkownika w ciągu 1 sekundy od wyświetlenia dashboardu.
- Dane jednego użytkownika nigdy nie są ujawniane innemu użytkownikowi.
- Potwierdzona zapisana operacja pozostaje dostępna po ponownym otwarciu aplikacji.
- Podstawowy przepływ użytkownika działa na aktualnych wersjach web i Android.

## Non-Goals

- Ta zmiana nie dostarcza realnego nasłuchiwania powiadomień bankowych ani automatycznego importu wydatków; te integracje pozostają poza sześciotygodniowym zakresem.
- Ta zmiana nie dostarcza produkcyjnego OCR paragonów, wprowadzania głosowego ani automatycznej analizy AI; istniejące demonstracje nie są zobowiązaniem MVP.
- Ta zmiana nie wprowadza kont rodzinnych, współdzielonych budżetów ani roli administratora; MVP ma jedną płaską rolę i prywatne dane indywidualnego użytkownika.
- Radar zachcianek, subskrypcje i podsumowania nie są warunkiem ukończenia podstawowego MVP; radar pozostaje funkcją nice-to-have.

## Quality cross-check

- Access Control: present.
- Business Logic: present as a one-sentence domain rule.
- Project artifacts: present with a valid checkpoint.
- Timeline-cost acknowledgment: present through a six-week delivery budget.
- Non-Goals: present.
- Preserved behavior: present.
