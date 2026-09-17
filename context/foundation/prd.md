---
project: "Portfel Bez Spiny"
version: 1
status: draft
created: 2026-09-17
context_type: brownfield
product_type: hybrid-web-mobile
target_scale:
  users: medium
  qps: unknown
  data_volume: unknown
timeline_budget:
  delivery_weeks: 3
  hard_deadline: 2026-11-04
  after_hours_only: true
---

# Portfel Bez Spiny

## Current System Overview

- **Purpose:** Portfel Bez Spiny istnieje dziś jako interaktywna makieta aplikacji do zarządzania wydatkami.
- **Architecture:** Aplikacja działa lokalnie w przeglądarce i przechowuje dane w LocalStorage.
- **Tech stack:** Angular, Ionic i Capacitor, z przygotowaną powierzchnią webową i mobilną.
- **Current user base:** Produkcyjne konta użytkowników nie są jeszcze gotowe.
- **Core functionality:** Obecne widoki obejmują dashboard budżetowy, rejestr transakcji, ręczne dodawanie i tagowanie, izolowanie wydatków okazjonalnych oraz demonstracyjne przepływy automatycznego wprowadzania danych.

## Problem Statement & Motivation

Zmiana ma przekształcić lokalną makietę w produkcyjne MVP z backendem i kontami dla wielu indywidualnych użytkowników. Najważniejszym problemem jest to, że typowe aplikacje traktują każdy wydatek jednakowo: prezent, wyjazd albo inny wydatek okazjonalny może wywołać fałszywy alarm przekroczenia codziennego budżetu. Równolegle użytkownik nie widzi jasno, ile wydaje na zachcianki i niepotrzebne zakupy.

Wydatki okazjonalne mają pozostać oddzielone od codziennego budżetu, a zachcianki mają być widoczne bez odbierania użytkownikowi poczucia kontroli. Automatyczne wprowadzanie wydatków będzie ważne na późniejszym etapie mobilnym, ale nie jest głównym celem pierwszej zmiany.

# TODO: trigger making this change necessary now — see Open Questions

# TODO: current workaround and its cost — see Open Questions

## User & Persona

Główną personą jest indywidualny użytkownik zarządzający własnym budżetem i wydatkami. Produkt od początku ma obsługiwać wielu takich użytkowników z oddzielonymi danymi.

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

- **Before** przepływ działa wyłącznie na lokalnych danych makiety, bez produkcyjnych kont użytkowników.
- **Given** zalogowany użytkownik ma ustawiony miesięczny budżet
- **When** dodaje zwykły wydatek, wydatek okazjonalny i zachciankę, a następnie otwiera dashboard
- **Then** zwykły wydatek wpływa na codzienny budżet, okazja jest od niego odseparowana, zachcianka jest widoczna osobno, a Safe-to-Spend pozostaje zgodny z tymi zasadami

#### Acceptance Criteria

- Każdy wydatek jest widoczny wyłącznie na koncie użytkownika, który go zapisał.
- Wydatek okazjonalny nie zmniejsza codziennego limitu ani Safe-to-Spend.
- Zachcianka jest uwzględniona w codziennym budżecie i widoczna jako osobna klasyfikacja.
- Saldo i Safe-to-Spend odpowiadają zapisanym wydatkom i ich klasyfikacji.
- Główny status sytuacji finansowej pozostaje czytelny w około sekundę.

## Scope of Change

### Access and account data

- [new] FR-001: Niezalogowana osoba can register and sign in with email and password. Priority: must-have.
  > Socrates: Rozważono ryzyko bezpieczeństwa i odzyskiwania kont. Rozstrzygnięcie: zachować email i hasło jako must-have.
- [new] FR-002: Zalogowany użytkownik can access only private data assigned to their account. Priority: must-have.
  > Socrates: Izolacja utrudni użycie obecnych danych demo. Rozstrzygnięcie: zachować FR, a dane demo traktować jako nieprodukcyjne.
- [new] FR-003: Zalogowany użytkownik can set and persist their monthly budget. Priority: must-have.
  > Socrates: Stały domyślny budżet skróciłby pierwszy przepływ. Rozstrzygnięcie: zachować ustawianie budżetu jako must-have.

### Expenses and classification

- [modified] FR-004: Zalogowany użytkownik can create, read, update, and delete their own expenses with persistent storage. Priority: must-have.
  > Socrates: Pełny CRUD zwiększa zakres. Rozstrzygnięcie: zachować go jako podstawę poprawiania błędnych danych.
