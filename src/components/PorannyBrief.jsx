import { useState, useEffect } from 'react'
import { zapytajMentoraZKontekstem } from '../utils/mentor'
import { getDzisiajLokalnie } from '../utils/helpers'

const PROMPT_BRIEF = `
Wygeneruj poranny brief sprzedażowy na dziś. Struktura odpowiedzi:

1. WCZORAJ (1-2 zdania) — oceń aktywność na podstawie historii sprintów.
   Jeśli brak danych z wczoraj — powiedz to wprost.

2. DZIŚ — PRIORYTET (1 konkretna akcja, nie lista)
   Jedna rzecz którą powinienem zrobić dziś jako pierwszą. Dlaczego akurat ta.

3. UWAGA (opcjonalnie, tylko jeśli widzisz coś niepokojącego w danych)
   Maksymalnie 2 zdania. Jeśli wszystko gra — pomiń tę sekcję całkowicie.

4. CZAS DO CELU
   Na podstawie wartości pipeline i tempa — ile dni/tygodni do 10 000 PLN
   przy obecnym tempie. Jeśli nie da się wyliczyć (za mało danych) — powiedz to.

Ton: bezpośredni, jak dobry znajomy który zna Twoje liczby.
Bez motywacyjnych frazesów. Bez "Świetnie!" ani "Pamiętaj że...".
Łączna długość: max 150 słów.
`.trim()

export default function PorannyBrief() {
  const [brief, setBrief] = useState(null)
  const [ladowanie, setLadowanie] = useState(false)
  const [blad, setBlad] = useState(null)

  const cacheKey = `crm_brief_${getDzisiajLokalnie()}`

  useEffect(() => {
    const raw = localStorage.getItem(cacheKey)
    if (raw) {
      try { setBrief(JSON.parse(raw)) } catch (_) {}
    }
  }, [cacheKey])

  async function generuj() {
    setLadowanie(true)
    setBlad(null)
    try {
      const tresc = await zapytajMentoraZKontekstem(PROMPT_BRIEF)
      const wygenerowanoO = new Date().toLocaleTimeString('pl-PL', {
        hour: '2-digit', minute: '2-digit'
      })
      const wynik = { tresc, wygenerowanoO }
      localStorage.setItem(cacheKey, JSON.stringify(wynik))
      setBrief(wynik)
    } catch (err) {
      setBlad(err.message)
    } finally {
      setLadowanie(false)
    }
  }

  async function odswiez() {
    localStorage.removeItem(cacheKey)
    setBrief(null)
    await generuj()
  }

  return (
    <div style={{
      background: '#13161E',
      border: '1px solid #1E2A3A',
      borderRadius: '8px',
      padding: '16px 20px',
      marginBottom: '20px'
    }}>
      {/* Nagłówek */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ladowanie || brief || blad ? '12px' : '0'
      }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#253040', textTransform: 'uppercase' }}>
          PORANNY BRIEF
          {brief && (
            <span style={{ color: '#3D5068', marginLeft: '8px' }}>
              · {brief.wygenerowanoO}
            </span>
          )}
        </span>
        {!ladowanie && (
          brief
            ? <button className="btn-ghost" style={{ fontSize: '11px', padding: '3px 10px' }} onClick={odswiez}>↺ Odśwież</button>
            : <button className="btn-ghost" style={{ fontSize: '11px', padding: '3px 10px' }} onClick={generuj}>Generuj →</button>
        )}
      </div>

      {/* Stan 1: niegenerowany */}
      {!brief && !ladowanie && !blad && (
        <p style={{ fontSize: '12px', color: '#3D5068', margin: 0 }}>
          Jeszcze nie wygenerowałeś briefu na dziś. Zajmie ~5 sekund.
        </p>
      )}

      {/* Stan 2: wygenerowany */}
      {brief && !ladowanie && (
        <p style={{ fontSize: '13px', color: '#C8D4E8', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
          {brief.tresc}
        </p>
      )}

      {/* Stan 3: ładowanie */}
      {ladowanie && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="spinner-cyan" />
          <span style={{ fontSize: '12px', color: '#3D5068' }}>Analizuję Twoje dane...</span>
        </div>
      )}

      {/* Stan 4: błąd */}
      {blad && !ladowanie && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#EF4444' }}>
            Nie udało się wygenerować briefu: {blad}
          </span>
          <button className="btn-ghost" style={{ fontSize: '11px', padding: '3px 10px', flexShrink: 0 }} onClick={generuj}>
            Spróbuj ponownie →
          </button>
        </div>
      )}
    </div>
  )
}
