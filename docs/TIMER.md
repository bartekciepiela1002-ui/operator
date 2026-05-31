# TIMER.md — Operator

Pełna specyfikacja stopera kategorii. Czytaj gdy piszesz OperatorContext (część timer), TimerBubble.jsx lub WidokStoper.jsx.

---

## Zasada działania

Timer żyje w `OperatorContext`. Jeden aktywny interwał (ticker co 1s) aktualizuje `elapsedSeconds` w stanie Reacta — tylko do wyświetlania. Realne czasy są zapisywane do `operator_timer` w localStorage tylko przy `stopKategoria()`.

```
startKategoria(cat)
  → zapisz activeCategory + activeStart = Date.now() do operator_timer
  → uruchom setInterval co 1s → aktualizuj elapsedSeconds w state

stopKategoria()
  → oblicz diff = (Date.now() - activeStart) / 60000 (minuty)
  → todayTimes[activeCategory] += diff
  → zapisz operator_timer
  → wyczyść interval, activeCategory = null, activeStart = null
  → zwróć zaktualizowany TimerState
```

Nigdy nie zapisuj do localStorage co sekundę — tylko przy stop.

---

## OperatorContext — część timerowa

```jsx
// Inicjalizacja
const [timerState, setTimerState] = useState(() => wczytajTimer())
const [elapsedSeconds, setElapsedSeconds] = useState(0)
const intervalRef = useRef(null)

function startKategoria(category) {
  // Zatrzymaj poprzednią jeśli była
  if (timerState.activeCategory) stopKategoria()

  const now = Date.now()
  const newState = {
    ...timerState,
    activeCategory: category,
    activeStart: now,
  }
  setTimerState(newState)
  zapiszTimer(newState)
  setElapsedSeconds(0)

  intervalRef.current = setInterval(() => {
    setElapsedSeconds(s => s + 1)
  }, 1000)
}

function stopKategoria() {
  if (!timerState.activeCategory || !timerState.activeStart) return

  clearInterval(intervalRef.current)
  intervalRef.current = null

  const diffMin = (Date.now() - timerState.activeStart) / 60000
  const newTimes = { ...timerState.todayTimes }
  newTimes[timerState.activeCategory] =
    (newTimes[timerState.activeCategory] || 0) + diffMin

  const newState = {
    ...timerState,
    activeCategory: null,
    activeStart: null,
    todayTimes: newTimes,
  }
  setTimerState(newState)
  zapiszTimer(newState)
  setElapsedSeconds(0)

  return newState
}

// Cleanup przy unmount
useEffect(() => {
  return () => clearInterval(intervalRef.current)
}, [])
```

---

## Obliczanie pracaWlasciwaMin i naukaMin

Wywoływane przy zamknięciu dnia (przed evaluateDay).

```js
function obliczCzasyZTimera(todayTimes) {
  let pracaMin = 0
  let naukaMin = 0

  for (const [cat, min] of Object.entries(todayTimes)) {
    if (KATEGORIE_PRACA.includes(cat)) pracaMin += min
    else if (KATEGORIE_NAUKA.includes(cat)) naukaMin += min
    // KATEGORIE_INNE ('trening') — ignoruj
  }

  return {
    pracaWlasciwaMin: Math.round(pracaMin),
    naukaMin: Math.round(naukaMin),
  }
}
```

Przy zamknięciu dnia w WidokChallenge:

```js
const timerDane = obliczCzasyZTimera(timerState.todayTimes)
// Jeśli użytkownik nie zmienił ręcznie — użyj wartości z timera
const pracaWlasciwaMin = day.pracaWlasciwaMin || timerDane.pracaWlasciwaMin
const naukaMin = day.naukaMin || timerDane.naukaMin
```

Użytkownik może ręcznie poprawić wartości — pole edytowalne, z domyślną wartością z timera.

---

## Countdown dopieszczania

```js
function startCountdown(taskKey) {
  const limitMin = LIMITY_DOPIESZCZANIA[taskKey]
  if (!limitMin) return

  const newCountdowns = {
    ...timerState.countdowns,
    [taskKey]: { limitMin, startedAt: Date.now() }
  }
  const newState = { ...timerState, countdowns: newCountdowns }
  setTimerState(newState)
  zapiszTimer(newState)
}

function sprawdzCountdowns(countdowns) {
  // Sprawdzaj co sekundę w ticker lub w WidokStoper
  const now = Date.now()
  for (const [key, c] of Object.entries(countdowns)) {
    const elapsed = (now - c.startedAt) / 60000
    if (elapsed >= c.limitMin) {
      grajAlarm()
      // Usuń countdown
      stopCountdown(key)
    }
  }
}
```

---

## Web Audio API — alarm

```js
function grajAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.5)
  } catch (e) {
    console.warn('Web Audio niedostępne:', e)
  }
}
```

