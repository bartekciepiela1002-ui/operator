import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import ModalDodajKontakt from '../components/modals/ModalDodajKontakt'
import { pobierzKontakt, edytujKontakt, archiwizujKontakt } from '../utils/storage'
import {
  today, formatDate, DOSTEPNE_AKCJE, POWOD_LABELS, ZRODLO_LABELS, PORA_LABELS
} from '../utils/helpers'

export default function WidokKontakt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { odswierz } = useKontakty()

  const [kontakt, setKontakt] = useState(null)
  const [nowaNotatka, setNowaNotatka] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [modalOdloz, setModalOdloz] = useState(false)
  const [modalZamknij, setModalZamknij] = useState({ open: false, typ: null })
  const [dataOdloz, setDataOdloz] = useState('')
  const [powodOdmowy, setPowodOdmowy] = useState('')
  const [powodError, setPowodError] = useState(false)
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

  const aktualizuj = (dane) => {
    edytujKontakt(id, dane)
    odswierz()
    wczytaj()
  }

  // === Akcje ===

  const akcjaNieOdbiera = () => {
    const nowyLicznik = kontakt.licznikTel + 1
    if (nowyLicznik >= 6 && kontakt.licznikOutreach >= 2) {
      archiwizujKontakt(id)
    } else {
      aktualizuj({
        tor: 'nie_odbiera',
        licznikTel: nowyLicznik,
        status: 'proby_kontaktu',
        dataOstatniegoKontaktu: today()
      })
    }
    odswierz()
    wczytaj()
  }

  const akcjaOutreach = () => {
    const nowyLicznik = kontakt.licznikOutreach + 1
    if (kontakt.licznikTel >= 6 && nowyLicznik >= 2) {
      archiwizujKontakt(id)
    } else {
      aktualizuj({
        tor: 'nie_odbiera',
        licznikOutreach: nowyLicznik,
        dataOstatniegoKontaktu: today()
      })
    }
    odswierz()
    wczytaj()
  }

  const akcjaRozmawial = () => aktualizuj({
    tor: 'rozmawial',
    status: 'w_kontakcie',
    dataOstatniegoKontaktu: today()
  })

  const akcjaProsiOMaila = () => aktualizuj({
    status: 'prosi_o_maila',
    dataOstatniegoKontaktu: today()
  })

  const akcjaMailWyslany = () => aktualizuj({
    status: 'mail_wyslany',
    mailWyslany: true,
    dataMail: today(),
    dataOstatniegoKontaktu: today()
  })

  const akcjaDemoUmowione = () => aktualizuj({
    status: 'demo_umowione',
    dataOstatniegoKontaktu: today()
  })

  const akcjaPoDemo = () => aktualizuj({
    status: 'po_demo',
    dataOstatniegoKontaktu: today()
  })

  const akcjaZamknij = () => {
    if (modalZamknij.typ === 'nie' && !powodOdmowy) {
      setPowodError(true)
      return
    }
    aktualizuj({
      status: modalZamknij.typ === 'tak' ? 'zamkniete_tak' : 'zamkniete_nie',
      powodOdmowy: modalZamknij.typ === 'nie' ? powodOdmowy : null,
      dataOstatniegoKontaktu: today()
    })
    setModalZamknij({ open: false, typ: null })
    setPowodOdmowy('')
    setPowodError(false)
  }

  const akcjaOdloz = () => {
    if (!dataOdloz) return
    aktualizuj({
      status: 'odlozone',
      dataPrzypomnienia: dataOdloz,
      dataOstatniegoKontaktu: today()
    })
    setModalOdloz(false)
    setDataOdloz('')
  }

  const dodajNotatke = () => {
    if (!nowaNotatka.trim()) return
    const nota = {
      id: crypto.randomUUID(),
      tresc: nowaNotatka.trim(),
      dataWpisu: new Date().toISOString()
    }
    aktualizuj({ notatki: [nota, ...(kontakt.notatki || [])] })
    setNowaNotatka('')
  }

  const zapiszNastepnyKrok = () => {
    aktualizuj({ nastepnyKrok: nastepnyKrokVal })
    setNastepnyKrokEdit(false)
  }

  const zapiszDemo = () => {
    aktualizuj({
      typDemo: demoVal.typDemo || null,
      linkLubAdres: demoVal.linkLubAdres
    })
    setDemoEdit(false)
  }

  // === Mapa akcji → przyciski ===
  const AKCJA_BTN = {
    nie_odbiera: (
      <button onClick={akcjaNieOdbiera} className="btn-yellow">
        Nie odebrała ({kontakt.licznikTel}/6)
      </button>
    ),
    outreach: (
      <button onClick={akcjaOutreach} className="btn-yellow">
        +1 outreach ({kontakt.licznikOutreach}/2)
      </button>
    ),
    rozmawial: (
      <button onClick={akcjaRozmawial} className="btn-blue">
        Rozmawiałem
      </button>
    ),
    prosi_o_maila: (
      <button onClick={akcjaProsiOMaila} className="btn-purple">
        Prosi o maila
      </button>
    ),
    mail_wyslany: (
      <button onClick={akcjaMailWyslany} className="btn-indigo">
        Mail wysłany
      </button>
    ),
    demo_umowione: (
      <button onClick={akcjaDemoUmowione} className="btn-orange">
        Umówiłem demo
      </button>
    ),
    po_demo: (
      <button onClick={akcjaPoDemo} className="btn-amber">
        Po demo
      </button>
    ),
    zamkniete_tak: (
      <button onClick={() => setModalZamknij({ open: true, typ: 'tak' })} className="btn-green">
        Zamknięte — wygrany
      </button>
    ),
    zamkniete_nie: (
      <button onClick={() => setModalZamknij({ open: true, typ: 'nie' })} className="btn-red">
        Zamknięte — przegrany
      </button>
    ),
    odlozone: (
      <button onClick={() => setModalOdloz(true)} className="btn-stone">
        Odłóż
      </button>
    )
  }

  const dostepneAkcje = DOSTEPNE_AKCJE[kontakt.status] || []

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-400 hover:text-indigo-600 mb-4 block transition-colors"
      >
        ← Wróć
      </button>

      {/* Nagłówek */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{kontakt.nazwaSlonu}</h1>
            {kontakt.imie && <p className="text-gray-500 mt-0.5 text-base">{kontakt.imie}</p>}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <StatusBadge status={kontakt.status} />
              {kontakt.tor === 'nie_odbiera' && (
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                  tel: {kontakt.licznikTel}/6 · outreach: {kontakt.licznikOutreach}/2
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="btn-ghost text-xs"
          >
            Edytuj dane
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-400 shrink-0">Telefon:</span>
            <a href={`tel:${kontakt.telefon}`} className="text-indigo-600 hover:underline font-mono">
              {kontakt.telefon}
            </a>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 shrink-0">Miasto:</span>
            <span className="text-gray-700">{kontakt.miasto || '—'}</span>
          </div>
          {kontakt.www && (
            <div className="flex gap-2 col-span-2">
              <span className="text-gray-400 shrink-0">WWW:</span>
              <a href={kontakt.www.startsWith('http') ? kontakt.www : `https://${kontakt.www}`}
                target="_blank" rel="noreferrer"
                className="text-indigo-600 hover:underline truncate">
                {kontakt.www}
              </a>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-gray-400 shrink-0">Ostatni kontakt:</span>
            <span className="text-gray-700">{formatDate(kontakt.dataOstatniegoKontaktu)}</span>
          </div>
        </div>
      </div>

      {/* Akcje */}
      {dostepneAkcje.length > 0 && (
        <div className="card p-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Akcje</h2>
          <div className="flex flex-wrap gap-2">
            {dostepneAkcje.map(a => (
              <span key={a}>{AKCJA_BTN[a]}</span>
            ))}
          </div>
        </div>
      )}

      {/* Następny krok */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Następny krok</h2>
          {!nastepnyKrokEdit && (
            <button
              onClick={() => { setNastepnyKrokVal(kontakt.nastepnyKrok || ''); setNastepnyKrokEdit(true) }}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              Edytuj
            </button>
          )}
        </div>
        {nastepnyKrokEdit ? (
          <div className="space-y-2">
            <input
              type="text"
              value={nastepnyKrokVal}
              onChange={e => setNastepnyKrokVal(e.target.value)}
              placeholder="Co zrobić następnie..."
              className="input"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={zapiszNastepnyKrok} className="btn-primary btn text-xs px-3 py-1">Zapisz</button>
              <button onClick={() => setNastepnyKrokEdit(false)} className="btn-ghost btn text-xs px-3 py-1">Anuluj</button>
            </div>
          </div>
        ) : (
          <p className={`text-sm ${kontakt.nastepnyKrok ? 'text-gray-700' : 'text-gray-400'}`}>
            {kontakt.nastepnyKrok || 'Brak — kliknij Edytuj aby dodać'}
          </p>
        )}
        {kontakt.dataPrzypomnienia && (
          <p className="text-xs text-indigo-500 mt-2">
            Przypomnienie: {formatDate(kontakt.dataPrzypomnienia)}
          </p>
        )}
      </div>

      {/* Sekcja Demo */}
      {['demo_umowione', 'po_demo'].includes(kontakt.status) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Demo</h2>
            {!demoEdit && (
              <button
                onClick={() => {
                  setDemoVal({ typDemo: kontakt.typDemo || '', linkLubAdres: kontakt.linkLubAdres || '' })
                  setDemoEdit(true)
                }}
                className="text-xs text-orange-500 hover:text-orange-700"
              >
                Edytuj
              </button>
            )}
          </div>
          {demoEdit ? (
            <div className="space-y-3">
              <div>
                <label className="label text-orange-700">Typ demo *</label>
                <select
                  value={demoVal.typDemo}
                  onChange={e => setDemoVal(v => ({ ...v, typDemo: e.target.value }))}
                  className="input"
                >
                  <option value="">Wybierz...</option>
                  <option value="online">Online</option>
                  <option value="spotkanie">Spotkanie</option>
                </select>
              </div>
              <div>
                <label className="label text-orange-700">Link / adres</label>
                <input
                  type="text"
                  value={demoVal.linkLubAdres}
                  onChange={e => setDemoVal(v => ({ ...v, linkLubAdres: e.target.value }))}
                  placeholder="https://... lub adres fizyczny"
                  className="input"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={zapiszDemo} className="btn-orange btn text-xs px-3 py-1">Zapisz</button>
                <button onClick={() => setDemoEdit(false)} className="btn-ghost btn text-xs px-3 py-1">Anuluj</button>
              </div>
            </div>
          ) : (
            <div className="text-sm space-y-1">
              <div className="flex gap-2">
                <span className="text-orange-500">Typ:</span>
                <span className="text-gray-700">
                  {kontakt.typDemo === 'online' ? 'Online' : kontakt.typDemo === 'spotkanie' ? 'Spotkanie' : '—'}
                </span>
              </div>
              {kontakt.linkLubAdres && (
                <div className="flex gap-2">
                  <span className="text-orange-500">Link/adres:</span>
                  <span className="text-gray-700 break-all">{kontakt.linkLubAdres}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sekcja Zamknięcie */}
      {kontakt.status === 'zamkniete_nie' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Powód odmowy</h2>
          <p className="text-sm text-gray-700">{POWOD_LABELS[kontakt.powodOdmowy] || '—'}</p>
        </div>
      )}

      {/* Notatki */}
      <div className="card p-4 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notatki</h2>
        <div className="flex gap-2 mb-4">
          <textarea
            value={nowaNotatka}
            onChange={e => setNowaNotatka(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) dodajNotatke() }}
            placeholder="Dodaj notatkę... (Ctrl+Enter aby zapisać)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            rows={2}
          />
          <button onClick={dodajNotatke} className="btn-primary self-end">
            Dodaj
          </button>
        </div>
        {(!kontakt.notatki || kontakt.notatki.length === 0) ? (
          <p className="text-gray-400 text-sm">Brak notatek</p>
        ) : (
          <div className="flex flex-col gap-3">
            {kontakt.notatki.map(n => (
              <div key={n.id} className="border-l-2 border-indigo-200 pl-3 py-0.5">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.tresc}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.dataWpisu).toLocaleString('pl-PL')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="card p-4 mb-6 text-sm">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Szczegóły</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-gray-600">
          <div className="flex gap-2">
            <span className="text-gray-400">Źródło:</span>
            <span>{ZRODLO_LABELS[kontakt.zrodlo] || kontakt.zrodlo || '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400">Pora dnia:</span>
            <span>{PORA_LABELS[kontakt.poraDnia] || '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400">Wartość:</span>
            <span>{kontakt.wartoscKontraktu ? `${kontakt.wartoscKontraktu.toLocaleString('pl-PL')} PLN` : '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400">Dodano:</span>
            <span>{formatDate(kontakt.dataUtworzenia)}</span>
          </div>
          {kontakt.mailWyslany && (
            <div className="flex gap-2">
              <span className="text-gray-400">Mail:</span>
              <span>{formatDate(kontakt.dataMail)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Odłóż */}
      {modalOdloz && (
        <Modal title="Odłóż kontakt" onClose={() => setModalOdloz(false)}>
          <label className="label">Data przypomnienia</label>
          <input
            type="date"
            value={dataOdloz}
            min={today()}
            onChange={e => setDataOdloz(e.target.value)}
            className="input"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalOdloz(false)} className="btn-ghost">Anuluj</button>
            <button onClick={akcjaOdloz} disabled={!dataOdloz} className="btn-primary">
              Odłóż
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Zamknij */}
      {modalZamknij.open && (
        <Modal
          title={modalZamknij.typ === 'tak' ? 'Zamknij jako wygrany' : 'Zamknij jako przegrany'}
          onClose={() => { setModalZamknij({ open: false, typ: null }); setPowodOdmowy(''); setPowodError(false) }}
        >
          {modalZamknij.typ === 'tak' ? (
            <p className="text-gray-600 text-sm mb-4">
              Potwierdzasz zamknięcie kontraktu jako wygranego?
            </p>
          ) : (
            <div className="mb-4">
              <label className="label">
                Powód odmowy <span className="text-red-500">*</span>
              </label>
              <select
                value={powodOdmowy}
                onChange={e => { setPowodOdmowy(e.target.value); setPowodError(false) }}
                className={`input ${powodError ? 'border-red-400 focus:ring-red-300' : ''}`}
              >
                <option value="">Wybierz powód...</option>
                {Object.entries(POWOD_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {powodError && <p className="text-red-500 text-xs mt-1">Wybierz powód odmowy</p>}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setModalZamknij({ open: false, typ: null }); setPowodOdmowy(''); setPowodError(false) }}
              className="btn-ghost"
            >
              Anuluj
            </button>
            <button
              onClick={akcjaZamknij}
              className={modalZamknij.typ === 'tak' ? 'btn-green' : 'btn-red'}
            >
              Potwierdź
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Edytuj */}
      {editMode && (
        <ModalDodajKontakt
          kontaktPoczatkowy={kontakt}
          onClose={() => { setEditMode(false); wczytaj() }}
        />
      )}
    </div>
  )
}
