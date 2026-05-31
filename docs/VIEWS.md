# VIEWS.md — Operator

Spec widoków. Czytaj gdy budujesz konkretny widok lub komponent globalny.

---

## Komponenty globalne (App.jsx, poza Routes)

### DayStatusBar

Pasek na samej górze — przed Sidebarem i contentem. Zawsze widoczny we wszystkich widokach.

**Zawartość:**
- `Dzień X/30` — z `challenge.startDate`
- `🔥 Streak Y` — z `computeStreak()`
- `Level Z` — badge z `aktualnyLevel`
- Status dnia: ikona (✓ zaliczony / ★ mocno / ○ urlopowy / ✗ niezaliczony / — brak)
- Alert po 16:00 jeśli `sprintWykonano === 0`: `⚠ Brak kontaktu z rynkiem`
- Alert jeśli `pracaWlasciwaMin < 120` i godzina > 17: `⚠ Mało pracy`

Zwijany — przycisk ▴/▾ po prawej, stan w localStorage `operator_statusbar_collapsed`.

### TimerBubble

Floating, prawy dolny róg. Spec w `docs/TIMER.md`.

### ProgressBar

Pasek sprintu — między DayStatusBar a głównym contentem.
Pokazuje `sprintWykonano/sprintCel` jeśli sprint aktywny. Ukryty gdy brak sprintu.

### FocusMode

Overlay fullscreen. Otwierany z `/sprint` lub przycisku w sidebarze.
Pokazuje duży licznik sprintu + przycisk +1. Zamykany Escape lub przyciskiem X.

---

## Sidebar

Linki (kolejność):
1. Dziś — badge: liczba przypomnień + count nudge warning/action
2. Challenge ← NOWY — badge: `Dzień X/30`
3. Sprint — badge: `wykonano/cel` lub `✓` gdy ukończony
4. Kanban
5. Lista
6. Statystyki
7. Archiwum
8. Digest
9. Stoper ← NOWY — badge: aktywna kategoria jeśli timer chodzi
10. Ustawienia (na dole)

Przyciski: `+ Dodaj kontakt`, `Importuj CSV`.
Focus Mode button — widoczny tylko gdy sprint aktywny.

---

## /dzis — Widok Dziś

Bez zmian z CRM. Sekcje:
1. PorannyBrief (AI, cache per dzień)
2. SmartNudges (AI, cache per dzień)
3. Przypomnienia na dziś (`dataPrzypomnienia === dziś`)
4. Stale alerty (`demo_umowione`/`po_demo` bez ruchu >7 dni)

---

## /challenge — Widok Challenge (NOWY)

Główny dashboard challengeu.

**Sekcja 1 — Nagłówek:**
- Duże: `Dzień X / 30`
- Streak current + streak best
- Aktualny level (badge z nazwą)
- Pasek postępu do następnego levelu

**Sekcja 2 — Kafelki (4 karty):**
- Wdrożenia: `X / 3` (kwalifikowane ≥5000 PLN)
- Sprzedaż: `X zł / 15 000 zł`
- Pipeline: `X zł`
- % dni zaliczonych w challengeu

**Sekcja 3 — Dane finansowe tygodnia:**
- Pipeline (tydzień bieżący vs poprzedni)
- Sprzedaż (tydzień bieżący vs poprzedni)
- Wyświetl jako dwie karty z delta strzałką

**Sekcja 4 — Oś czasu (ostatnie 30 dni):**
Siatka kwadratów (jak GitHub contributions).
- Zielony: `zaliczony`
- Cyjan: `mocno_zaliczony`
- Żółty: `urlopowy`
- Czerwony: `niezaliczony`
- Szary: brak dnia (niezamknięty)
Hover na kwadracie → tooltip z datą i statusem.
Klik na kwadrat → inline szczegóły dnia.

**Sekcja 5 — Levele:**
6 poziomów z paskiem postępu i statusem (osiągnięty/aktywny/zablokowany).

**Sekcja 6 — Formularz zamknięcia dnia:**
Widoczny gdy `dzisiejszyDzien?.status === null` (dzień nie zamknięty).

