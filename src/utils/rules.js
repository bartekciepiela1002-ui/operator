import { today, addMonths, daysDiff } from './helpers'

// ─── Category constants ───────────────────────────────────────────────────────

export const KATEGORIE_PRACA = [
  'cold_call', 'follow_up', 'rozmowy_sprzedazowe', 'pisanie_ofert',
  'wysylanie_wiadomosci', 'nagrywanie_wideo', 'montaz_wideo',
  'publikacja', 'kurs_pawla', 'realizacja_projektu', 'budowanie_strony',
  'automatyzacje', 'analiza_kampanii', 'praca_nad_oferta',
  'case_study', 'demo_dla_klienta', 'administracja', 'inne',
]
export const KATEGORIE_NAUKA = ['nauka']
export const KATEGORIE_INNE = ['trening']

export const LIMITY_DOPIESZCZANIA = {
  poprawa_oferty:   45,
  montaz_filmu:     60,
  opis_posta:       30,
  sekcja_strony:    90,
  analiza_kampanii: 30,
}

// ─── Financial calculations ───────────────────────────────────────────────────

const STATUSY_PIPELINE = [
  'do_zadzwonienia', 'proby_kontaktu', 'w_kontakcie',
  'prosi_o_maila', 'mail_wyslany', 'demo_umowione', 'po_demo',
]

export function obliczPipeline(kontakty) {
  return kontakty
    .filter(k => STATUSY_PIPELINE.includes(k.status))
    .reduce((sum, k) => sum + (k.wartoscKontraktu || 0), 0)
}

export function obliczSprzedaz(kontakty) {
  return kontakty
    .filter(k => k.status === 'zamkniete_tak')
    .reduce((sum, k) => sum + (k.wartoscKontraktu || 0), 0)
}

export function obliczWdrozenia(kontakty) {
  return kontakty.filter(k => k.status === 'zamkniete_tak').length
}

export function obliczWdrozeniaKwalifikowane(kontakty) {
  return kontakty.filter(k =>
    k.status === 'zamkniete_tak' && (k.wartoscKontraktu || 0) >= 5000
  ).length
}

// ─── Levels ───────────────────────────────────────────────────────────────────

const LEVELE_DEF = [
  {
    id: 1,
    nazwa: 'Pierwsze 10 rozmów',
    warunek: (k) => k.filter(x =>
      ['w_kontakcie', 'prosi_o_maila', 'mail_wyslany',
       'demo_umowione', 'po_demo', 'zamkniete_tak', 'zamkniete_nie']
      .includes(x.status)).length >= 10,
  },
  {
    id: 2,
    nazwa: '3 wysłane oferty',
    warunek: (k) => k.filter(x =>
      ['mail_wyslany', 'demo_umowione', 'po_demo', 'zamkniete_tak', 'zamkniete_nie']
      .includes(x.status)).length >= 3,
  },
  {
    id: 3,
    nazwa: '1 wdrożenie ≥ 5 000 zł',
    warunek: (k) => obliczWdrozeniaKwalifikowane(k) >= 1,
  },
  {
    id: 4,
    nazwa: '3 wdrożenia ≥ 5 000 zł',
    warunek: (k) => obliczWdrozeniaKwalifikowane(k) >= 3,
  },
  {
    id: 5,
    nazwa: 'Pipeline ≥ 50 000 zł',
    warunek: (k) => obliczPipeline(k) >= 50000,
  },
  {
    id: 6,
    nazwa: 'Sprzedaż > 30 000 zł',
    warunek: (k) => obliczSprzedaz(k) >= 30000,
  },
]

export function getLevelStatus(kontakty) {
  const levele = LEVELE_DEF.map(l => ({
    ...l,
    osiagniety: l.warunek(kontakty),
  }))

  let aktualnyLevel = 0
  for (const l of levele) {
    if (l.osiagniety) aktualnyLevel = l.id
    else break
  }

  return { aktualnyLevel, levele }
}

// ─── Day evaluation ───────────────────────────────────────────────────────────

