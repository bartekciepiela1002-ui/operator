import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import { useSprint } from '../context/SprintContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import ModalDodajKontakt from '../components/modals/ModalDodajKontakt'
import { pobierzKontakt, edytujKontakt, archiwizujKontakt, usunKontakt } from '../utils/storage'
import { today, formatDate, DOSTEPNE_AKCJE, POWOD_LABELS, ZRODLO_LABELS, PORA_LABELS } from '../utils/helpers'

export default function WidokKontakt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { odswierz } = useKontakty()
  const { inkrementuj } = useSprint()

  const [kontakt, setKontakt] = useState(null)
  const [nowaNotatka, setNowaNotatka] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [modalOdloz, setModalOdloz] = useState(false)
  const [modalZamknij, setModalZamknij] = useState({ open: false, typ: null })
  const [modalUsun, setModalUsun] = useState(false)
  const [dataOdloz, setDataOdloz] = useState('')
  const [powodOdmowy, setPowodOdmowy] = useState('')
  const [powodError, setPowodError] = useState(false)
  const [szczegolObjekcji, setSzczegolObjekcji] = useState('')
  const [nastepnyKrokEdit, setNastepnyKrokEdit] = useState(false)
  const [nastepnyKrokVal, setNastepnyKrokVal] = useState('')
  const [demoEdit, setDemoEdit] = useState(false)
  const [demoVal, setDemoVal] = useState({ typDemo: '', linkLubAdres: '' })

  const wczytaj = () => {
    const k = pobierzKontakt(id)
    if (!k) { navigate('/lista'); return }
    setKontakt(k)
  }

  useEffect(() => { wczytaj() }, [id])
  if (!kontakt) return null

  const aktualizuj = (dane) => { edytujKontakt(id, dane); odswierz(); wczytaj() }

  const akcjaNieOdbiera = () => {
    const nowy = kontakt.licznikTel + 1
    if (nowy >= 6 && kontakt.licznikOutreach >= 2) archiwizujKontakt(id)
    else aktualizuj({ tor: 'nie_odbiera', licznikTel: nowy, status: 'proby_kontaktu', dataOstatniegoKontaktu: today() })
    inkrementuj(); odswierz(); wczytaj()
  }
  const akcjaOutreach = () => {
    const nowy = kontakt.licznikOutreach + 1
    if (kontakt.licznikTel >= 6 && nowy >= 2) archiwizujKontakt(id)
    else aktualizuj({ tor: 'nie_odbiera', licznikOutreach: nowy, dataOstatniegoKontaktu: today() })
    inkrementuj(); odswierz(); wczytaj()
  }
  const akcjaRozmawial    = () => { inkrementuj(); aktualizuj({ tor: 'rozmawial', status: 'w_kontakcie', dataOstatniegoKontaktu: today() }) }
  const akcjaProsiOMaila  = () => { inkrementuj(); aktualizuj({ status: 'prosi_o_maila', dataOstatniegoKontaktu: today() }) }
  const akcjaMailWyslany  = () => { inkrementuj(); aktualizuj({ status: 'mail_wyslany', mailWyslany: true, dataMail: today(), dataOstatniegoKontaktu: today() }) }
  const akcjaDemoUmowione = () => { inkrementuj(); aktualizuj({ status: 'demo_umowione', dataOstatniegoKontaktu: today() }) }
  const akcjaPoDemo       = () => { inkrementuj(); aktualizuj({ status: 'po_demo', dataOstatniegoKontaktu: today() }) }

  const akcjaZamknij = () => {
    if (modalZamknij.typ === 'nie' && !powodOdmowy) { setPowodError(true); return }
    inkrementuj()
    const dane = {
      status: modalZamknij.typ === 'tak' ? 'zamkniete_tak' : 'zamkniete_nie',
      powodOdmowy: modalZamknij.typ === 'nie' ? powodOdmowy : null,
      dataOstatniegoKontaktu: today()
    }
    if (modalZamknij.typ === 'nie' && szczegolObjekcji.trim()) dane.szczegolObjekcji = szczegolObjekcji.trim()
    aktualizuj(dane)
    setModalZamknij({ open: false, typ: null }); setPowodOdmowy(''); setPowodError(false); setSzczegolObjekcji('')
  }
  const akcjaOdloz = () => {
    if (!dataOdloz) return
    inkrementuj()
    aktualizuj({ status: 'odlozone', dataPrzypomnienia: dataOdloz, dataOstatniegoKontaktu: today() })
    setModalOdloz(false); setDataOdloz('')
  }

  const dodajNotatke = () => {
    if (!nowaNotatka.trim()) return
    aktualizuj({ notatki: [{ id: crypto.randomUUID(), tresc: nowaNotatka.trim(), dataWpisu: new Date().toISOString() }, ...(kontakt.notatki || [])] })
    setNowaNotatka('')
  }

  const AKCJA_BTN = {
    nie_odbiera:    <button onClick={akcjaNieOdbiera}    className="btn-yellow">Nie odebrała ({kontakt.licznikTel}/6)</button>,
    outreach:       <button onClick={akcjaOutreach}       className="btn-yellow">+1 outreach ({kontakt.licznikOutreach}/2)</button>,
    rozmawial:      <button onClick={akcjaRozmawial}      className="btn-blue">Rozmawiałem</button>,
    prosi_o_maila:  <button onClick={akcjaProsiOMaila}    className="btn-purple">Prosi o maila</button>,
    mail_wyslany:   <button onClick={akcjaMailWyslany}    className="btn-indigo">Mail wysłany</button>,
    demo_umowione:  <button onClick={akcjaDemoUmowione}   className="btn-orange">Umówiłem demo</button>,
    po_demo:        <button onClick={akcjaPoDemo}          className="btn-amber">Po demo</button>,
    zamkniete_tak:  <button onClick={() => setModalZamknij({ open: true, typ: 'tak' })} className="btn-green">Zamknięte — wygrana</button>,
    zamkniete_nie:  <button onClick={() => setModalZamknij({ open: true, typ: 'nie' })} className="btn-red">Zamknięte — przegrana</button>,
    odlozone:       <button onClick={() => setModalOdloz(true)} className="btn-stone">Odłóż</button>
  }

  const dostepneAkcje = DOSTEPNE_AKCJE[kontakt.status] || []

  const Row = ({ label, val }) => val ? (
    <div className="flex gap-2 text-xs">
      <span className="text-[#64748B] w-32 shrink-0">{label}</span>
      <span className="text-[#64748B]">{val}</span>
    </div>
  ) : null

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-xs text-[#64748B] hover:text-[#22D4F0] mb-4 block transition-colors">
        ← Wróć
      </button>

      {/* Nagłówek */}
      <div className="card p-5 mb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-semibold text-[#E2E8F0] text-lg">{kontakt.nazwaSlonu}</h1>
            {kontakt.imie && <p className="text-[#64748B] text-sm mt-0.5">{kontakt.imie}</p>}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <StatusBadge status={kontakt.status} />
              {kontakt.tor === 'nie_odbiera' && (
                <span className="font-mono text-[10px] bg-[#141921] text-[#64748B] border border-[#1A2535] rounded px-2 py-0.5">
                  {kontakt.licznikTel}/6 tel · {kontakt.licznikOutreach}/2 out
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setEditMode(true)} className="btn-ghost text-xs">Edytuj</button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
          <div className="flex gap-2 text-xs">
            <span className="text-[#64748B] w-20 shrink-0">Telefon</span>
            <a href={`tel:${kontakt.telefon}`} className="font-mono text-[#22D4F0] hover:brightness-110 transition-all">{kontakt.telefon}</a>
          </div>
          <Row label="Miasto" val={kontakt.miasto} />
          {kontakt.www && (
            <div className="flex gap-2 text-xs col-span-2">
              <span className="text-[#64748B] w-20 shrink-0">WWW</span>
              <a href={kontakt.www.startsWith('http') ? kontakt.www : `https://${kontakt.www}`} target="_blank" rel="noreferrer" className="text-[#22D4F0] hover:brightness-110 truncate">{kontakt.www}</a>
            </div>
          )}
          <Row label="Ostatni kontakt" val={formatDate(kontakt.dataOstatniegoKontaktu)} />
        </div>
      </div>

      {/* Akcje */}
      {dostepneAkcje.length > 0 && (
        <div className="card p-4 mb-3">
          <p className="section-label mb-3">Akcje</p>
          <div className="flex flex-wrap gap-2">
            {dostepneAkcje.map(a => <span key={a}>{AKCJA_BTN[a]}</span>)}
          </div>
        </div>
      )}

      {/* Następny krok */}
      <div className="card p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="section-label">Następny krok</p>
          {!nastepnyKrokEdit && (
            <button onClick={() => { setNastepnyKrokVal(kontakt.nastepnyKrok || ''); setNastepnyKrokEdit(true) }} className="text-[10px] text-[#64748B] hover:text-[#22D4F0] transition-colors">
              Edytuj
            </button>
          )}
        </div>
        {nastepnyKrokEdit ? (
          <div className="space-y-2">
            <input type="text" value={nastepnyKrokVal} onChange={e => setNastepnyKrokVal(e.target.value)} className="input" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => { aktualizuj({ nastepnyKrok: nastepnyKrokVal }); setNastepnyKrokEdit(false) }} className="btn-primary text-xs px-3 py-1">Zapisz</button>
              <button onClick={() => setNastepnyKrokEdit(false)} className="btn-ghost text-xs px-3 py-1">Anuluj</button>
            </div>
          </div>
        ) : (
          <p className={`text-xs ${kontakt.nastepnyKrok ? 'text-[#64748B]' : 'text-[#64748B]'}`}>
            {kontakt.nastepnyKrok || 'Brak — kliknij Edytuj'}
          </p>
        )}
        {kontakt.dataPrzypomnienia && (
          <p className="font-mono text-[10px] text-[#22D4F0] mt-2">🔔 Przypomnienie: {formatDate(kontakt.dataPrzypomnienia)}</p>
        )}
      </div>

      {/* Demo */}
      {['demo_umowione', 'po_demo'].includes(kontakt.status) && (
        <div className="card p-4 mb-3" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="section-label" style={{ color: 'rgba(16,185,129,0.7)' }}>Demo</p>
            {!demoEdit && (
              <button onClick={() => { setDemoVal({ typDemo: kontakt.typDemo || '', linkLubAdres: kontakt.linkLubAdres || '' }); setDemoEdit(true) }} className="text-[10px] text-[#64748B] hover:text-[#22D4F0] transition-colors">
                Edytuj
              </button>
            )}
          </div>
          {demoEdit ? (
            <div className="space-y-2">
              <select value={demoVal.typDemo} onChange={e => setDemoVal(v => ({ ...v, typDemo: e.target.value }))} className="input text-xs">
                <option value="">Wybierz typ...</option>
                <option value="online">Online</option>
                <option value="spotkanie">Spotkanie</option>
              </select>
              <input type="text" value={demoVal.linkLubAdres} onChange={e => setDemoVal(v => ({ ...v, linkLubAdres: e.target.value }))} placeholder="Link / adres" className="input text-xs" />
              <div className="flex gap-2">
                <button onClick={() => { aktualizuj({ typDemo: demoVal.typDemo || null, linkLubAdres: demoVal.linkLubAdres }); setDemoEdit(false) }} className="btn-green text-xs px-3 py-1">Zapisz</button>
                <button onClick={() => setDemoEdit(false)} className="btn-ghost text-xs px-3 py-1">Anuluj</button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-xs">
              <div className="flex gap-2"><span className="text-[#64748B]">Typ:</span><span className="text-[#64748B]">{kontakt.typDemo === 'online' ? 'Online' : kontakt.typDemo === 'spotkanie' ? 'Spotkanie' : '—'}</span></div>
              {kontakt.linkLubAdres && <div className="flex gap-2"><span className="text-[#64748B]">Link/adres:</span><span className="text-[#64748B] break-all">{kontakt.linkLubAdres}</span></div>}
            </div>
          )}
        </div>
      )}

      {/* Zamknięcie */}
      {kontakt.status === 'zamkniete_nie' && (
        <div className="card p-4 mb-3" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <p className="section-label mb-3" style={{ color: 'rgba(239,68,68,0.7)' }}>Zamknięcie</p>
          <div className="mb-3">
            <p className="text-[10px] text-[#64748B] uppercase tracking-[0.1em] mb-1">Powód odmowy</p>
            <p className="text-[#64748B] text-sm">{POWOD_LABELS[kontakt.powodOdmowy] || '—'}</p>
          </div>
          <div>
            <label className="label">Szczegół objekcji</label>
            <textarea
              defaultValue={kontakt.szczegolObjekcji || ''}
              onBlur={e => { if (e.target.value !== (kontakt.szczegolObjekcji || '')) aktualizuj({ szczegolObjekcji: e.target.value }) }}
              placeholder='np. "Mam już kogoś kto robi mi strony za 500 zł..."'
              className="input resize-none text-xs"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Notatki */}
      <div className="card p-4 mb-3">
        <p className="section-label mb-3">Notatki</p>
        <div className="flex gap-2 mb-4">
          <textarea
            value={nowaNotatka}
            onChange={e => setNowaNotatka(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) dodajNotatke() }}
            placeholder="Dodaj notatkę... (Ctrl+Enter)"
            className="input flex-1 resize-none text-xs"
            rows={2}
          />
          <button onClick={dodajNotatke} className="btn-primary self-end">Dodaj</button>
        </div>
        {(!kontakt.notatki || kontakt.notatki.length === 0) ? (
          <p className="text-[#64748B] text-xs">Brak notatek</p>
        ) : (
          <div className="flex flex-col gap-3">
            {kontakt.notatki.map(n => (
              <div key={n.id} className="pl-3 py-0.5" style={{ borderLeft: '2px solid rgba(34,212,240,0.2)' }}>
                <p className="text-xs text-[#64748B] whitespace-pre-wrap">{n.tresc}</p>
                <p className="font-mono text-[10px] text-[#64748B] mt-1">{new Date(n.dataWpisu).toLocaleString('pl-PL')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="card p-4 mb-3">
        <p className="section-label mb-3">Szczegóły</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <Row label="Źródło" val={ZRODLO_LABELS[kontakt.zrodlo] || kontakt.zrodlo} />
          <Row label="Pora dnia" val={PORA_LABELS[kontakt.poraDnia]} />
          <Row label="Wartość" val={kontakt.wartoscKontraktu ? `${kontakt.wartoscKontraktu.toLocaleString('pl-PL')} PLN` : null} />
          <Row label="Dodano" val={formatDate(kontakt.dataUtworzenia)} />
          {kontakt.mailWyslany && <Row label="Mail" val={formatDate(kontakt.dataMail)} />}
        </div>
      </div>

      {/* Usuń */}
      <div className="border-t border-[#1A2535] pt-4 mb-6">
        <button onClick={() => setModalUsun(true)} className="text-[10px] text-[#64748B] hover:text-[#EF4444] transition-colors">
          Usuń kontakt na stałe
        </button>
      </div>

      {/* Modals */}
      {modalOdloz && (
        <Modal title="Odłóż kontakt" onClose={() => setModalOdloz(false)}>
          <label className="label">Data przypomnienia</label>
          <input type="date" value={dataOdloz} min={today()} onChange={e => setDataOdloz(e.target.value)} className="input" />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalOdloz(false)} className="btn-ghost">Anuluj</button>
            <button onClick={akcjaOdloz} disabled={!dataOdloz} className="btn-primary">Odłóż</button>
          </div>
        </Modal>
      )}

      {modalZamknij.open && (
        <Modal
          title={modalZamknij.typ === 'tak' ? 'Zamknij — wygrana' : 'Zamknij — przegrana'}
          onClose={() => { setModalZamknij({ open: false, typ: null }); setPowodOdmowy(''); setPowodError(false) }}
        >
          {modalZamknij.typ === 'tak' ? (
            <p className="text-[#64748B] text-sm mb-4">Potwierdzasz zamknięcie kontraktu jako wygranego?</p>
          ) : (
            <div className="space-y-3 mb-4">
              <div>
                <label className="label">Powód odmowy <span className="text-[#EF4444]">*</span></label>
                <select value={powodOdmowy} onChange={e => { setPowodOdmowy(e.target.value); setPowodError(false) }} className={`input ${powodError ? 'border-[#EF4444]' : ''}`}>
                  <option value="">Wybierz powód...</option>
                  {Object.entries(POWOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {powodError && <p className="text-[#EF4444] text-[10px] mt-1">Wybierz powód odmowy</p>}
              </div>
              <div>
                <label className="label">Co powiedziała? <span className="text-[#64748B]">(opcjonalne)</span></label>
                <textarea
                  value={szczegolObjekcji}
                  onChange={e => setSzczegolObjekcji(e.target.value)}
                  placeholder='np. "Mam już kogoś kto robi mi strony za 500 zł..."'
                  className="input resize-none text-xs"
                  rows={2}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setModalZamknij({ open: false, typ: null }); setPowodOdmowy(''); setPowodError(false) }} className="btn-ghost">Anuluj</button>
            <button onClick={akcjaZamknij} className={modalZamknij.typ === 'tak' ? 'btn-green' : 'btn-red'}>Potwierdź</button>
          </div>
        </Modal>
      )}

      {modalUsun && (
        <Modal title="Usuń kontakt" onClose={() => setModalUsun(false)}>
          <p className="text-[#64748B] text-sm mb-1">Usunąć <strong className="text-[#E2E8F0]">{kontakt.nazwaSlonu}</strong> na stałe?</p>
          <p className="text-[#EF4444] text-xs mb-4">Tej operacji nie można cofnąć.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalUsun(false)} className="btn-ghost">Anuluj</button>
            <button onClick={() => { usunKontakt(id); odswierz(); navigate('/lista') }} className="btn-red">Usuń na stałe</button>
          </div>
        </Modal>
      )}

      {editMode && (
        <ModalDodajKontakt kontaktPoczatkowy={kontakt} onClose={() => { setEditMode(false); wczytaj() }} />
      )}
    </div>
  )
}
