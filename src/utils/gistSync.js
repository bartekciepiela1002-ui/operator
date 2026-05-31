// utils/gistSync.js
// GitHub Gist sync dla Operator — backup kluczy operator_* (bez cache AI)

const GIST_TOKEN_KEY = 'operator_gist_token'
const GIST_ID_KEY    = 'operator_gist_id'
const GIST_FILENAME  = 'operator-backup.json'

const WYKLUCZONE_PREFIXY = ['operator_brief_', 'operator_nudges_']

export function getGithubToken() {
  return localStorage.getItem(GIST_TOKEN_KEY) || ''
}

export function saveGithubToken(token) {
  localStorage.setItem(GIST_TOKEN_KEY, token.trim())
}

export function getGistId() {
  return localStorage.getItem(GIST_ID_KEY) || ''
}

function zbierzDane() {
  const dane = {}
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith('operator_')) continue
    if (key === GIST_TOKEN_KEY || key === GIST_ID_KEY) continue
    if (WYKLUCZONE_PREFIXY.some(p => key.startsWith(p))) continue
    dane[key] = localStorage.getItem(key)
  }
  return dane
}

export async function zapiszNaGista() {
  const token = getGithubToken()
  if (!token) throw new Error('Brak tokenu GitHub. Dodaj go w Ustawieniach.')

  const dane = zbierzDane()
  const liczbaKontaktow = (() => {
    try {
      return JSON.parse(dane['operator_contacts'] || '[]').length
    } catch {
      return 0
    }
  })()

  const payload = {
    opis: `Operator — backup ${new Date().toLocaleString('pl-PL')} — ${liczbaKontaktow} kontaktów`,
    dane,
    wersja: '2.0',
    dataBackupu: new Date().toISOString(),
  }

  const gistBody = {
    description: payload.opis,
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(payload, null, 2),
      },
    },
  }

  const gistId = getGistId()
  const url    = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists'
  const method = gistId ? 'PATCH' : 'POST'

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify(gistBody),
  })

  if (res.status === 401) throw new Error('Token GitHub nieprawidłowy lub wygasł.')
  if (!res.ok) throw new Error(`Błąd GitHub API: ${res.status}`)

  const json = await res.json()
  if (!gistId) localStorage.setItem(GIST_ID_KEY, json.id)

  return {
    gistId: json.id,
    url: json.html_url,
    liczbaKontaktow,
    dataBackupu: payload.dataBackupu,
  }
}

export async function przywrocZGista() {
  const token = getGithubToken()
  if (!token) throw new Error('Brak tokenu GitHub. Dodaj go w Ustawieniach.')

  const gistId = getGistId()
  if (!gistId) throw new Error('Brak ID Gista. Wykonaj najpierw zapis.')

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (res.status === 401) throw new Error('Token GitHub nieprawidłowy lub wygasł.')
  if (res.status === 404) throw new Error('Gist nie istnieje. Może został usunięty.')
  if (!res.ok) throw new Error(`Błąd GitHub API: ${res.status}`)

  const gistJson = await res.json()

  // Obsługuj stary (crm-salon-urody-backup.json) i nowy (operator-backup.json) filename
  const plik = gistJson.files?.[GIST_FILENAME]
    || gistJson.files?.['crm-salon-urody-backup.json']
  if (!plik) throw new Error('Plik backup nie znaleziony w Gist.')

  let zawartosc = plik.content
  if (plik.truncated) {
    const rawRes = await fetch(plik.raw_url)
    zawartosc = await rawRes.text()
  }

  const payload = JSON.parse(zawartosc)
  if (!payload.dane) throw new Error('Nieprawidłowy format pliku backup.')

  let licznik = 0
  for (const [key, value] of Object.entries(payload.dane)) {
    // Akceptuj klucze operator_* (nowy format) i crm_* (stary format)
    if (key.startsWith('operator_') || key.startsWith('crm_')) {
      localStorage.setItem(key, value)
      licznik++
    }
  }

  return {
    liczbaKluczy: licznik,
    liczbaKontaktow: (() => {
      try {
        const k = payload.dane['operator_contacts'] || payload.dane['crm_kontakty'] || '[]'
        return JSON.parse(k).length
      } catch {
        return 0
      }
    })(),
    dataBackupu: payload.dataBackupu,
  }
}

export async function testujToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (res.status === 401) throw new Error('Token nieprawidłowy.')
  if (!res.ok) throw new Error(`Błąd: ${res.status}`)
  const user = await res.json()
  return user.login
}