Wywołaj `grajAlarm()` gdy countdown dobiegnie końca.

---

## TimerBubble.jsx

Floating bubble — zawsze widoczny, renderowany w App.jsx poza `<Routes>`.

```jsx
// Pozycja: prawy dolny róg, position fixed
// UWAGA: position:fixed działa w App.jsx renderowanym w przeglądarce,
// NIE w iframe claude.ai (visualizer). Tu to jest normalna aplikacja — fixed jest OK.

export default function TimerBubble() {
  const { timerState, elapsedSeconds, startKategoria, stopKategoria } = useOperator()
  const navigate = useNavigate()

  const aktywna = timerState.activeCategory
  const totalSecs = aktywna
    ? Math.floor((timerState.todayTimes[aktywna] || 0) * 60) + elapsedSeconds
    : 0

  if (!aktywna) {
    // Bubble w trybie spoczynku — mały, klikalny
    return (
      <button
        onClick={() => navigate('/stoper')}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full
                   bg-[#0C1520] border border-[#1A2535]
                   flex items-center justify-center
                   text-[#64748B] hover:text-[#22D4F0] transition-colors z-50"
        title="Stoper"
      >
        ⏱
      </button>
    )
  }

  // Bubble aktywny — pokazuje kategorię i czas
  return (
    <div className="fixed bottom-6 right-6 z-50
                    bg-[#0C1520] border border-[#22D4F0]/30
                    rounded-lg px-3 py-2 flex items-center gap-3
                    shadow-lg cursor-pointer"
         onClick={() => navigate('/stoper')}
    >
      <div className="w-2 h-2 rounded-full bg-[#22D4F0] animate-pulse" />
      <span className="text-[11px] text-[#64748B] truncate max-w-[100px]">
        {aktywna.replace(/_/g, ' ')}
      </span>
      <span className="font-mono text-[13px] text-[#E2E8F0]">
        {formatSeconds(totalSecs)}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); stopKategoria() }}
        className="text-[#64748B] hover:text-[#EF4444] transition-colors ml-1"
        title="Stop"
      >
        ■
      </button>
    </div>
  )
}

function formatSeconds(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}
```

---

## WidokStoper.jsx — struktura

Trzy sekcje:

### 1. Aktywna sesja

Duży wyświetlacz aktualnej kategorii i czasu. Przycisk Stop.

### 2. Kategorie

Lista wszystkich 20 kategorii. Podział: Praca właściwa / Nauka / Inne.
Klik na kategorię → `startKategoria(cat)`.
Aktywna kategoria podświetlona.
Przy każdej kategorii: łączny czas dziś (z `todayTimes`).

```jsx
// Grupowanie kategorii
const GRUPY = [
  { label: 'Praca właściwa', kategorie: KATEGORIE_PRACA },
  { label: 'Nauka (max 60 min)', kategorie: KATEGORIE_NAUKA },
  { label: 'Inne', kategorie: KATEGORIE_INNE },
]
```

### 3. Countdown dopieszczania

5 zadań z limitami. Każde ma przycisk "Start" i pasek postępu.
Po przekroczeniu limitu: alarm + wizualny alert (border czerwony, tekst "Czas!").

```jsx
const ZADANIA_COUNTDOWN = [
  { key: 'poprawa_oferty',   label: 'Poprawa oferty',    limit: 45 },
  { key: 'montaz_filmu',     label: 'Montaż filmu',      limit: 60 },
  { key: 'opis_posta',       label: 'Opis posta',        limit: 30 },
  { key: 'sekcja_strony',    label: 'Sekcja strony',     limit: 90 },
  { key: 'analiza_kampanii', label: 'Analiza kampanii',  limit: 30 },
]
```

### 4. Podsumowanie dnia (na dole)

```
Praca właściwa:  X h Y min  [pasek: X/8h]
Nauka:           X min       [pasek: X/60min, czerwony jeśli przekroczono]
Trening:         X min
```

---

## Reset timera na nowy dzień

Na początku każdego dnia timer powinien mieć czyste `todayTimes`.
Sprawdzaj przy starcie aplikacji:

```js
function resetTimerJesliNowyDzien() {
  const timer = wczytajTimer()
  const dzis = today()

  // Jeśli ostatnia aktywność była przed dzisiejszym dniem — resetuj todayTimes
  const ostatniaDzien = timer.lastResetDate
  if (ostatniaDzien !== dzis) {
    const newTimer = {
      ...timer,
      activeCategory: null,
      activeStart: null,
      todayTimes: {},
      countdowns: {},
      lastResetDate: dzis,
    }
    zapiszTimer(newTimer)
    return newTimer
  }
  return timer
}
```

Wywołaj w `main.jsx` obok `migrateIfNeeded()`.
Dodaj pole `lastResetDate: string` do TimerState.
