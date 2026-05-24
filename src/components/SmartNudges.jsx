import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { zapytajMentoraZKontekstem } from '../utils/mentor'
import { wczytajKontakty } from '../utils/storage'
import { getDzisiajLokalnie } from '../utils/helpers'

const PROMPT_NUDGES = `
Przeanalizuj dane CRM i wygeneruj 2-4 konkretne nudge'y.

Nudge = maksymalnie 2 zdania: co się dzieje + co zrobić.
Bez wstępów. Bez "Zauważam że...". Bez ogólników.

Odpowiedz TYLKO czystym JSON — bez markdown, bez backtick, żadnego tekstu poza tablicą:
[
  { "typ": "warning", "tresc": "treść nudge'a" },
  { "typ": "action",  "tresc": "treść nudge'a" },
  { "typ": "info",    "tresc": "treść nudge'a" }
]

Typy:
- "warning" — coś wymaga uwagi (pipeline wysycha, brak aktywności)
- "action"  — konkretna rzecz do zrobienia dziś
- "info"    — wzorzec wart odnotowania

Nie dodawaj żadnych innych pól poza "typ" i "tresc".
Jeśli wszystko gra — zwróć [].
Sortuj od najważniejszego. Maksymalnie 4.
`.trim()

function obliczNudgeStatyczne(kontakty) {
  const nudges = []
  const teraz = new Date()

  // 1. Brak nowych leadów >5 dni
  const doZadzwonienia = kontakty.filter(k => k.status === 'do_zadzwonienia')
  if (doZadzwonienia.length === 0) {
    nudges.push({
      typ: 'warning',
      tresc: 'Brak kontaktów do zadzwonienia. Zaimportuj nową listę z Outscrapera.'
    })
  } else {
    const najnowszy = doZadzwonienia
      .sort((a, b) => new Date(b.dataUtworzenia) - new Date(a.dataUtworzenia))[0]
    const dni = Math.floor((teraz - new Date(najnowszy.dataUtworzenia)) / 86400000)
    if (dni > 5) nudges.push({
      typ: 'warning',
      tresc: `Nie dodałeś nowych leadów od ${dni} dni. Zaimportuj nową listę.`
    })
  }

  // 2. Stale kontakty demo/po_demo >7 dni — max 2
  const stale = kontakty.filter(k => {
    if (!['demo_umowione', 'po_demo'].includes(k.status)) return false
    if (!k.dataOstatniegoKontaktu) return true
    const dni = Math.floor((teraz - new Date(k.dataOstatniegoKontaktu)) / 86400000)
    return dni > 7
  })
  stale.slice(0, 2).forEach(k => {
    const dni = k.dataOstatniegoKontaktu
      ? Math.floor((teraz - new Date(k.dataOstatniegoKontaktu)) / 86400000)
      : '?'
    nudges.push({
      typ: 'action',
      tresc: `${k.imie || k.nazwaSlonu} (${k.nazwaSlonu}) milczy ${dni} dni po demo. Zadzwoń dziś.`,
      kontaktId: k.id
    })
  })

  // 3. Streak — brak sprintu wczoraj
  const wczoraj = new Date()
  wczoraj.setDate(wczoraj.getDate() - 1)
  const wczorajStr = [
    wczoraj.getFullYear(),
    String(wczoraj.getMonth()+1).padStart(2,'0'),
    String(wczoraj.getDate()).padStart(2,'0')
  ].join('-')
  if (!localStorage.getItem(`crm_sprint_${wczorajStr}`)) {
    nudges.push({
      typ: 'info',
      tresc: 'Wczoraj nie było sprintu. Zacznij dziś żeby odbudować rytm.'
    })
  }

  // 4. Czekają na maila >3 dni
  const czekaMail = kontakty.filter(k => {
    if (k.status !== 'prosi_o_maila') return false
    if (!k.dataOstatniegoKontaktu) return true
    const dni = Math.floor((teraz - new Date(k.dataOstatniegoKontaktu)) / 86400000)
    return dni > 3
  })
  if (czekaMail.length > 0) nudges.push({
    typ: 'action',
    tresc: `${czekaMail.length} ${czekaMail.length === 1 ? 'osoba czeka' : 'osoby czekają'} na maila od ponad 3 dni.`
  })

  return nudges.slice(0, 4)
}

