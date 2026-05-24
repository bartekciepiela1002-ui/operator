import { wczytajKontakty } from './storage'

export async function zapytajMentora({ systemPrompt, userMessage }) {
  const apiKey = localStorage.getItem('crm_anthropic_key')

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
  } catch (networkError) {
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

function budujKontekstCRM() {
  const kontakty = wczytajKontakty()
  const teraz = new Date()

  const aktywne = kontakty.filter(k =>
    !['archiwum', 'zamkniete_tak', 'zamkniete_nie'].includes(k.status)
  )
  const zamknieteTak = kontakty.filter(k => k.status === 'zamkniete_tak')
  const zamknieteNie = kontakty.filter(k => k.status === 'zamkniete_nie')
  const wDemo = kontakty.filter(k =>
    ['demo_umowione', 'po_demo'].includes(k.status)
  )

  const stale = wDemo.map(k => {
    const dni = k.dataOstatniegoKontaktu
      ? Math.floor((teraz - new Date(k.dataOstatniegoKontaktu)) / 86400000)
      : 999
    return { ...k, dniBezkontaktu: dni }
  }).filter(k => k.dniBezkontaktu > 7)

  const wartoscPipeline = kontakty.reduce((sum, k) => {
    const w = k.wartoscKontraktu || 4000
    if (k.status === 'demo_umowione') return sum + w * 0.3
    if (k.status === 'po_demo')       return sum + w * 0.6
    if (k.status === 'zamkniete_tak') return sum + w
    return sum
  }, 0)

  const objekcje = zamknieteNie
    .filter(k => k.powodOdmowy)
    .reduce((acc, k) => {
      acc[k.powodOdmowy] = (acc[k.powodOdmowy] || 0) + 1
      return acc
    }, {})

  const sprinty = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const sprintKey = `crm_sprint_${d.toISOString().split('T')[0]}`
    try {
      const raw = localStorage.getItem(sprintKey)
      if (raw) sprinty.push(JSON.parse(raw))
    } catch (_) {}
  }
  const telefonyTydzien = sprinty.reduce((s, sp) => s + (sp.wykonano || 0), 0)

  const staleZNotatkami = stale.map(k => {
    const ostatnia = k.notatki?.length > 0
      ? k.notatki[k.notatki.length - 1].tresc?.slice(0, 120)
      : null
    return `- ${k.imie} (${k.nazwaSlonu}, ${k.miasto}) — ${k.dniBezkontaktu} dni bez kontaktu. Notatka: "${ostatnia || 'brak'}"`
  }).join('\n')

  const ostatnieOdmowy = zamknieteNie
    .filter(k => k.szczegolObjekcji)
    .slice(-10)
    .map(k => `- [${k.powodOdmowy}] ${k.imie}: "${k.szczegolObjekcji.slice(0, 100)}"`)
    .join('\n')

  return `
Jesteś mentorem sprzedażowym dla polskiego przedsiębiorcy który sprzedaje
automatyzacje AI i strony internetowe właścicielkom salonów urody.
Ticket: 3000-5000 PLN. Działa solo. Cel: pierwsze 10 000 PLN.
Odpowiadaj WYŁĄCZNIE po polsku. Bądź konkretny i bezpośredni. Bez ogólników.
Dawaj rady oparte na danych które widzisz, nie generyczne porady sprzedażowe.

=== DANE CRM ===
Aktywne w pipeline:     ${aktywne.length}
Demo umówione/po demo:  ${wDemo.length} (w tym stale >7 dni: ${stale.length})
Zamknięte - wygrane:    ${zamknieteTak.length}
Zamknięte - przegrane:  ${zamknieteNie.length}
Pipeline (ważony):      ${Math.round(wartoscPipeline)} PLN z 10 000 PLN celu
Telefony ten tydzień:   ${telefonyTydzien}

=== ROZKŁAD OBJEKCJI ===
${Object.entries(objekcje).length > 0
    ? Object.entries(objekcje)
      .sort((a, b) => b[1] - a[1])
      .map(([powod, ilosc]) => `- ${powod}: ${ilosc}x`)
      .join('\n')
    : '- brak danych (za mało zamkniętych kontaktów)'}

=== STALE KONTAKTY (gorące leady które milczą) ===
${staleZNotatkami || '- brak'}

=== OSTATNIE SZCZEGÓŁY ODMÓW ===
${ostatnieOdmowy || '- brak szczegółów (pole wypełnia się po zamknięciu kontaktu)'}
`.trim()
}

export async function zapytajMentoraZKontekstem(userMessage) {
  const systemPrompt = budujKontekstCRM()
  return zapytajMentora({ systemPrompt, userMessage })
}