- [modified] FR-005: Zalogowany użytkownik can classify an expense as everyday, occasional, or a want. Priority: must-have.
  > Socrates: Dodatkowy wybór zwiększa tarcie. Rozstrzygnięcie: zachować trzy klasy, ponieważ realizują główną wartość produktu.

### Budget insight

- [modified] FR-006: Zalogowany użytkownik can view a dashboard calculated from their own data that isolates occasional expenses, shows wants separately, and presents Safe-to-Spend. Priority: must-have.
  > Socrates: Nadmiar informacji może naruszyć zasadę jednej sekundy. Rozstrzygnięcie: zachować FR, ale główny status musi pozostać dominujący.

### Preserved surfaces

- [preserved] FR-007: Zalogowany użytkownik can continue using the application on the web and through the existing mobile surface. Priority: must-have.
  > Socrates: Dwie powierzchnie zwiększają koszt weryfikacji. Rozstrzygnięcie: zachować obie, ponieważ obecna baza już je wspiera.
- [preserved] FR-008: Zalogowany użytkownik can view the existing wants radar with an annual savings projection. Priority: nice-to-have.
  > Socrates: Radar może odciągać od podstawowego przepływu. Rozstrzygnięcie: zachować go jako nice-to-have, bez blokowania MVP.

## Constraints & Compatibility

### Data and compatibility

- Dane demonstracyjne zapisane wcześniej lokalnie nie są migrowane; nowe konta zaczynają od pustych danych.
- Ręczne tworzenie, odczytywanie, edytowanie i usuwanie wydatków musi nadal działać.
- Istniejące tagowanie wydatków musi nadal działać.
- Istniejące przepływy webowe i mobilne muszą nadal działać.
- Saldo i Safe-to-Spend muszą pozostać zgodne z zaakceptowaną regułą domenową.
- Wydatki okazjonalne nie mogą zacząć obciążać codziennego limitu ani Safe-to-Spend.
- Żadna produkcyjna integracja zewnętrzna nie została wskazana jako wymagająca zgodności wstecznej.

### Observable quality requirements

- Główny status finansowy jest widoczny i zrozumiały dla użytkownika w ciągu 1 sekundy od wyświetlenia dashboardu.
- Dane jednego użytkownika nigdy nie są ujawniane innemu użytkownikowi.
- Potwierdzona zapisana operacja pozostaje dostępna po ponownym otwarciu aplikacji.
- Podstawowy przepływ użytkownika działa na aktualnych obsługiwanych powierzchniach webowych i mobilnych.

## Business Logic Changes

System zalicza każdy wydatek do wydatków całkowitych, wyklucza wydatki okazjonalne z codziennego limitu i Safe-to-Spend, a zachcianki zalicza do tych obliczeń i raportuje osobno.

Ta zmiana nie modyfikuje reguły domenowej. Uruchamia istniejącą regułę na prywatnych, trwałych danych przypisanych do kont użytkowników.

## Access Control Changes

Obecna makieta nie ma produkcyjnego uwierzytelniania ani rozdzielenia danych między kontami. MVP dodaje rejestrację i logowanie emailem oraz hasłem.

Wszyscy zalogowani użytkownicy mają jedną płaską rolę i mogą zarządzać wyłącznie własnymi danymi. Niezalogowana osoba próbująca wejść do chronionej części aplikacji jest przekierowywana do logowania.

## Non-Goals

- Ta zmiana nie dostarcza realnego nasłuchiwania powiadomień bankowych ani automatycznego importu wydatków; te integracje pozostają poza trzytygodniowym zakresem.
- Ta zmiana nie dostarcza produkcyjnego OCR paragonów, wprowadzania głosowego ani automatycznej analizy AI; istniejące demonstracje nie są zobowiązaniem MVP.
- Ta zmiana nie wprowadza kont rodzinnych, współdzielonych budżetów ani roli administratora; MVP ma jedną płaską rolę i prywatne dane indywidualnego użytkownika.
- Radar zachcianek, subskrypcje i podsumowania nie są warunkiem ukończenia podstawowego MVP; radar pozostaje funkcją nice-to-have.

## Open Questions

1. **Jaka jest obecna rzeczywista baza użytkowników makiety?** — Owner: user.
2. **Jaki konkretny czynnik sprawia, że ta zmiana jest potrzebna właśnie teraz?** — Owner: user.
3. **Jak użytkownik radzi sobie dziś z opisanym problemem i jaki jest koszt tego obejścia?** — Owner: user.
4. **Jaki jest oczekiwany orientacyjny poziom równoległego użycia produktu?** — Owner: user.
5. **Jaki jest oczekiwany orientacyjny wolumen danych użytkownika?** — Owner: user.
