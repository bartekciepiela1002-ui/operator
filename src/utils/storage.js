import { today, addMonths } from './helpers'

// ─── Contacts ────────────────────────────────────────────────────────────────

const KEY_CONTACTS = 'operator_contacts'

export const wczytajKontakty = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY_CONTACTS) || '[]')
  } catch {
    return []
  }
}

export const zapiszKontakty = (lista) => {
  localStorage.setItem(KEY_CONTACTS, JSON.stringify(lista))
}

const nowyKontakt = (dane) => ({
  id: crypto.randomUUID(),
  nazwaSlonu: '',
  imie: '',
  telefon: '',
  miasto: '',
  www: '',
  zrodlo: 'inne',
  status: 'do_zadzwonienia',
  tor: null,
  licznikTel: 0,
  licznikOutreach: 0,
  dataOstatniegoKontaktu: null,
  nastepnyKrok: '',
  dataPrzypomnienia: null,
  mailWyslany: false,
  dataMail: null,
  typDemo: null,
  linkLubAdres: '',
  wartoscKontraktu: null,
  powodOdmowy: null,
  szczegolObjekcji: null,
  poraDnia: null,
  dataArchiwizacji: null,
  dataNurturingu: null,
  notatki: [],
  dataUtworzenia: today(),
  ...dane,
})

export const dodajKontakt = (dane) => {
  const kontakty = wczytajKontakty()
  const kontakt = nowyKontakt(dane)
  kontakty.unshift(kontakt)
  zapiszKontakty(kontakty)
  return kontakt
}

export const edytujKontakt = (id, dane) => {
  const kontakty = wczytajKontakty()
  const idx = kontakty.findIndex(k => k.id === id)
  if (idx === -1) return null
  kontakty[idx] = { ...kontakty[idx], ...dane }
  zapiszKontakty(kontakty)
  return kontakty[idx]
}

export const archiwizujKontakt = (id) => {
  const dzis = today()
  return edytujKontakt(id, {
    status: 'archiwum',
    dataArchiwizacji: dzis,
    dataNurturingu: addMonths(dzis, 6),
  })
}

export const usunKontakt = (id) => {
  const kontakty = wczytajKontakty()
  zapiszKontakty(kontakty.filter(k => k.id !== id))
}

export const pobierzKontakt = (id) => {
  return wczytajKontakty().find(k => k.id === id) || null
}

export const pobierzKontakty = (filtry = {}) => {
  let lista = wczytajKontakty()
  if (filtry.status) lista = lista.filter(k => k.status === filtry.status)
  if (filtry.miasto) lista = lista.filter(k => k.miasto === filtry.miasto)
  if (filtry.zrodlo) lista = lista.filter(k => k.zrodlo === filtry.zrodlo)
  return lista
}

// ─── Day Records ──────────────────────────────────────────────────────────────

export const wczytajDzien = (date) => {
  try {
    return JSON.parse(localStorage.getItem(`operator_day_${date}`)) || null
  } catch {
    return null
  }
}

export const zapiszDzien = (day) => {
  localStorage.setItem(`operator_day_${day.date}`, JSON.stringify(day))
}

export const wczytajWszystkieDni = () => {
  const days = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('operator_day_')) {
      try {
        const day = JSON.parse(localStorage.getItem(key))
        if (day) days.push(day)
      } catch {}
    }
  }
  return days.sort((a, b) => a.date.localeCompare(b.date))
}

export const usunWszystkieDni = () => {
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('operator_day_')) keysToRemove.push(key)
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))
}

export const nowyDayRecord = (date) => ({
  date,
  sprintCel: 0,
  sprintWykonano: 0,
  sprintUkonczony: false,
  sen: null,
  aktywnosc: null,
  aktywnoscMin: 0,
  prysznic: null,
  videoUpdate: null,
  tryb: 'normalny',
  pracaWlasciwaMin: 0,
  naukaMin: 0,
  domknieteRzeczy: [],
  strzalNaWynik: '',
  coZadzialalo: '',
  coNieZadzialalo: '',
  powodNiezaliczenia: null,
  analizaNiezaliczenia: '',
  planNaJutro: '',
  status: null,
  errors: [],
})

// ─── Challenge State ──────────────────────────────────────────────────────────

const KEY_CHALLENGE = 'operator_challenge'

const DOMYSLNY_CHALLENGE = {
  startDate: null,
  streakCurrent: 0,
  streakBest: 0,
  aktywny: true,
}

export const wczytajChallenge = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY_CHALLENGE))
    if (!raw) return { ...DOMYSLNY_CHALLENGE }
    // Uzupełnij brakujące pole aktywny dla starych zapisów
    return { aktywny: true, ...raw }
  } catch {
    return { ...DOMYSLNY_CHALLENGE }
  }
}

export const zapiszChallenge = (state) => {
  localStorage.setItem(KEY_CHALLENGE, JSON.stringify(state))
}

// ─── Timer State ──────────────────────────────────────────────────────────────

const KEY_TIMER = 'operator_timer'

const domyslnyTimer = () => ({
  activeCategory: null,
  activeStart: null,
  todayTimes: {},
  countdowns: {},
  lastResetDate: null,
})

export const wczytajTimer = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY_TIMER)) || domyslnyTimer()
  } catch {
    return domyslnyTimer()
  }
}

export const zapiszTimer = (state) => {
  localStorage.setItem(KEY_TIMER, JSON.stringify(state))
}

export const resetTimerJesliNowyDzien = () => {
  const timer = wczytajTimer()
  const dzis = today()
  if (timer.lastResetDate === dzis) return timer

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

// ─── Settings ─────────────────────────────────────────────────────────────────

const KEY_SETTINGS = 'operator_settings'

export const wczytajUstawienia = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY_SETTINGS)) || {}
  } catch {
    return {}
  }
}

export const zapiszUstawienia = (settings) => {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings))
}