export function evaluateDay(day, kontakty) {
  const errors = []
  const tryb = day.tryb || 'normalny'

  if (day.sen === null || day.sen === undefined) {
    errors.push('brak_danych_sen')
  } else if (day.sen < 6 || day.sen > 8) {
    errors.push(day.sen < 6 ? 'za_malo_snu' : 'za_duzo_snu')
  }

  if (!day.aktywnosc) errors.push('brak_treningu')
  if (!day.prysznic) errors.push('brak_prysznica')
  if (!day.videoUpdate) errors.push('brak_video_update')

  if ((day.sprintWykonano || 0) === 0) errors.push('brak_kontaktu_z_rynkiem')

  const masDomkniete = Array.isArray(day.domknieteRzeczy) &&
    day.domknieteRzeczy.some(r => r && r.trim().length > 0)
  if (!masDomkniete) errors.push('brak_domknietej_rzeczy')

  const minPraca = tryb === 'urlopowy' ? 120 : 240
  if ((day.pracaWlasciwaMin || 0) < minPraca) errors.push('za_malo_pracy')

  if ((day.naukaMin || 0) > 60) errors.push('nauka_przekracza_limit')

  const blokujace = errors.filter(e => e !== 'nauka_przekracza_limit')
  if (blokujace.length > 0) return { status: 'niezaliczony', errors }
  if (tryb === 'urlopowy') return { status: 'urlopowy', errors }
  if ((day.pracaWlasciwaMin || 0) >= 360) return { status: 'mocno_zaliczony', errors }
  return { status: 'zaliczony', errors }
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export function computeStreak(days, challenge) {
  if (!challenge.startDate) return { current: 0, best: 0 }

  const start = new Date(challenge.startDate)
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  let tempStreak = 0
  let best = 0

  for (let d = new Date(start); d <= todayDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const day = days.find(x => x.date === dateStr)
    const status = day?.status ?? null

    if (['zaliczony', 'mocno_zaliczony', 'urlopowy'].includes(status)) {
      tempStreak++
      if (tempStreak > best) best = tempStreak
    } else {
      tempStreak = 0
    }
  }

  return { current: tempStreak, best }
}

// ─── Timer calculations ───────────────────────────────────────────────────────

export function obliczCzasyZTimera(todayTimes) {
  let pracaMin = 0
  let naukaMin = 0

  for (const [cat, min] of Object.entries(todayTimes || {})) {
    if (KATEGORIE_PRACA.includes(cat)) pracaMin += min
    else if (KATEGORIE_NAUKA.includes(cat)) naukaMin += min
  }

  return {
    pracaWlasciwaMin: Math.round(pracaMin),
    naukaMin: Math.round(naukaMin),
  }
}

// ─── CRM helpers ──────────────────────────────────────────────────────────────

export function sprawdzAutoArchiwizacje(kontakt) {
  if (kontakt.licznikTel >= 6 && kontakt.licznikOutreach >= 2) {
    return {
      status: 'archiwum',
      dataArchiwizacji: today(),
      dataNurturingu: addMonths(today(), 6),
    }
  }
  return null
}

export function getStaleAlerts(kontakty) {
  return kontakty.filter(k =>
    ['demo_umowione', 'po_demo'].includes(k.status) &&
    daysDiff(k.dataOstatniegoKontaktu) > 7
  )
}

export function getPrzypomnieniaOnToday(kontakty) {
  const dzis = today()
  return kontakty.filter(k =>
    k.dataPrzypomnienia === dzis && k.status !== 'archiwum'
  )
}

// ─── AI context builder ───────────────────────────────────────────────────────

function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export function budujKontekstOperatora(kontakty, challenge, days) {
  const dzis = today()
  const dzisiejszyDzien = days.find(d => d.date === dzis)
  const ostatnie7Dni = days
    .filter(d => d.date >= addDays(dzis, -7) && d.date <= dzis)
    .sort((a, b) => a.date.localeCompare(b.date))

  const { current: streakCurrent, best: streakBest } = computeStreak(days, challenge)
  const { aktualnyLevel } = getLevelStatus(kontakty)
  const dayNumber = challenge.startDate
    ? Math.floor((Date.now() - new Date(challenge.startDate).getTime()) / 86400000) + 1
    : null

  const statusEmoji = { zaliczony: '✓', mocno_zaliczony: '★', urlopowy: '○', niezaliczony: '✗' }

  return `
Operator — CRM + Challenge

PIPELINE:
- Aktywnych kontaktów: ${kontakty.filter(k => !['archiwum', 'zamkniete_tak', 'zamkniete_nie'].includes(k.status)).length}
- Demo umówionych/po demo: ${kontakty.filter(k => ['demo_umowione', 'po_demo'].includes(k.status)).length}
- Pipeline wartość: ${obliczPipeline(kontakty)} PLN
- Zamknięte wygrane: ${obliczWdrozeniaKwalifikowane(kontakty)}/3 (${obliczSprzedaz(kontakty)} PLN)

CHALLENGE:
- Dzień: ${dayNumber ?? '?'}/30
- Level: ${aktualnyLevel}/6
- Streak: ${streakCurrent} (rekord: ${streakBest})
- Ostatnie 7 dni: ${ostatnie7Dni.map(d => statusEmoji[d.status] ?? '?').join(' ')}

DZIŚ:
- Sprint: ${dzisiejszyDzien?.sprintWykonano ?? 0} telefonów
- Praca właściwa: ${Math.round((dzisiejszyDzien?.pracaWlasciwaMin ?? 0) / 6) / 10}h
- Kontakt z rynkiem: ${(dzisiejszyDzien?.sprintWykonano ?? 0) > 0 ? 'TAK' : 'NIE'}
`.trim()
}
