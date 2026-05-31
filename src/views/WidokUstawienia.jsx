import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { zapytajMentora } from '../utils/mentor'
import GistSync from '../components/GistSync'
import { useOperator } from '../context/OperatorContext'
import { zapiszChallenge, usunWszystkieDni, wczytajUstawienia, zapiszUstawienia } from '../utils/storage'

export function loadPitch() {
  return wczytajUstawienia().pitch || { opener: '', objekcje: [] }
}

function savePitch(data) {
  zapiszUstawienia({ ...wczytajUstawienia(), pitch: data })
}

function SekcjaAIMentor() {
  const [klucz, setKlucz] = useState('')
  const [zapisany, setZapisany] = useState(Boolean(wczytajUstawienia().anthropicKey))
  const [zmienMode, setZmienMode] = useState(false)
  const [testStatus, setTestStatus] = useState(null)

  const handleZapisz = () => {
    if (!klucz.trim()) return
    zapiszUstawienia({ ...wczytajUstawienia(), anthropicKey: klucz.trim() })
    setZapisany(true)
    setZmienMode(false)
    setKlucz('')
    setTestStatus(null)
  }

  const handleZmien = () => {
    setZmienMode(true)
    setZapisany(false)
    setTestStatus(null)
  }

  const handleTest = async () => {
    setTestStatus('loading')
    try {
      const odpowiedz = await zapytajMentora({
        systemPrompt: 'Odpowiedz jednym krótkim zdaniem po polsku.',
        userMessage: 'Napisz: połączenie działa poprawnie.'
      })
      setTestStatus({ ok: true, msg: odpowiedz })
    } catch (err) {
      if (err.message === 'BRAK_KLUCZA') {
        setTestStatus({ ok: false, msg: 'Najpierw wpisz i zapisz klucz API' })
      } else if (err.message.includes('401') || err.message.toLowerCase().includes('invalid')) {
        setTestStatus({ ok: false, msg: 'Nieprawidłowy klucz API — sprawdź czy skopiowałeś go poprawnie' })
      } else {
        setTestStatus({ ok: false, msg: err.message })
      }
    }
  }

  return (
    <div className="card p-5 mb-5">
      <p className="section-label mb-5">AI Mentor</p>

      <div className="mb-4">
        <label className="label">Klucz API Anthropic</label>

        {zapisany && !zmienMode ? (
          <div className="flex items-center gap-3">
            <span className="input flex-1 font-mono text-[#64748B] cursor-default select-none">
              ••••••••••••••••••••
            </span>
            <button onClick={handleZmien} className="btn-ghost text-xs shrink-0">
              Zmień klucz
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="password"
              value={klucz}
              onChange={e => setKlucz(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleZapisz() }}
              placeholder="sk-ant-..."
              className="input flex-1 font-mono"
              autoFocus={zmienMode}
            />
            <button
              onClick={handleZapisz}
              disabled={!klucz.trim()}
              className="btn-primary shrink-0 disabled:opacity-40"
            >
              Zapisz klucz
            </button>
          </div>
        )}

        <p className="text-[10px] text-[#64748B] mt-2 leading-relaxed">
          Klucz przechowywany lokalnie w przeglądarce. Nigdy nie opuszcza Twojego komputera.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleTest}
          disabled={testStatus === 'loading'}
          className="btn-ghost text-xs disabled:opacity-40"
        >
          {testStatus === 'loading' ? 'Testuję...' : 'Testuj połączenie'}
        </button>

        {testStatus && testStatus !== 'loading' && (
          <span
            className="text-xs font-mono"
            style={{ color: testStatus.ok ? '#10B981' : '#EF4444' }}
          >
            {testStatus.ok ? `✓ ${testStatus.msg}` : `✗ ${testStatus.msg}`}
          </span>
        )}
      </div>
    </div>
  )
}

