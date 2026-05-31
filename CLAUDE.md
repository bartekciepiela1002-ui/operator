# CLAUDE.md — Operator

Plik główny dla Claude Code. Czytaj zawsze na początku sesji.
Do konkretnych modułów doczytuj pliki z `docs/`.

---

## 1. Co to jest

Operator to narzędzie dla przedsiębiorcy prowadzącego cold outreach B2B.
Łączy CRM (kontakty, pipeline) z Challenge (dyscyplina pracy, streak, gamifikacja).
Jeden system — nie dwie aplikacje.

**Aktywna kampania:** 3 wdrożenia × min. 5 000 zł w 30 dni.
Wdrożenie = strona, landing, CRM, automatyzacja, formularz, kalkulator lub kombinacja.

**Użytkownik:** jedna osoba, solo, desktop, codziennie.

**Docelowo:** SaaS dla młodych przedsiębiorców potrzebujących struktury i accountability.

---

## 2. Stack

- **React + Vite**, multi-file, bez backendu
- **Tailwind** utility classes, ciemny motyw (dark HUD)
- **localStorage** — jedyne źródło danych, prefix `operator_*`
- **Polski** język UI, desktop ~1280px+
- **Anthropic API** (`claude-haiku-4-5-20251001`) — opcjonalne, klucz w `operator_settings`
- **GitHub Gist** — backup, token w `operator_settings`

Bez backendu, bez baz danych, bez serverless.

---

## 3. Zasada działania w jednym zdaniu

Każda akcja na kontakcie w CRM → inkrementuje `sprintWykonano` w `DayRecord` → silnik reguł wie że był kontakt z rynkiem → `evaluateDay()` ocenia dzień → streak i levele się aktualizują.

Użytkownik ręcznie wpisuje tylko to czego CRM nie może wiedzieć: **sen, prysznic, trening, update wideo.**

---

## 4. localStorage — klucze

```
operator_contacts              Kontakt[]
operator_day_YYYY-MM-DD        DayRecord — jeden per dzień
operator_challenge             ChallengeState
operator_timer                 TimerState
operator_settings              Settings (klucze API, Gist, pitch)
operator_brief_YYYY-MM-DD      cache AI — NIE backupować
operator_nudges_YYYY-MM-DD     cache AI — NIE backupować
```

Misji nie ma — widok `/misje` usunięty. Levele challengeu zastępują misje całkowicie.

---

## 5. Migracja przy pierwszym uruchomieniu

Przy starcie aplikacji, jeśli `operator_contacts` nie istnieje:

```js
// src/utils/migrate.js
function migrateIfNeeded() {
  if (localStorage.getItem('operator_contacts')) return // już zmigrowne

  // Kontakty CRM
  const stareKontakty = localStorage.getItem('crm_kontakty')
  if (stareKontakty) {
    localStorage.setItem('operator_contacts', stareKontakty)
  }

  // Challenge — startDate i dni
  const staryChallenge = localStorage.getItem('challenge_v1')
  if (staryChallenge) {
    const parsed = JSON.parse(staryChallenge)
    // Przenieś startDate do operator_challenge
    localStorage.setItem('operator_challenge', JSON.stringify({
      startDate: parsed.startDate || null,
      streakCurrent: 0,  // przelicz na nowo
      streakBest: 0,
    }))
    // Nie migruj dni — stary format jest niekompatybilny z DayRecord
  }

  // Timer
  const staryTimer = localStorage.getItem('stoper_v1')
  if (staryTimer) {
    localStorage.setItem('operator_timer', staryTimer)
  }
}
```

Wywołaj `migrateIfNeeded()` w `main.jsx` przed renderem.

---

## 6. Reset challengeu

Reset jest **ręczny** — przycisk w `/ustawienia`.

Co się resetuje przy resecie:
- `operator_challenge.startDate` → nowa data
- `operator_challenge.streakCurrent` → 0
- `operator_challenge.streakBest` → 0
- Wszystkie `operator_day_*` → usunięte

Co NIE resetuje się:
- `operator_contacts` — baza klientów zostaje
- `operator_settings` — ustawienia zostają
- Timer — zostaje

---

## 7. Luki w historii dni

Jeśli użytkownik nie zamknął dnia (brak `operator_day_YYYY-MM-DD` lub `status === null`):

- Dzień traktowany jako `niezaliczony`
- Streak zeruje się dla każdego brakującego dnia
- Nie blokuje zamknięcia kolejnych dni
- W osi czasu `/challenge` brakujące dni = szare kwadraty

---

## 8. Widoki — 12 ekranów

```
/dzis          Dziś — przypomnienia, stale alerty, Brief AI, Nudges AI
/challenge     Dashboard challengeu — streak, oś czasu, levele, formularz dnia
/sprint        Sprint telefonów + FocusMode
/kanban        Kanban pipeline
/lista         Lista kontaktów + filtry
/kontakt/:id   Szczegóły kontaktu
/statystyki    Statystyki CRM + sekcje challengeu
/archiwum      Archiwum + reaktywacja
/digest        Tygodniowy przegląd
/stoper        Stoper kategorii + countdown dopieszczania
/ustawienia    API keys, Gist backup, pitch script, reset challengeu
```

FocusMode = overlay, nie osobna route.
DayStatusBar = pasek na górze, widoczny we wszystkich widokach.
TimerBubble = floating bubble, widoczny we wszystkich widokach.

Widok `/misje` — USUNIĘTY. Levele challengeu są w `/challenge`.

---

## 9. Komponenty globalne (w App.jsx, poza Routes)

