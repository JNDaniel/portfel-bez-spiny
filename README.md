# 💰 BudżetApp — Żywy Dashboard Finansowy & Asystent Wydatków

> **BudżetApp** to ultranowoczesna, estetyczna aplikacja do osobistego zarządzania finansami, stworzona w oparciu o **Angular 19**, **Tailwind CSS**, **Ionic Framework 8** oraz **Capacitor 8** (z natywnym wsparciem dla Android APK).

> 📖 **Główny dokument wizji i filozofii:** Szczegółowy opis założeń, psychologii behawioralnej, problemów tradycyjnych aplikacji oraz zakresu MVP znajduje się w:  
> ➡️ **[`PRODUCT_VISION_AND_MVP.md`](./PRODUCT_VISION_AND_MVP.md)**  
> 📜 **Testament Inżynieryjny & Galeria Widoków (Playwright):** Pełny dokument przekazania projektu z zrzutami ekranu wszystkich widoków znajduje się w:  
> ➡️ **[`PROJECT_TESTAMENT.md`](./PROJECT_TESTAMENT.md)**

---

## ✨ Kluczowe Funkcje i Wdrożone Game Changery

### 1. 🎯 Główny Łuk Budżetowy (Hero Gauge) + Safe-to-Spend
* **Dynamiczny świecący łuk procentowy**: Zmienia kolor w zależności od wykorzystania budżetu (Zielony `<75%`, Żółty `75-99%`, Czerwony `≥100%`).
* **Wskaźnik „Bezpiecznie na dziś” (Safe-to-Spend)**: Wylicza w czasie rzeczywistym ile zł dziennie możesz wydać do końca miesiąca (`np. 153 zł/dzień`), aby nie przekroczyć budżetu.
* **3 Główne Wskaźniki**: `WYDANO`, `LIMIT`, `POZOSTAŁO`.

### 2. 📈 Płynny Wykres Fali + Kategorie
* **Wykres trendu (WYDATKI — LIPIEC)**: Wizualizacja rozkładu wydatków w czasie z porównaniem do poprzedniego miesiąca (`+4% więcej`).
* **Paski kategorii**: *Mieszkanie (68%)*, *Jedzenie (4%)*, *Transport (7%)*, *Zakupy (18%)*, *Zdrowie (2%)*, *Rozrywka (2%)*, *Media (0%)*.

### 3. 📝 Interaktywny Rejestr Transakcji (Akordeon)
* **Kategoryzacja i plakietki**: `✓ Potrzebne`, `Zachcianka`, `Cykliczne`, `Zbędne`, `Służbowe`, `Spożywcze`.
* **Notatki edytowalne w locie** (np. *„Przelew do 10-go”*).
* **Wgrywanie paragonów / faktur (JPG/PNG/PDF)** z natychmiastowym komentarzem AI per transakcja.

### 4. 🔔 Asystent Powiadomień Bankowych (Push Ingestion Assistant)
* Interaktywny symulator powiadomień z banków (*mBank, Revolut, PKO BP, Santander*).
* Dymek szybkiej akcji: **„⚡ Dodaj jednym kliknięciem”** z automatycznym dopasowaniem kategorii, kwoty i tagów.

### 5. 📸 Skaner Paragonów OCR & AI
* Skanowanie aparatem lub plikiem z automatyczną ekstrakcją sklepu, kwoty, pozycji na paragonie oraz wykrywaniem zachcianek.

### 6. 🎙️ Głosowe Dodawanie Wydatków (Voice AI)
* Mówisz: *„Wydałem 35 zł na obiad”* — silnik NLP natychmiast parsuje kwotę, tytuł i kategorię `Jedzenie`.

### 7. 🚨 Radar Zbędnych Wydatków (Drenaż Portfela)
* Agregacja tagów `Zbędne` i `Zachcianka` z kalkulatorem rocznych oszczędności przy redukcji o 50% (np. `+2 472 zł/rok`).

### 8. 🔄 Tracker Subskrypcji i Płatności Cyklicznych
* Oś czasu nadchodzących pobrań (*Netflix za 3 dni, Czynsz za 6 dni*) oraz wyliczenie stałego miesięcznego kosztu życia.

### 9. ✨ Podsumowanie Okresu AI (4 Wnioski)
* *Największy wydatek*, *Potencjalnie zbędne*, *Dobra wiadomość*, *Rekomendacja AI*.

---

## 🏛️ Gdzie potrzebny jest Backend i Architektura AI

Aplikacja posiada w 100% działający **lokalny silnik Mock & LocalStorage**, więc działa w pełni offline i w przeglądarce.

Gdy będziesz wdrażać produkcyjny backend (np. w **NestJS**, **FastAPI (Python)**, **Go** lub **Spring Boot**), oto punkty podłączenia:

```
[ Angular App (Frontend / Mobile APK) ]
               │
               ▼ (REST API / JWT Auth)
[ Twój Backend (np. FastAPI / NestJS w Dockerze) ]
       │                      │                      │
       ▼                      ▼                      ▼
[ PostgreSQL Database ]  [ S3 / Cloud Storage ]  [ Modele AI (Gemini / OpenAI) ]
 (Transakcje, Budżety)    (Zdjęcia paragonów)     (OCR Vision, Voice, Analizy)
```

---

## 🤖 Jaki pakiet AI wybrać na rynku? (Rekomendacja)

### Z czego korzystają liderzy rynkowi (Allegro, Otodom, Revolut, Klarna):

1. **Google Gemini 1.5 Flash (Zdecydowanie NAJLEPSZY wybór i rekomendacja)**:
   - **Gdzie wykupić**: [Google AI Studio](https://aistudio.google.com/) (proste klucze API) lub **Google Cloud Vertex AI** (dla enterprise / serwerów w Europie — region Frankfurt/Warszawa).
   - **Dlaczego**: Najszybszy model multimodalny na rynku z oknem 1 miliona tokenów. Genialnie czyta zdjęcia paragonów (OCR Vision), faktury PDF i błyskawicznie generuje podsumowania finansowe.
   - **Koszt**: Bardzo tani — pierwsze tysiące zapytań są darmowe w AI Studio, a potem to zaledwie ok. **$0.075 za 1 milion tokenów** (ułamki grosza za analizę paragonu).

2. **OpenAI GPT-4o-mini + Whisper**:
   - **Gdzie wykupić**: [OpenAI Platform](https://platform.openai.com/).
   - **Do czego**: Model `Whisper` jest znakomity do transkrypcji mowy po polsku (Voice AI), a `gpt-4o-mini` kosztuje ~$0.15 / 1M tokenów.

3. **Tworzenie aranżacji wnętrz / grafiki (jak w Otodom / Allegro)**:
   - Korzystają z modeli **Google Imagen 3 (Vertex AI)** lub **FLUX.1 / Stable Diffusion XL** do fotorealistycznych wizualizacji i aranżacji pomieszczeń.

---

## 🚀 Uruchomienie i Budowanie

```bash
# 1. Uruchomienie w przeglądarce
npm start

# 2. Synchronizacja z projektem Capacitor Android
npm run cap:sync

# 3. Otwarcie w Android Studio (do wygenerowania pliku APK)
npm run cap:android

# 4. Bezpośrednie zbudowanie Debug APK przez Gradle
npm run cap:build:apk
```