function SekcjaChallenge() {
  const { challengeState, odswierzChallenge, odswierzDzien } = useOperator()
  const navigate = useNavigate()
  const [dataStartu, setDataStartu] = useState(() => challengeState?.startDate || '')
  const [savedDate, setSavedDate] = useState(false)
  const [resetModal, setResetModal] = useState(false)

  const aktywny = challengeState?.aktywny ?? true

  const handleZapiszDate = () => {
    if (!dataStartu) return
    const updated = {
      ...challengeState,
      startDate: dataStartu,
    }
    zapiszChallenge(updated)
    odswierzChallenge()
    setSavedDate(true)
    setTimeout(() => setSavedDate(false), 2000)
  }

  const handleToggleAktywny = () => {
    zapiszChallenge({ ...challengeState, aktywny: !aktywny })
    odswierzChallenge()
  }

  const handleReset = () => {
    const nowyStart = new Date().toISOString().split('T')[0]
    usunWszystkieDni()
    zapiszChallenge({ startDate: nowyStart, streakCurrent: 0, streakBest: 0, aktywny: true })
    odswierzChallenge()
    odswierzDzien()
    setResetModal(false)
    navigate('/challenge')
  }

  return (
    <div className="card p-5 mb-5">
      <div className="flex items-center justify-between mb-5">
        <p className="section-label mb-0">Challenge</p>
        <button
          onClick={handleToggleAktywny}
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            aktywny
              ? 'border-[#22D4F0]/30 text-[#22D4F0] hover:bg-[#22D4F0]/10'
              : 'border-[#1A2535] text-[#64748B] hover:border-[#2A3B4C] hover:text-[#E2E8F0]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${aktywny ? 'bg-[#22D4F0]' : 'bg-[#1A2535]'}`} />
          {aktywny ? 'Włączony' : 'Wyłączony'}
        </button>
      </div>

      {!aktywny && (
        <p className="text-[11px] text-[#64748B] mb-5 bg-[#141921] border border-[#1A2535] rounded-lg px-3 py-2">
          Challenge jest wyłączony — pasek statusu, streak i sekcje challengeu są ukryte.
          Dane i historia dni zostają zachowane.
        </p>
      )}

      <div className="mb-5">
        <label className="label">Data startu challengeu</label>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={dataStartu}
            onChange={e => setDataStartu(e.target.value)}
            className="input"
            style={{ colorScheme: 'dark' }}
          />
          <button
            onClick={handleZapiszDate}
            disabled={!dataStartu}
            className="btn-primary shrink-0 disabled:opacity-40"
          >
            Zapisz datę
          </button>
          {savedDate && (
            <span className="text-[#10B981] text-xs font-mono">// Zapisano</span>
          )}
        </div>
        <p className="text-[10px] text-[#64748B] mt-2 leading-relaxed">
          Zmiana daty nie kasuje historii dni. Żeby zacząć od nowa — użyj przycisku Reset poniżej.
        </p>
      </div>

      <div className="border-t border-[#1A2535] pt-4">
        <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
          Reset usuwa wszystkie zamknięte dni, zeruje streak i ustawia datę startu na dziś.
          Kontakty i ustawienia zostają.
        </p>
        <button
          onClick={() => setResetModal(true)}
          className="px-4 py-2 rounded-lg border border-[#EF4444]/40 text-[#EF4444] text-xs font-medium hover:bg-[#EF4444]/10 transition-all"
        >
          Resetuj challenge
        </button>
      </div>

      {resetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(5,8,16,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) setResetModal(false) }}
        >
          <div className="bg-[#0F1218] border border-[#1A2535] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <p className="text-[#E2E8F0] font-medium mb-2 text-sm">Resetuj challenge?</p>
            <p className="text-[#64748B] text-xs mb-5 leading-relaxed">
              Wszystkie zamknięte dni zostaną usunięte, streak wyzerowany, data startu ustawiona na dziś.
              Twoje kontakty i ustawienia API zostają bez zmian.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setResetModal(false)}
                className="btn-ghost text-xs px-4"
              >
                Anuluj
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444] text-xs font-medium hover:bg-[#EF4444]/20 transition-all"
              >
                Tak, resetuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WidokUstawienia() {
  const [pitch, setPitch] = useState(loadPitch)
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef(null)

  const autosave = (newPitch) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => savePitch(newPitch), 800)
  }

  const update = (newPitch) => {
    setPitch(newPitch)
    autosave(newPitch)
    setSaved(false)
  }

  const addObjekcja = () => {
    if (pitch.objekcje.length >= 5) return
    update({ ...pitch, objekcje: [...pitch.objekcje, { tytul: '', odpowiedz: '' }] })
  }

  const updateObjekcja = (i, field, val) => {
    const objekcje = pitch.objekcje.map((o, idx) => idx === i ? { ...o, [field]: val } : o)
    update({ ...pitch, objekcje })
  }

  const removeObjekcja = (i) => {
    update({ ...pitch, objekcje: pitch.objekcje.filter((_, idx) => idx !== i) })
  }

  const saveManual = () => {
    clearTimeout(debounceRef.current)
    savePitch(pitch)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-[#E2E8F0] font-medium text-xl">Ustawienia</h1>
      </div>

      <SekcjaAIMentor />
      <SekcjaChallenge />
      <GistSync />
      <div className="card p-5">
        <p className="section-label mb-5">Skrypt pitcha</p>

        <div className="mb-6">
          <label className="label">Opener / jak zaczynasz rozmowę</label>
          <textarea
            value={pitch.opener}
            onChange={e => update({ ...pitch, opener: e.target.value })}
            placeholder='np. "Dzień dobry, mam na imię X, dzwonię bo znalazłem Państwa salon na Google Maps..."'
            className="input resize-none"
            style={{ minHeight: 88 }}
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">Obiekcje i odpowiedzi</label>
            <button
              onClick={addObjekcja}
              disabled={pitch.objekcje.length >= 5}
              className="btn-ghost text-xs px-2 py-1 disabled:opacity-40"
            >
              + Dodaj objekcję
            </button>
          </div>

          {pitch.objekcje.length === 0 ? (
            <p className="text-[#64748B] text-xs">Brak objekcji. Kliknij "+ Dodaj objekcję" powyżej.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pitch.objekcje.map((obj, i) => (
                <div key={i} className="bg-[#141921] border border-[#1A2535] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[#64748B] text-[10px] shrink-0">{i + 1}.</span>
                    <input
                      type="text"
                      value={obj.tytul}
                      onChange={e => updateObjekcja(i, 'tytul', e.target.value)}
                      placeholder='Objekcja, np. "Za drogo"'
                      className="input py-1 text-xs"
                    />
                    <button
                      onClick={() => removeObjekcja(i)}
                      className="text-[10px] text-[#64748B] hover:text-[#EF4444] transition-colors shrink-0"
                    >
                      Usuń
                    </button>
                  </div>
                  <textarea
                    value={obj.odpowiedz}
                    onChange={e => updateObjekcja(i, 'odpowiedz', e.target.value)}
                    placeholder='Twoja odpowiedź...'
                    className="input resize-none text-xs"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={saveManual} className="btn-primary px-6">Zapisz skrypt</button>
          {saved && <span className="text-[#10B981] text-xs font-mono">// Zapisano</span>}
          <span className="text-[10px] text-[#64748B]">Autosave aktywny</span>
        </div>
      </div>
    </div>
  )
}
