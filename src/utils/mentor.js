import { wczytajKontakty, wczytajWszystkieDni, wczytajChallenge, wczytajUstawienia } from './storage'
import { budujKontekstOperatora } from './rules'

export async function zapytajMentora({ systemPrompt, userMessage }) {
  const apiKey = wczytajUstawienia().anthropicKey

  if (!apiKey) {
    throw new Error('BRAK_KLUCZA')
  }

  let response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    })
  } catch {
    throw new Error('Brak połączenia z internetem lub serwer niedostępny')
  }

  if (!response.ok) {
    let errMessage = 'Błąd API'
    try {
      const err = await response.json()
      errMessage = err?.error?.message || `HTTP ${response.status}`
    } catch (_) {}
    throw new Error(errMessage)
  }

  const data = await response.json()
  return data.content[0].text
}

function budujSystemPrompt() {
  const kontakty = wczytajKontakty()
  const challenge = wczytajChallenge()
  const days = wczytajWszystkieDni()

  const kontekst = budujKontekstOperatora(kontakty, challenge, days)

  return `Jesteś mentorem sprzedażowym dla polskiego przedsiębiorcy który sprzedaje
automatyzacje AI i strony internetowe właścicielkom salonów urody.
Ticket: 3000-5000 PLN. Działa solo. Aktywna kampania: 3 wdrożenia × min. 5 000 zł w 30 dni.
Odpowiadaj WYŁĄCZNIE po polsku. Bądź konkretny i bezpośredni. Bez ogólników.
Dawaj rady oparte na danych które widzisz, nie generyczne porady sprzedażowe.

=== DANE OPERATORA ===
${kontekst}`
}

export async function zapytajMentoraZKontekstem(userMessage) {
  const systemPrompt = budujSystemPrompt()
  return zapytajMentora({ systemPrompt, userMessage })
}