Formularz zawiera:
1. Warunki ręczne (4 togglei):
   - Sen: input liczbowy (godziny)
   - Aktywność fizyczna: toggle + input minut
   - Zimny prysznic: toggle
   - Update wideo: toggle
2. Tryb dnia: `normalny` / `urlopowy` (radio)
3. Domknięte rzeczy: textarea lub lista z przyciskiem `+ Dodaj` (min. 1)
4. Strzał na wynik: input text
5. Praca właściwa: pokazana z timera (edytowalna)
6. Nauka: pokazana z timera (edytowalna)
7. Refleksja (opcjonalna): co zadziałało / co nie / plan na jutro
8. Przycisk `Zamknij dzień` → wywołuje `evaluateDay()` → zapisuje status → aktualizuje streak

Po zamknięciu: animacja statusu dnia + aktualizacja osi czasu.

---

## /sprint — Widok Sprint

Bez zmian z CRM.
- Brak sprintu: input cel + przycisk Startuj
- Aktywny: licznik `wykonano/cel`, pasek postępu, przycisk Focus Mode
- Historia 7 dni

`inkrementujSprint()` — wywoływany TYLKO przy akcjach telefonicznych w WidokKontakt:
- `akcjaNieOdbiera()` → +1
- `akcjaRozmawial()` → +1

Nie inkrementuj przy: mail, demo, zamknięcie, outreach.
Furtka na rozszerzenie: `INKREMENT_AKCJE` = tablica akcji które liczą się do sprintu. Teraz: `['nie_odbiera', 'rozmawial']`.

---

## /kanban — Widok Kanban

Bez zmian z CRM.

---

## /lista — Widok Lista

Bez zmian z CRM.

---

## /kontakt/:id — Widok Kontakt

Bez zmian z CRM. Przypomnienie: `inkrementujSprint()` tylko przy `akcjaNieOdbiera()` i `akcjaRozmawial()`.

---

## /statystyki — Widok Statystyki

Zachowane sekcje CRM + NOWE sekcje challengeu.

**Nowe sekcje (na dole widoku):**

Karta "Cel kampanii":
- `X / 3 wdrożeń` z paskiem postępu
- `X zł / 15 000 zł` sprzedaż
- Szacowany czas do celu przy obecnym tempie

Karta "Efektywność dni":
- % dni zaliczonych łącznie
- Rozkład statusów (zaliczony/mocno/urlopowy/niezaliczony) jako pasek
- Średnia pracaWlasciwaMin w zaliczonych dniach

Wykres "Aktywność CRM vs ocena dnia":
- Oś X: dni challengeu
- Oś Y: sprintWykonano
- Kolor słupka: status dnia (zielony=zaliczony, cyjan=mocno, czerwony=niezaliczony)

---

## /archiwum — Widok Archiwum

Bez zmian z CRM.

---

## /digest — Widok Digest

Bez zmian z CRM.

---

## /stoper — Widok Stoper

Spec w `docs/TIMER.md`.

---

## /ustawienia — Widok Ustawienia

Zachowane sekcje CRM + NOWA sekcja challengeu.

**Sekcje:**

1. **AI Mentor** — klucz Anthropic, test połączenia. Bez zmian.

2. **GitHub Gist Backup** — token, zapis/przywrócenie. Bez zmian poza prefiksem `operator_*`.

3. **Skrypt pitcha** — opener + objekcje. Bez zmian.

4. **Challenge** ← NOWA
   - Data startu challengeu: date picker (tylko jeśli `startDate === null`) lub wyświetl aktualną
   - Przycisk `Resetuj challenge` z potwierdzeniem (modal)
   - Potwierdzenie mówi dokładnie co się dzieje: "Dane kontaktów zostają. Streak, historia dni i postęp levelów zostaną usunięte."
   - Po resecie: redirect do `/challenge`

---

## Modals

### ModalDodajKontakt — bez zmian
### ModalImportCSV — bez zmian

Import CSV nadal deduplikuje po `telefon`. Nowe kontakty → `do_zadzwonienia`.
