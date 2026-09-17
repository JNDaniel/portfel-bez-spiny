# 🧭 BudżetApp — Wizja Produktu, Filozofia & Zakres MVP

> **Manifest:** BudżetApp nie jest kolejnym „arkuszem Excela na telefonie”.  
> Naszym celem jest **budowanie samoświadomości finansowej bez poczucia winy**, w oparciu o minimalizm, automatyzację i psychologię behawioralną.

---

## 🎯 1. Problem, który rozwiązujemy (Dlaczego rynek zawodzi?)

Aplikacje takie jak *Wallet by BudgetBakers*, *Spendee*, *1Money* czy *YNAB* są przez większość ludzi porzucane po 2-3 tygodniach. Dlaczego?
1. **Przeładowanie informacyjne (Cognitive Overload):** Setki kategorii, 50 wykresów, skomplikowane tabele — użytkownik czuje się jak księgowy, a nie człowiek zarządzający własnym portfelem.
2. **Żmudne ręczne klepanie danych:** Konieczność manualnego wpisywania każdej kawy czy bułki rodzi opór i zniechęcenie.
3. **Poczucie winy i efekt demotywacji („What-the-Hell Effect”):**
   * Gdy kupisz bilet na wymarzoną wycieczkę (np. *Japonia 4000 zł*) albo drogi prezent ślubny, tradycyjna aplikacja krzyczy na czerwono: *„PRZEKROCZYŁEŚ BUDŻET O 200%!”*.
   * Mózg traktuje to jako porażkę: *„I tak wszystko zepsułem, to po co mam pilnować obiadów?”* — i użytkownik kasuje aplikację.

---

## 💎 2. Filozofia Projektu (Core Principles)

### A. Zasada 1 Sekundy (Glanceable Dashboard)
Wchodzisz do aplikacji i w ciągu **1 sekundy** wiesz, czy jesteś na dobrej ścieżce:
* **Główny Łuk (Hero Gauge):** Kolor (Zielony `<75%`, Żółty `75-99%`, Czerwony `≥100%`) + wielki procent.
* **Jedna Liczba Dnia (Safe-to-Spend):** *„Bezpiecznie na dziś: **153 zł/dzień** do końca miesiąca”*.
  * Użytkownik nie musi liczyć w głowie — wie natychmiast, czy dzisiejsze wyjście na kolację za 80 zł mieści się w normie.

### B. Izolacja Wydatków Okazjonalnych od Codziennego Życia
W aplikacji istnieją dwa odrębne strumienie finansowe:
1. **🏠 Budżet Codzienny (Styl Życia):**
   * Jedzenie, paliwo, czynsz, kawa, rachunki — to ten wskaźnik decyduje, czy żyjesz na co dzień ponad stan. To on steruje głównym łukiem i Safe-to-Spend.
2. **🎒 Wydatki Okazjonalne & Projekty (Foldery / Wycieczki / Prezenty):**
   * *Wycieczka Japonia 🇯🇵*, *Prezent Urodzinowy 🎁*, *Remont Kuchni 🔨*.
   * Wydatki te są **izolowane** z głównego licznika dziennego i finansowane z puli oszczędności.
   * **Nigdy nie zapalają fałszywego czerwonego alarmu na codziennym łuku!**

### C. Zero-Friction Ingestion (Maksymalnie 5 sekund dziennie)
Człowiek nie może być niewolnikiem wpisywania cyferek. Wprowadzanie danych ma dziać się automatycznie lub w 1 kliknięcie:
* **Push z banku (mBank, Revolut, PKO):** Dymek z powiadomienia ➡️ klikasz *„⚡ Dodaj jednym kliknięciem”* i zapominasz.
* **Skaner OCR:** 1 zdjęcie paragonu ➡️ AI wyciąga sklep, kwotę i pozycje.
* **Głos AI:** Przytrzymujesz mikrofon: *„Wydałem 35 zł na obiad”* ➡️ transakcja gotowa.

### D. Psychologia Zamiast Wstydu (Mindful Guidance)
* **Rozróżnienie charakteru zakupu:** `Potrzebne` (baza egzystencji) vs `Zachcianka / Zbędne` (impuls).
* **Radar Drenażu:** Nie karci za kebaba w nocy, ale pokazuje perspektywę: *„Nocne impulsy to 120 zł/mies. Ograniczenie ich da Ci 1440 zł rocznie na wyjazd”*.
* **Spokojny wieczorny check-in:** Zamiast nerwowych alertów w dzień, cichy raport wieczorem podsumowujący bilans dnia.

