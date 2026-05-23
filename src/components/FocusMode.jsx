import { useState, useMemo } from 'react'
import { useKontakty } from '../context/KontaktyContext'
import { useSprint } from '../context/SprintContext'
import { edytujKontakt, archiwizujKontakt } from '../utils/storage'
import { today, POWOD_LABELS } from '../utils/helpers'
import { loadPitch } from '../views/WidokUstawienia'

function PitchPanel() {
  const [open, setOpen] = useState(false)
  const [openObjekcja, setOpenObjekcja] = useState(null)
  const pitch = loadPitch()
  const hasContent = pitch.opener || pitch.objekcje.length > 0

  return (
    <div className="mt-4 border-t border-[#1A2535] pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-[10px] text-[#64748B] hover:text-[#22D4F0] transition-colors w-full text-left uppercase tracking-[0.1em] font-medium"
      >
        <span>{open ? '▼' : '▶'}</span>
        <span>Skrypt pitcha</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {!hasContent ? (
            <p className="text-[#64748B] text-xs">
              Brak skryptu.{' '}
              <a href="/ustawienia" className="text-[#22D4F0] hover:brightness-110 transition-all">
                Dodaj w Ustawieniach →
              </a>
            </p>
          ) : (
            <>
              {pitch.opener && (
                <div className="bg-[#141921] rounded-lg p-3">
                  <p className="text-[10px] text-[#64748B] uppercase tracking-[0.1em] mb-1.5 font-medium">Opener</p>
                  <p className="text-[#E2E8F0] text-xs leading-relaxed">"{pitch.opener}"</p>
                </div>
              )}
              {pitch.objekcje.length > 0 && (
                <div className="bg-[#141921] rounded-lg p-3">
                  <p className="text-[10px] text-[#64748B] uppercase tracking-[0.1em] mb-2 font-medium">Obiekcje</p>
                  <div className="space-y-1.5">
                    {pitch.objekcje.map((obj, i) => (
                      <div key={i}>
                        <button
                          onClick={() => setOpenObjekcja(openObjekcja === i ? null : i)}
                          className="flex items-center gap-2 text-xs text-[#64748B] hover:text-[#22D4F0] transition-colors w-full text-left"
                        >
                          <span>▸</span>
                          <span>{obj.tytul || `Objekcja ${i + 1}`}</span>
                        </button>
                        {openObjekcja === i && obj.odpowiedz && (
                          <div className="mt-1.5 ml-4 pl-3 border-l border-[#22D4F0]/20">
                            <p className="text-[#64748B] text-xs leading-relaxed">{obj.odpowiedz}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function FocusMode({ onClose }) {
  const { kontakty, odswierz } = useKontakty()
  const { inkrementuj } = useSprint()

  const [pominiete, setPominiete] = useState([])
  const [notatkaMode, setNotatkaMode] = useState(false)
  const [notatkaVal, setNotatkaVal] = useState('')
  const [odlozMode, setOdlozMode] = useState(false)
  const [odlozData, setOdlozData] = useState('')
  const [zamknijMode, setZamknijMode] = useState(false)
  const [zamknijPowod, setZamknijPowod] = useState('')
  const [zamknijSzczegol, setZamknijSzczegol] = useState('')
  const [powodError, setPowodError] = useState(false)

  const kolejka = useMemo(() => {
    return kontakty
      .filter(k =>
        ['do_zadzwonienia', 'proby_kontaktu'].includes(k.status) &&
        !pominiete.includes(k.id)
      )
      .sort((a, b) => {
        const da = a.dataOstatniegoKontaktu || '2000-01-01'
        const db = b.dataOstatniegoKontaktu || '2000-01-01'
        return da.localeCompare(db)
      })
  }, [kontakty, pominiete])

  const kontakt = kolejka[0]

  const resetPanels = () => {
    setNotatkaMode(false)
    setNotatkaVal('')
    setOdlozMode(false)
    setOdlozData('')
    setZamknijMode(false)
    setZamknijPowod('')
    setZamknijSzczegol('')
    setPowodError(false)
  }

  const nastepny = (kid) => {
    setPominiete(p => [...p, kid])
    resetPanels()
    odswierz()
  }

  const handleNieOdbiera = () => {
    const kid = kontakt.id
    const nowy = kontakt.licznikTel + 1
    if (nowy >= 6 && kontakt.licznikOutreach >= 2) {
      archiwizujKontakt(kid)
    } else {
      edytujKontakt(kid, {
        tor: 'nie_odbiera',
        licznikTel: nowy,
        status: 'proby_kontaktu',
        dataOstatniegoKontaktu: today()
      })
    }
    inkrementuj()
    nastepny(kid)
  }

  const handleZapiszRozmowe = () => {
    const kid = kontakt.id
    const dane = { tor: 'rozmawial', status: 'w_kontakcie', dataOstatniegoKontaktu: today() }
    if (notatkaVal.trim()) {
      dane.notatki = [
        { id: crypto.randomUUID(), tresc: notatkaVal.trim(), dataWpisu: new Date().toISOString() },
        ...(kontakt.notatki || [])
      ]
    }
    edytujKontakt(kid, dane)
    inkrementuj()
    nastepny(kid)
  }

  const handleOdloz = () => {
    if (!odlozData) return
    const kid = kontakt.id
    edytujKontakt(kid, { status: 'odlozone', dataPrzypomnienia: odlozData, dataOstatniegoKontaktu: today() })
    inkrementuj()
    nastepny(kid)
  }

  const handleZamknij = () => {
    if (!zamknijPowod) { setPowodError(true); return }
    const kid = kontakt.id
    const dane = { status: 'zamkniete_nie', powodOdmowy: zamknijPowod, dataOstatniegoKontaktu: today() }
    if (zamknijSzczegol.trim()) dane.szczegolObjekcji = zamknijSzczegol.trim()
    edytujKontakt(kid, dane)
    inkrementuj()
    nastepny(kid)
  }

  if (!kontakt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(5,8,16,0.92)' }}>
        <div className="bg-[#0F1218] border border-[#1A2535] rounded-xl p-8 max-w-[420px] w-full animate-entry text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-[#E2E8F0] mb-1">Brak kontaktów</h2>
          <p className="text-[#64748B] text-sm mb-6">Dodaj nowe leady lub sprawdź archiwum.</p>
          <button onClick={onClose} className="btn-primary px-8 py-2.5">Zamknij</button>
        </div>
      </div>
    )
  }

  const ostatniaNota = kontakt.notatki?.[0]
  const anyPanelOpen = notatkaMode || odlozMode || zamknijMode

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(5,8,16,0.92)' }}>
      <div className="bg-[#0F1218] border border-[#1A2535] rounded-xl p-8 max-w-[460px] w-full animate-entry overflow-y-auto" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="section-label">Focus Mode</span>
            <span className="font-mono text-[#64748B] text-xs">{kolejka.length} w kolejce</span>
          </div>
          <button onClick={onClose} className="text-xs text-[#64748B] hover:text-[#E2E8F0] transition-colors">
            ✕ Zakończ
          </button>
        </div>

        {/* Kontakt */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#E2E8F0] leading-tight">{kontakt.imie || kontakt.nazwaSlonu}</h2>
          {kontakt.imie && <p className="text-[#64748B] text-sm mt-0.5">{kontakt.nazwaSlonu}</p>}
          {kontakt.miasto && <p className="text-[#64748B] text-xs mt-0.5">{kontakt.miasto}</p>}

          <a
            href={`tel:${kontakt.telefon}`}
            className="block font-mono font-bold mt-4 mb-2 hover:brightness-110 transition-all"
            style={{ fontSize: '28px', lineHeight: 1, color: '#22D4F0' }}
          >
            {kontakt.telefon}
          </a>

          {kontakt.tor === 'nie_odbiera' && (
            <span className="text-[10px] font-mono bg-[#141921] text-[#F59E0B] px-2 py-0.5 rounded">
              Próba {kontakt.licznikTel + 1}/6
            </span>
          )}
        </div>

        {/* Ostatnia notatka */}
        {ostatniaNota && !anyPanelOpen && (
          <div className="bg-[#141921] border border-[#1A2535] rounded-lg p-3 mb-5">
            <p className="text-[10px] font-medium text-[#64748B] mb-1 uppercase tracking-[0.1em]">Ostatnia notatka</p>
            <p className="text-[#64748B] text-sm leading-relaxed">{ostatniaNota.tresc}</p>
          </div>
        )}

        {/* Panel notatki */}
        {notatkaMode && (
          <div className="bg-[#141921] border border-[#1A2535] rounded-lg p-3 mb-5">
            <p className="text-[10px] font-medium text-[#64748B] mb-2 uppercase tracking-[0.1em]">Notatka z rozmowy</p>
            <textarea
              value={notatkaVal}
              onChange={e => setNotatkaVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleZapiszRozmowe() }}
              placeholder="Co ustaliłeś..."
              className="input mb-2 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleZapiszRozmowe} className="btn-primary flex-1">Zapisz i następny →</button>
              <button onClick={resetPanels} className="btn-ghost">Anuluj</button>
            </div>
          </div>
        )}

        {/* Panel odłóż */}
        {odlozMode && (
          <div className="bg-[#141921] border border-[#1A2535] rounded-lg p-3 mb-5">
            <p className="text-[10px] font-medium text-[#64748B] mb-2 uppercase tracking-[0.1em]">Kiedy oddzwonić?</p>
            <input type="date" value={odlozData} min={today()} onChange={e => setOdlozData(e.target.value)} className="input mb-2" autoFocus />
            <div className="flex gap-2">
              <button onClick={handleOdloz} disabled={!odlozData} className="btn-primary flex-1">Odłóż i następny →</button>
              <button onClick={resetPanels} className="btn-ghost">Anuluj</button>
            </div>
          </div>
        )}

        {/* Panel zamknij ✗ */}
        {zamknijMode && (
          <div className="bg-[#141921] border border-[#EF4444]/20 rounded-lg p-3 mb-5">
            <p className="text-[10px] font-medium mb-3 uppercase tracking-[0.1em]" style={{ color: 'rgba(239,68,68,0.7)' }}>Zamknij — przegrana</p>
            <div className="mb-3">
              <label className="label">Powód odmowy <span className="text-[#EF4444]">*</span></label>
              <select
                value={zamknijPowod}
                onChange={e => { setZamknijPowod(e.target.value); setPowodError(false) }}
                className={`input text-sm ${powodError ? 'border-[#EF4444]' : ''}`}
                autoFocus
              >
                <option value="">Wybierz powód...</option>
                {Object.entries(POWOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {powodError && <p className="text-[#EF4444] text-[10px] mt-1">Wybierz powód odmowy</p>}
            </div>
            <div className="mb-3">
              <label className="label">Co powiedziała? <span className="text-[#64748B]">(opcjonalne)</span></label>
              <textarea
                value={zamknijSzczegol}
                onChange={e => setZamknijSzczegol(e.target.value)}
                placeholder='np. "Mam już kogoś kto robi mi strony za 500 zł..."'
                className="input resize-none text-xs"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleZamknij} className="btn-red flex-1">Zapisz i następny →</button>
              <button onClick={resetPanels} className="btn-ghost">Anuluj</button>
            </div>
          </div>
        )}

        {/* Przyciski główne */}
        {!anyPanelOpen && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleNieOdbiera} className="btn-ghost py-3">
              Nie odebrała
            </button>
            <button onClick={() => setNotatkaMode(true)} className="btn-blue py-3">
              Rozmawiałem
            </button>
            <button onClick={() => setOdlozMode(true)} className="btn-ghost py-3">
              Odłóż
            </button>
            <button
              onClick={() => setPominiete(p => [...p, kontakt.id])}
              className="btn-ghost py-3 opacity-60 hover:opacity-100"
            >
              Pomiń teraz
            </button>
            <button
              onClick={() => setZamknijMode(true)}
              className="btn-red col-span-2 py-2.5 text-xs opacity-70 hover:opacity-100"
            >
              Zamknij ✗ — przegrana
            </button>
          </div>
        )}

        {/* Skrypt pitcha */}
        <PitchPanel />
      </div>
    </div>
  )
}
