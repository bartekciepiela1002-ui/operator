import { useState, useEffect } from 'react'
import { zapytajMentoraZKontekstem } from '../utils/mentor'
import { wczytajKontakty } from '../utils/storage'
import AlertMentora from '../components/AlertMentora'
import { getDzisiajLokalnie } from '../utils/helpers'

const DEFINICJE_MISJI = [
  {
    id: 'misja_1',
    numer: 1,
    tytul: 'Pierwsze 15 telefonów',
    opis: 'Ukończ sprint z co najmniej 15 telefonami w ciągu jednego dnia.',
    warunek: 'Sprint dzienny: wykonano >= 15',
  },
  {
    id: 'misja_2',
    numer: 2,
    tytul: 'Pierwsza rozmowa',
    opis: 'Przeprowadź pierwszą realną rozmowę — kontakt przeszedł do statusu "W kontakcie".',
    warunek: 'Istnieje kontakt ze statusem w_kontakcie lub dalej',
  },
  {
    id: 'misja_3',
    numer: 3,
    tytul: 'Pierwsze demo',
    opis: 'Umów pierwsze demo z potencjalnym klientem.',
    warunek: 'Istnieje kontakt ze statusem demo_umowione lub dalej',
  },
  {
    id: 'misja_4',
    numer: 4,
    tytul: '50 telefonów łącznie',
    opis: 'Wykonaj łącznie 50 telefonów we wszystkich sprintach.',
    warunek: 'Suma wykonano ze wszystkich sprintów >= 50',
  },
  {
    id: 'misja_5',
    numer: 5,
    tytul: 'Pierwsza sprzedaż',
    opis: 'Zamknij pierwszą sprzedaż — kontakt w statusie "Zamknięte ✓".',
    warunek: 'Istnieje kontakt ze statusem zamkniete_tak',
  },
  {
    id: 'misja_6',
    numer: 6,
    tytul: '10 000 PLN',
    opis: 'Osiągnij łączną wartość zamkniętych kontraktów >= 10 000 PLN.',
    warunek: 'Suma wartoscKontraktu kontaktów zamkniete_tak >= 10 000 PLN',
  },
]

const PROMPTY_MISJI = {
  misja_1: `
Użytkownik właśnie ukończył swój pierwszy sprint 15 telefonów.
To jego pierwszy poważny krok w cold callingu.
Napisz 3-4 zdania: co to oznacza, co teraz będzie najtrudniejsze
i jedną konkretną rzecz którą powinien zrobić jutro rano.
Bez pochwał i "gratuluję". Mów jak mentor, nie coach motywacyjny.
`.trim(),

  misja_2: `
Użytkownik przeprowadził pierwszą realną rozmowę z właścicielką salonu.
Napisz 3-4 zdania: co teraz powinien ćwiczyć w rozmowach,
na co zwrócić uwagę przy kolejnych 10 rozmowach.
Konkretnie. Bez ogólników.
`.trim(),

  misja_3: `
Użytkownik umówił pierwsze demo. To krytyczny moment.
Napisz 3-4 zdania: jak się przygotować do demo z salonem urody,
co zadać jako pierwsze pytanie, czego unikać.
Konkretnie pod jego branżę (salony urody, automatyzacje AI, 3-5k PLN).
`.trim(),

  misja_4: `
Użytkownik wykonał łącznie 50 telefonów. Ma już pierwsze dane.
Napisz 3-4 zdania: co teraz powinien przeanalizować w swoich wynikach,
jak ocenić czy pitch działa i co poprawić na kolejne 50 telefonów.
`.trim(),

  misja_5: `
Użytkownik zamknął pierwszą sprzedaż. Kamień milowy.
Napisz 3-4 zdania: co ten sukces oznacza dla dalszej drogi,
czego NIE robić teraz (typowe błędy po pierwszym zamknięciu),
i co zrobić w ciągu najbliższych 48 godzin żeby utrzymać momentum.
`.trim(),

  misja_6: `
Użytkownik osiągnął 10 000 PLN z cold outreach. Cel osiągnięty.
Napisz 4-5 zdań: co udowodnił sobie tym wynikiem,
jak zmieni się jego pozycja w kolejnych rozmowach sprzedażowych,
i jeden konkretny następny cel który ma sens na tym etapie.
`.trim(),
}

function sprawdzWarunek(misjaId, kontakty, historiaSpryntow) {
  const STATUSY_DALEJ = [
    'w_kontakcie', 'prosi_o_maila', 'mail_wyslany',
    'demo_umowione', 'po_demo', 'zamkniete_tak', 'zamkniete_nie', 'odlozone'
  ]

  switch (misjaId) {
    case 'misja_1':
      return historiaSpryntow.some(s => (s.wykonano || 0) >= 15)

    case 'misja_2':
      return kontakty.some(k => STATUSY_DALEJ.includes(k.status))

    case 'misja_3':
      return kontakty.some(k =>
        ['demo_umowione', 'po_demo', 'zamkniete_tak', 'zamkniete_nie'].includes(k.status)
      )

    case 'misja_4': {
      const suma = historiaSpryntow.reduce((s, sp) => s + (sp.wykonano || 0), 0)
      return suma >= 50
    }

    case 'misja_5':
      return kontakty.some(k => k.status === 'zamkniete_tak')

    case 'misja_6': {
      const suma = kontakty
        .filter(k => k.status === 'zamkniete_tak')
        .reduce((s, k) => s + (k.wartoscKontraktu || 4000), 0)
      return suma >= 10000
    }

    default: return false
  }
}

