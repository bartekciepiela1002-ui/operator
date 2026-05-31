# RULES.md — Operator

Logika biznesowa. Czytaj gdy piszesz rules.js lub cokolwiek co ocenia dni, liczy streak albo oblicza pipeline.

---

## evaluateDay(day, kontakty)

Zwraca `{ status, errors }`. Zapisuj wynik do DayRecord po wywołaniu.

```js
function evaluateDay(day, kontakty) {
  const errors = []
  const tryb = day.tryb || 'normalny'

  // 1. Sen
  if (day.sen === null || day.sen === undefined) {
    errors.push('brak_danych_sen')
  } else if (day.sen < 6 || day.sen > 8) {
    errors.push(day.sen < 6 ? 'za_malo_snu' : 'za_duzo_snu')
  }

  // 2. Aktywność fizyczna
  if (!day.aktywnosc) errors.push('brak_treningu')

  // 3. Zimny prysznic
  if (!day.prysznic) errors.push('brak_prysznica')

  // 4. Update wideo
  if (!day.videoUpdate) errors.push('brak_video_update')

  // 5. Kontakt z rynkiem — AUTO z CRM
  const kontaktZRynkiem = (day.sprintWykonano || 0) > 0
  if (!kontaktZRynkiem) errors.push('brak_kontaktu_z_rynkiem')

  // 6. Domknięta rzecz — min. 1 niepusty string
  const masDomkniete = Array.isArray(day.domknieteRzeczy) &&
    day.domknieteRzeczy.some(r => r && r.trim().length > 0)
  if (!masDomkniete) errors.push('brak_domknietej_rzeczy')

  // 7. Praca właściwa
  const minPraca = tryb === 'urlopowy' ? 120 : 240
  if ((day.pracaWlasciwaMin || 0) < minPraca) errors.push('za_malo_pracy')

  // 8. Nauka max 60 min (reguła antyoszukiwania — nie blokuje zaliczenia, ale loguj)
  if ((day.naukaMin || 0) > 60) errors.push('nauka_przekracza_limit')
  // Uwaga: nauka_przekracza_limit NIE powoduje niezaliczenia — tylko ostrzeżenie

  // Ocena
  const blokujace = errors.filter(e => e !== 'nauka_przekracza_limit')
  if (blokujace.length > 0) return { status: 'niezaliczony', errors }

  if (tryb === 'urlopowy') return { status: 'urlopowy', errors }

  // Mocno zaliczony: praca >= 6h (360 min)
  if ((day.pracaWlasciwaMin || 0) >= 360) return { status: 'mocno_zaliczony', errors }

  return { status: 'zaliczony', errors }
}
```

---

## computeStreak(days, challenge)

`days` = lista DayRecord posortowana chronologicznie.
`challenge.startDate` = data startu, streak jest liczony od tego dnia.

```js
function computeStreak(days, challenge) {
  if (!challenge.startDate) return { current: 0, best: 0 }

  const start = new Date(challenge.startDate)
  const today = new Date()
  today.setHours(0,0,0,0)

  let current = 0
  let best = 0
  let tempStreak = 0

  // Iteruj po dniach od startDate do dziś
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const day = days.find(x => x.date === dateStr)

    const status = day?.status ?? null

    if (['zaliczony', 'mocno_zaliczony', 'urlopowy'].includes(status)) {
      tempStreak++
      best = Math.max(best, tempStreak)
    } else {
      // niezaliczony LUB brak dnia = zeruje streak
      tempStreak = 0
    }
  }

  // current = streak do dziś (ostatni ciągły)
  current = tempStreak

  return { current, best }
}
```

**Streak jest ograniczony do dni w challengeu** — max tyle ile minęło od startDate.

---

## getLevelStatus(kontakty)

Zwraca aktualny level (1–6) i tablicę ze statusem każdego levelu.

```js
function getLevelStatus(kontakty) {
  const levele = LEVELE.map(l => ({
    ...l,
    osiagniety: l.warunek(kontakty)
  }))

  // Aktualny level = najwyższy osiągnięty (sekwencyjne)
  let aktualnyLevel = 0
  for (const l of levele) {
    if (l.osiagniety) aktualnyLevel = l.id
    else break  // levele są sekwencyjne — stop przy pierwszym nieosigniętym
  }

  return { aktualnyLevel, levele }
}
```

---

## Obliczenia finansowe (zawsze na żywo)