---

## 📋 3. Zakres MVP (Co wchodzi w wersję obecną?)

| Moduł | Rola w MVP | Stan wdrożenia |
| :--- | :--- | :--- |
| **Główny Łuk (Hero Gauge)** | Płynny łuk 250°, % zużycia, kwoty Wydano / Limit / Pozostało | ✅ Działa (SVG + Dynamic Gradient) |
| **Safe-to-Spend na dziś** | Dynamiczne wyliczenie bezpiecznego limitu dziennego (zł/dzień) | ✅ Działa (Signals Reactivity) |
| **Wykres Trendu & Kategorie** | Płynna fala wydatków w czasie + paski % najważniejszych kategorii | ✅ Działa (Chart.js + Tailwind) |
| **Rejestr Transakcji (Akordeon)** | Lista pozycji, edytowalna notatka, interaktywne tagi psychologiczne | ✅ Działa |
| **Foldery & Izolacja Wyjazdów** | Wydzielanie transakcji do folderów (np. Wycieczka Japonia) | ✅ Działa |
| **Gesty Mobilne (Ionic Swipe & Long-Press)** | Przesuwanie (Swipe) do usuwania/folderowania + przytrzymanie do multi-select | ✅ Działa |
| **Asystent Push z Banków (Symulator)** | Szybkie dodawanie z dymków bankowych (mBank, Revolut, PKO) | ✅ Działa (Symulator w UI) |
| **Skaner Paragonów OCR & AI** | Ekstrakcja danych ze zdjęć paragonów wraz z wykrywaniem zachcianek | ✅ Działa (Model lokalny/demo) |
| **Asystent Głosowy AI** | Rozpoznawanie mowy NLP z automatyczną kategoryzacją | ✅ Działa |
| **Radar Zbędnych Wydatków** | Analiza zachcianek z kalkulatorem rocznych oszczędności | ✅ Działa |
| **Tracker Płatności Cyklicznych** | Oś czasu subskrypcji i stałych kosztów życia | ✅ Działa |
| **Podsumowanie Okresu AI** | 4 zwięzłe karty: Największy wydatek, Zbędne, Dobra wiadomość, Rekomendacja | ✅ Działa |
| **Kompilacja Hybrydowa (Android APK)** | Gotowość do budowania na telefony przez Capacitor 8 | ✅ Działa (`npm run cap:sync`) |

---

## 🗺️ 4. Roadmapa Rozwoju (Faza v2 i v3)

```
[ MVP: Obecna Faza ]
 ├── Dopracowanie minimalistycznego UX (oczyszczenie ekranu, usunięcie zbędnych elementów)
 ├── Uproszczenie przełącznika: „Wydatki Codzienne” vs „Okazje / Wycieczki”
 └── Płynne animacje dotykowe na telefonie

[ Faza v2: Natywne Funkcje Androida ]
 ├── Autentykacja biometryczna (odcisk palca / Face Unlock) przez Capacitor
 ├── Tło systemowe: Android NotificationListenerService (nasłuch powiadomień bankowych bez włączania appki)
 └── Lokalny filtr galerii (Google ML Kit Text Recognition) — wykrywanie paragonów w screenshotach za 0 zł

[ Faza v3: Chmura & Produkcyjne AI ]
 ├── Lekki backend (np. FastAPI / NestJS w Dockerze) z PostgreSQL
 ├── Brama do Google Gemini 1.5 Flash (tani, multimodalny model do analizy i paragonów)
 └── Inteligentne powiadomienia wieczorne o 21:00 (Mindful Evening Push)
```

---

## ⚖️ 5. Złote Zasady dla Twórców i Agentów AI pracujących nad projektem

1. **Nigdy nie zawalaj ekranu informacjami.** Jeśli nowa funkcja wymaga dodania kolejnego wielkiego widgetu, schowaj ją do modalnego draweru lub kontekstowego widoku.
2. **Żadnych fałszywych alarmów.** Nie krzycz na czerwono, jeśli użytkownik wydał pieniądze na wcześniej zaplanowany cel okazjonalny.
3. **Mniej znaczy więcej.** Najważniejszy jest spokój psychiczny użytkownika. Aplikacja ma dawać poczucie kontroli i ulgi w 5 sekund.