function wczytajHistorieSpryntow() {
  const wyniki = []
  for (let i = 0; i < 90; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const rok = d.getFullYear()
    const mies = String(d.getMonth()+1).padStart(2,'0')
    const dzien = String(d.getDate()).padStart(2,'0')
    const key = `crm_sprint_${rok}-${mies}-${dzien}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) wyniki.push(JSON.parse(raw))
    } catch (_) {}
  }
  return wyniki
}

const STORAGE_KEY = 'crm_misje'

function wczytajStanMisji() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw).misje || [] : []
  } catch (_) { return [] }
}

function zapiszStanMisji(misje) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ misje }))
}

export default function WidokMisje() {
  const [stanMisji, setStanMisji] = useState([])
  const [generujeDla, setGenerujeDla] = useState(null)
  const maKlucz = Boolean(localStorage.getItem('crm_anthropic_key'))

  useEffect(() => {
    const kontakty = wczytajKontakty()
    const sprinty = wczytajHistorieSpryntow()
    const aktualnyStan = wczytajStanMisji()

    const nowyStanMisji = DEFINICJE_MISJI.map(def => {
      const istniejacy = aktualnyStan.find(m => m.id === def.id)
      const juzUkonczona = istniejacy?.ukonczona || false
      const warunekSpelniony = sprawdzWarunek(def.id, kontakty, sprinty)

      if (!juzUkonczona && warunekSpelniony) {
        return {
          id: def.id,
          ukonczona: true,
          dataUkonczenia: getDzisiajLokalnie(),
          poradaAI: istniejacy?.poradaAI || null,
          poradaWygenerowanaO: istniejacy?.poradaWygenerowanaO || null,
        }
      }

      return istniejacy || {
        id: def.id,
        ukonczona: false,
        dataUkonczenia: null,
        poradaAI: null,
        poradaWygenerowanaO: null,
      }
    })

    zapiszStanMisji(nowyStanMisji)
    setStanMisji(nowyStanMisji)
  }, [])

  async function generujPorade(misjaId) {
    const prompt = PROMPTY_MISJI[misjaId]
    if (!prompt) return

    setGenerujeDla(misjaId)
    try {
      const porada = await zapytajMentoraZKontekstem(prompt)
      const godzina = new Date().toLocaleTimeString('pl-PL', {
        hour: '2-digit', minute: '2-digit'
      })

      const zaktualizowany = stanMisji.map(m =>
        m.id === misjaId
          ? { ...m, poradaAI: porada, poradaWygenerowanaO: godzina }
          : m
      )
      zapiszStanMisji(zaktualizowany)
      setStanMisji(zaktualizowany)
    } catch (err) {
      console.error('Błąd generowania porady:', err)
    } finally {
      setGenerujeDla(null)
    }
  }

  const ukonczone = stanMisji.filter(m => m.ukonczona).length
  const wszystkich = DEFINICJE_MISJI.length

  return (
    <div className="max-w-2xl mx-auto">
      <AlertMentora />

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.14em',
            color: '#253040', textTransform: 'uppercase', marginBottom: '4px' }}>
            MISJE
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700',
            fontFamily: 'JetBrains Mono, monospace', color: '#E2E8F0' }}>
            {ukonczone}
            <span style={{ color: '#253040' }}> / {wszystkich}</span>
          </div>
        </div>
        <div style={{ width: '200px', height: '3px',
          background: '#131A27', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: ukonczone === wszystkich ? '#10B981' : '#22D4F0',
            borderRadius: '2px',
            width: `${(ukonczone / wszystkich) * 100}%`,
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
          }} />
        </div>
      </div>

      {DEFINICJE_MISJI.map(def => {
        const stan = stanMisji.find(m => m.id === def.id)
        const ukonczona = stan?.ukonczona || false
        const porada = stan?.poradaAI || null
        const generuje = generujeDla === def.id

        return (
          <div key={def.id} style={{
            background: ukonczona ? '#0C151F' : '#13161E',
            border: `1px solid ${ukonczona ? '#22D4F0' : '#1E2A3A'}`,
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center',
              gap: '10px', marginBottom: ukonczona ? '10px' : '4px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: ukonczona ? '#22D4F0' : '#13161E',
                border: `1px solid ${ukonczona ? '#22D4F0' : '#1E2A3A'}`,
                fontSize: '11px', fontWeight: '700',
                fontFamily: 'JetBrains Mono, monospace',
                color: ukonczona ? '#050810' : '#3D5068',
              }}>
                {ukonczona ? '✓' : def.numer}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px', fontWeight: '500',
                  color: ukonczona ? '#E2E8F0' : '#64748B'
                }}>
                  {def.tytul}
                </div>
                {stan?.dataUkonczenia && (
                  <div style={{ fontSize: '10px', color: '#253040', marginTop: '2px' }}>
                    Ukończono {stan.dataUkonczenia}
                  </div>
                )}
              </div>
            </div>

            {!ukonczona && (
              <div style={{ fontSize: '12px', color: '#3D5068',
                lineHeight: '1.5', paddingLeft: '34px' }}>
                {def.opis}
              </div>
            )}

            {ukonczona && (
              <div style={{ paddingLeft: '34px' }}>
                {porada ? (
                  <div>
                    <div style={{ fontSize: '10px', color: '#22D4F0',
                      letterSpacing: '0.1em', marginBottom: '6px' }}>
                      PORADA MENTORA
                    </div>
                    <p style={{ fontSize: '12px', color: '#C8D4E8',
                      lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                      {porada}
                    </p>
                  </div>
                ) : maKlucz ? (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => generujPorade(def.id)}
                    disabled={generuje}
                  >
                    {generuje ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="spinner-cyan" /> Generuję poradę...
                      </span>
                    ) : (
                      '→ Co teraz? Zapytaj mentora'
                    )}
                  </button>
                ) : (
                  <div style={{ fontSize: '11px', color: '#253040' }}>
                    Dodaj klucz API w Ustawieniach aby uzyskać poradę mentora.
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