```js
const STATUSY_PIPELINE = [
  'do_zadzwonienia','proby_kontaktu','w_kontakcie',
  'prosi_o_maila','mail_wyslany','demo_umowione','po_demo'
]

function obliczPipeline(kontakty) {
  return kontakty
    .filter(k => STATUSY_PIPELINE.includes(k.status))
    .reduce((sum, k) => sum + (k.wartoscKontraktu || 0), 0)
}

function obliczSprzedaz(kontakty) {
  return kontakty
    .filter(k => k.status === 'zamkniete_tak')
    .reduce((sum, k) => sum + (k.wartoscKontraktu || 0), 0)
}

function obliczWdrozenia(kontakty) {
  return kontakty.filter(k => k.status === 'zamkniete_tak').length
}

function obliczWdrożeniaKwalifikowane(kontakty) {
  // Wdrożenia liczące się do celu głównego (≥5000 PLN)
  return kontakty.filter(k =>
    k.status === 'zamkniete_tak' && (k.wartoscKontraktu || 0) >= 5000
  ).length
}
```

Nigdy nie zapisuj tych wartości do DayRecord ani ChallengeState.

---

## Logika pipeline CRM

### Auto-archiwizacja

```js
function sprawdzAutoArchiwizacje(kontakt) {
  if (kontakt.licznikTel >= 6 && kontakt.licznikOutreach >= 2) {
    return {
      status: 'archiwum',
      dataArchiwizacji: today(),
      dataNurturingu: addMonths(today(), 6)
    }
  }
  return null
}
```

### Stale alerty

```js
function getStaleAlerts(kontakty) {
  return kontakty.filter(k =>
    ['demo_umowione', 'po_demo'].includes(k.status) &&
    daysDiff(k.dataOstatniegoKontaktu) > 7
  )
}
```

### Przypomnienia na dziś

```js
function getPrzypomnieniaOnToday(kontakty) {
  const dzis = today()
  return kontakty.filter(k =>
    k.dataPrzypomnienia === dzis && k.status !== 'archiwum'
  )
}
```

---

## Reguły antyoszukiwania

Enforced przez evaluateDay() — nie osobna funkcja, ale warto wiedzieć:

1. `nauka` ≠ praca właściwa — osobny licznik, max 60 min, nie wchodzi do `pracaWlasciwaMin`
2. "Pracowałem nad X" ≠ domknięta rzecz — `domknieteRzeczy[]` musi mieć konkretny efekt
3. `sprintWykonano === 0` = brak kontaktu z rynkiem = błąd blokujący
4. Limit pracy: `pracaWlasciwaMin` max 480 (8h) — po tym nie dokładamy zadań (UI informuje)

---

## Kontekst AI dla mentora

```js
function budujKontekstOperatora(kontakty, challenge, days) {
  const dzis = today()
  const dzisiejszyDzien = days.find(d => d.date === dzis)
  const ostatnie7Dni = days
    .filter(d => d.date >= addDays(dzis, -7) && d.date <= dzis)
    .sort((a,b) => a.date.localeCompare(b.date))

  const { streakCurrent, streakBest } = computeStreak(days, challenge)
  const { aktualnyLevel } = getLevelStatus(kontakty)
  const dayNumber = challenge.startDate
    ? Math.floor((Date.now() - new Date(challenge.startDate).getTime()) / 86400000) + 1
    : null

  return `
Operator — CRM + Challenge

PIPELINE:
- Aktywnych kontaktów: ${kontakty.filter(k => !['archiwum','zamkniete_tak','zamkniete_nie'].includes(k.status)).length}
- Demo umówionych/po demo: ${kontakty.filter(k => ['demo_umowione','po_demo'].includes(k.status)).length}
- Pipeline wartość: ${obliczPipeline(kontakty)} PLN
- Zamknięte wygrane: ${obliczWdrożeniaKwalifikowane(kontakty)}/3 (${obliczSprzedaz(kontakty)} PLN)

CHALLENGE:
- Dzień: ${dayNumber ?? '?'}/30
- Level: ${aktualnyLevel}/6
- Streak: ${streakCurrent} (rekord: ${streakBest})
- Ostatnie 7 dni: ${ostatnie7Dni.map(d => ({zaliczony:'✓',mocno_zaliczony:'★',urlopowy:'○',niezaliczony:'✗'}[d.status] ?? '?')).join(' ')}

DZIŚ:
- Sprint: ${dzisiejszyDzien?.sprintWykonano ?? 0} telefonów
- Praca właściwa: ${Math.round((dzisiejszyDzien?.pracaWlasciwaMin ?? 0) / 6) / 10}h
- Kontakt z rynkiem: ${(dzisiejszyDzien?.sprintWykonano ?? 0) > 0 ? 'TAK' : 'NIE'}
`.trim()
}
```
