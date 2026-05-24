// utils/gistSync.js
// GitHub Gist sync dla CRM — backup wszystkich kluczy crm_*

const GIST_ID_KEY = 'crm_gist_id';
const GITHUB_TOKEN_KEY = 'crm_github_token';
const GIST_FILENAME = 'crm-salon-urody-backup.json';

export function getGithubToken() {
  return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
}

export function saveGithubToken(token) {
  localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
}

export function getGistId() {
  return localStorage.getItem(GIST_ID_KEY) || '';
}

// Zbiera wszystkie klucze crm_* z localStorage (oprócz tokenu i gist id)
function zbierzDaneCRM() {
  const dane = {};
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('crm_') && key !== GITHUB_TOKEN_KEY && key !== GIST_ID_KEY) {
      dane[key] = localStorage.getItem(key);
    }
  }
  return dane;
}

// Zapisuje dane do GitHub Gist (tworzy nowy lub aktualizuje istniejący)
export async function zapiszNaGista() {
  const token = getGithubToken();
  if (!token) throw new Error('Brak tokenu GitHub. Dodaj go w Ustawieniach.');

  const dane = zbierzDaneCRM();
  const liczbaKontaktow = (() => {
    try {
      return JSON.parse(dane['crm_kontakty'] || '[]').length;
    } catch {
      return 0;
    }
  })();

  const payload = {
    opis: `CRM Salon Urody — backup ${new Date().toLocaleString('pl-PL')} — ${liczbaKontaktow} kontaktów`,
    dane,
    wersja: '1.0',
    dataBackupu: new Date().toISOString(),
  };

  const gistBody = {
    description: payload.opis,
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(payload, null, 2),
      },
    },
  };

  const gistId = getGistId();
  const url = gistId
    ? `https://api.github.com/gists/${gistId}`
    : 'https://api.github.com/gists';
  const method = gistId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify(gistBody),
  });

  if (res.status === 401) throw new Error('Token GitHub nieprawidłowy lub wygasł.');
  if (!res.ok) throw new Error(`Błąd GitHub API: ${res.status}`);

  const json = await res.json();

  // Przy pierwszym zapisie zapamiętaj ID Gista
  if (!gistId) {
    localStorage.setItem(GIST_ID_KEY, json.id);
  }

  return {
    gistId: json.id,
    url: json.html_url,
    liczbaKontaktow,
    dataBackupu: payload.dataBackupu,
  };
}

// Wczytuje dane z GitHub Gist i przywraca do localStorage
export async function przywrocZGista() {
  const token = getGithubToken();
  if (!token) throw new Error('Brak tokenu GitHub. Dodaj go w Ustawieniach.');

  const gistId = getGistId();
  if (!gistId) throw new Error('Brak ID Gista. Wykonaj najpierw zapis.');

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (res.status === 401) throw new Error('Token GitHub nieprawidłowy lub wygasł.');
  if (res.status === 404) throw new Error('Gist nie istnieje. Może został usunięty.');
  if (!res.ok) throw new Error(`Błąd GitHub API: ${res.status}`);

  const gistJson = await res.json();
  const plik = gistJson.files?.[GIST_FILENAME];
  if (!plik) throw new Error(`Plik ${GIST_FILENAME} nie znaleziony w Gist.`);

  // Pobierz pełną treść jeśli została obcięta
  let zawartosc = plik.content;
  if (plik.truncated) {
    const rawRes = await fetch(plik.raw_url);
    zawartosc = await rawRes.text();
  }

  const payload = JSON.parse(zawartosc);
  if (!payload.dane) throw new Error('Nieprawidłowy format pliku backup.');

  // Przywróć wszystkie klucze crm_*
  let licznik = 0;
  for (const [key, value] of Object.entries(payload.dane)) {
    if (key.startsWith('crm_')) {
      localStorage.setItem(key, value);
      licznik++;
    }
  }

  return {
    liczbaKluczy: licznik,
    liczbaKontaktow: (() => {
      try {
        return JSON.parse(payload.dane['crm_kontakty'] || '[]').length;
      } catch {
        return 0;
      }
    })(),
    dataBackupu: payload.dataBackupu,
  };
}

// Testuje token bez zapisywania danych
export async function testujToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (res.status === 401) throw new Error('Token nieprawidłowy.');
  if (!res.ok) throw new Error(`Błąd: ${res.status}`);
  const user = await res.json();
  return user.login; // zwraca nazwę użytkownika GitHub
}