function parsujNudgesAI(tekst) {
  try {
    const czysty = tekst.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(czysty)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(n =>
      typeof n.typ === 'string' && typeof n.tresc === 'string'
    )
  } catch (_) {
    return []
  }
}

function NudgeItem({ nudge, onKliknij }) {
  const styl = {
    warning: { border: '#F59E0B', tekst: '#C8D4E8', bg: '#1F1800', ikona: '⚠' },
    action:  { border: '#22D4F0', tekst: '#C8D4E8', bg: '#0C151F', ikona: '→' },
    info:    { border: '#1E2A3A', tekst: '#64748B', bg: '#13161E', ikona: 'ℹ' },
  }[nudge.typ] || { border: '#1E2A3A', tekst: '#64748B', bg: '#13161E', ikona: 'ℹ' }

  return (
    <div
      onClick={onKliknij || undefined}
      style={{
        background: styl.bg,
        border: `1px solid ${styl.border}`,
        borderRadius: '6px',
        padding: '10px 14px',
        marginBottom: '6px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        cursor: onKliknij ? 'pointer' : 'default',
      }}
    >
      <span style={{ color: styl.border, flexShrink: 0, fontSize: '13px', marginTop: '1px' }}>
        {styl.ikona}
      </span>
      <span style={{ fontSize: '12px', color: styl.tekst, lineHeight: '1.5' }}>
        {nudge.tresc}
      </span>
    </div>
  )
}

export default function SmartNudges() {
  const [nudges, setNudges] = useState([])
  const [ladowanie, setLadowanie] = useState(false)
  const [zrodlo, setZrodlo] = useState(null) // 'ai' | 'static'
  const navigate = useNavigate()

  const cacheKey = `crm_nudges_${getDzisiajLokalnie()}`
  const maKlucz = Boolean(localStorage.getItem('crm_anthropic_key'))

  useEffect(() => {
    if (maKlucz) {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        try {
          const cached = JSON.parse(raw)
          setNudges(cached.nudges || [])
          setZrodlo('ai')
          return
        } catch (_) {}
      }
      generujAI()
    } else {
      setNudges(obliczNudgeStatyczne(wczytajKontakty()))
      setZrodlo('static')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, maKlucz])

  async function generujAI() {
    setLadowanie(true)
    try {
      const tekst = await zapytajMentoraZKontekstem(PROMPT_NUDGES)
      let wynik = parsujNudgesAI(tekst)
      let src = 'ai'
      if (wynik.length === 0) {
        wynik = obliczNudgeStatyczne(wczytajKontakty())
        src = 'static'
      }
      const dane = {
        nudges: wynik,
        wygenerowanoO: new Date().toLocaleTimeString('pl-PL', {
          hour: '2-digit', minute: '2-digit'
        })
      }
      localStorage.setItem(cacheKey, JSON.stringify(dane))
      setNudges(wynik)
      setZrodlo(src)
    } catch (_) {
      const wynik = obliczNudgeStatyczne(wczytajKontakty())
      setNudges(wynik)
      setZrodlo('static')
    } finally {
      setLadowanie(false)
    }
  }

  async function odswiez() {
    localStorage.removeItem(cacheKey)
    setNudges([])
    if (maKlucz) {
      await generujAI()
    } else {
      setNudges(obliczNudgeStatyczne(wczytajKontakty()))
      setZrodlo('static')
    }
  }

  if (!ladowanie && nudges.length === 0) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.14em',
          color: '#253040', textTransform: 'uppercase' }}>
          ALERTY
          {zrodlo === 'ai' && (
            <span style={{ color: '#22D4F0', marginLeft: '6px' }}>· AI</span>
          )}
        </span>
        {!ladowanie && (
          <button
            className="btn-ghost"
            style={{ padding: '3px 8px', fontSize: '11px' }}
            onClick={odswiez}
          >↺</button>
        )}
      </div>

      {ladowanie && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 16px', background: '#13161E',
          border: '1px solid #1E2A3A', borderRadius: '8px' }}>
          <div className="spinner-cyan" />
          <span style={{ fontSize: '12px', color: '#3D5068' }}>
            Analizuję wzorce...
          </span>
        </div>
      )}

      {!ladowanie && nudges.map((nudge, i) => (
        <NudgeItem
          key={i}
          nudge={nudge}
          onKliknij={nudge.kontaktId
            ? () => navigate(`/kontakt/${nudge.kontaktId}`)
            : null}
        />
      ))}
    </div>
  )
}
