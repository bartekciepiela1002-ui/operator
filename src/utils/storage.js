import { today, addMonths } from './helpers'

const KEY = 'crm_kontakty'

export const wczytajKontakty = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export const zapiszKontakty = (lista) => {
  localStorage.setItem(KEY, JSON.stringify(lista))
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
  poraDnia: null,
  dataArchiwizacji: null,
  dataNurturingu: null,
  notatki: [],
  dataUtworzenia: today(),
  ...dane
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
    dataNurturingu: addMonths(dzis, 6)
  })
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