```jsx
<OperatorProvider>
  <BrowserRouter>
    <DayStatusBar />        {/* pasek challengeu — zawsze na górze */}
    <div className="flex h-screen">
      <Sidebar />
      <main>
        <Routes>...</Routes>
      </main>
    </div>
    <TimerBubble />         {/* floating — zawsze widoczny */}
    <FocusMode />           {/* overlay — tylko gdy focusModeOpen */}
  </BrowserRouter>
</OperatorProvider>
```

---

## 10. Konteksty React

Jeden główny kontekst zastępuje KontaktyContext i SprintContext.

```
src/context/OperatorContext.jsx

Eksportuje:
  kontakty, odswierzKontakty
  dzisiejszyDzien, odswierzDzien
  inkrementujSprint()          — +1 sprintWykonano (tylko telefony)
  challengeState, odswierzChallenge
  pipeline, sprzedaz, wdrozenia, aktualnyLevel   — obliczane na żywo
  focusModeOpen, setFocusModeOpen
  timerState, startKategoria, stopKategoria, startCountdown
  elapsedSeconds               — ticker co 1s gdy timer aktywny
```

Szczegóły implementacji timera → `docs/TIMER.md`

---

## 11. Mapa plików

```
src/
  context/
    OperatorContext.jsx        NOWY
  utils/
    storage.js                 ROZSZERZONY (operator_* klucze)
    rules.js                   NOWY (evaluateDay, streak, levele, oblicz*)
    migrate.js                 NOWY (migracja crm_* i challenge_v1)
    gistSync.js                ZAKTUALIZOWANY (operator_* prefix)
    mentor.js                  ZAKTUALIZOWANY (budujKontekstOperatora)
    helpers.js                 bez zmian
  components/
    DayStatusBar.jsx           NOWY
    TimerBubble.jsx            NOWY
    ProgressBar.jsx            bez zmian (sprint postęp)
    Sidebar.jsx                ROZSZERZONY
    FocusMode.jsx              bez zmian
    PorannyBrief.jsx           bez zmian
    SmartNudges.jsx            bez zmian
    AlertMentora.jsx           USUNIĘTY (był dla misji)
    StatusBadge.jsx            bez zmian
    Modal.jsx                  bez zmian
    GistSync.jsx               ZAKTUALIZOWANY
    modals/
      ModalDodajKontakt.jsx    bez zmian
      ModalImportCSV.jsx       bez zmian
  views/
    WidokDzis.jsx              bez zmian logiki
    WidokChallenge.jsx         NOWY
    WidokSprint.jsx            bez zmian
    WidokKanban.jsx            bez zmian
    WidokLista.jsx             bez zmian
    WidokKontakt.jsx           bez zmian
    WidokStatystyki.jsx        ROZSZERZONY (sekcje challengeu)
    WidokArchiwum.jsx          bez zmian
    WidokDigest.jsx            bez zmian
    WidokStoper.jsx            NOWY
    WidokUstawienia.jsx        ROZSZERZONY
    WidokMisje.jsx             USUNIĘTY
  App.jsx                      ROZSZERZONY
  main.jsx                     ROZSZERZONY (migrateIfNeeded)
  index.css                    bez zmian
docs/
  DATA_MODEL.md
  RULES.md
  TIMER.md
  VIEWS.md
```

---

## 12. Kolejność budowania

Nie przechodź do kolejnego bloku bez przetestowania poprzedniego.

```
BLOK 1 — Fundament
  1. migrate.js — migracja danych
  2. storage.js — funkcje operator_*
  3. rules.js — oblicz*, evaluateDay, computeStreak, getLevelStatus
  4. OperatorContext — provider bez UI
  5. App.jsx — nowa struktura z DayStatusBar i TimerBubble (na razie placeholder)

BLOK 2 — Istniejące widoki (weryfikacja po migracji)
  6. Sprawdź że /dzis, /sprint, /kanban, /lista, /kontakt działają
  7. DayStatusBar — pasek z danymi challengeu
  8. Sidebar — nowe linki, usunięty link do /misje

BLOK 3 — Nowe widoki
  9. WidokChallenge — dashboard + oś czasu + formularz zamknięcia dnia
  10. WidokStoper + TimerBubble (z integracją DayRecord)

BLOK 4 — Rozszerzenia
  11. WidokStatystyki — sekcje challengeu
  12. WidokUstawienia — reset challengeu + data startu

BLOK 5 — AI i Gist
  13. budujKontekstOperatora() — rozszerzony kontekst
  14. gistSync.js — operator_* prefix, bez cache AI
```

---

## 13. Czego nie robić

- Nie cache'uj `pipeline`, `sprzedaz`, `wdrozenia` — zawsze obliczaj z `operator_contacts`
- Nie usuwaj kontaktów fizycznie — archiwizuj
- Nie wliczaj kategorii `nauka` do `pracaWlasciwaMin`
- Nie akceptuj pustego `domknieteRzeczy[]` jako "domknięta rzecz"
- Nie backupuj kluczy `operator_brief_*` i `operator_nudges_*` do Gist
- Nie twórz widoku `/misje` — usunięty, zastąpiony przez `/challenge`
- Nie implementuj uwierzytelniania
- Nie zmieniaj modelu danych bez aktualizacji `docs/DATA_MODEL.md`
- Nie pokazuj funkcji AI gdy brak klucza — pokaż komunikat z linkiem do /ustawienia

---

*Ostatnia aktualizacja: 2026-05-31*
*Przypadek brzegowy nieopisany tutaj → zatrzymaj się i zapytaj właściciela.*
