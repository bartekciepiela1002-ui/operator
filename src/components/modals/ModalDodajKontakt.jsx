import { useState } from 'react'
import Modal from '../Modal'
import { dodajKontakt, edytujKontakt } from '../../utils/storage'
import { useKontakty } from '../../context/KontaktyContext'
import { ZRODLO_LABELS, PORA_LABELS } from '../../utils/helpers'

const PUSTE = {
  nazwaSlonu: '',
  imie: '',
  telefon: '',
  miasto: '',
  www: '',
  zrodlo: 'google_maps',
  poraDnia: '',
  wartoscKontraktu: ''
}

export default function ModalDodajKontakt({ onClose, kontaktPoczatkowy }) {
  const { odswierz } = useKontakty()
  const edycja = Boolean(kontaktPoczatkowy)

  const [dane, setDane] = useState(
    edycja
      ? {
          nazwaSlonu: kontaktPoczatkowy.nazwaSlonu || '',
          imie: kontaktPoczatkowy.imie || '',
          telefon: kontaktPoczatkowy.telefon || '',
          miasto: kontaktPoczatkowy.miasto || '',
          www: kontaktPoczatkowy.www || '',
          zrodlo: kontaktPoczatkowy.zrodlo || 'google_maps',
          poraDnia: kontaktPoczatkowy.poraDnia || '',
          wartoscKontraktu: kontaktPoczatkowy.wartoscKontraktu || ''
        }
      : { ...PUSTE }
  )
  const [bledy, setBledy] = useState({})

  const set = (pole, val) => {
    setDane(d => ({ ...d, [pole]: val }))
    setBledy(b => ({ ...b, [pole]: false }))
  }

  const waliduj = () => {
    const b = {}
    if (!dane.nazwaSlonu.trim()) b.nazwaSlonu = 'Pole wymagane'
    if (!dane.telefon.trim()) b.telefon = 'Pole wymagane'
    setBledy(b)
    return Object.keys(b).length === 0
  }

  const zapisz = () => {
    if (!waliduj()) return
    const payload = {
      ...dane,
      wartoscKontraktu: dane.wartoscKontraktu ? Number(dane.wartoscKontraktu) : null,
      poraDnia: dane.poraDnia || null
    }
    if (edycja) {
      edytujKontakt(kontaktPoczatkowy.id, payload)
    } else {
      dodajKontakt(payload)
    }
    odswierz()
    onClose()
  }

  const pole = (label, id, type = 'text', required = false) => (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={dane[id]}
        onChange={e => set(id, e.target.value)}
        className={`input ${bledy[id] ? 'border-red-400 focus:ring-red-300' : ''}`}
      />
      {bledy[id] && <p className="text-red-500 text-xs mt-1">{bledy[id]}</p>}
    </div>
  )

  return (
    <Modal
      title={edycja ? 'Edytuj kontakt' : 'Dodaj kontakt'}
      onClose={onClose}
      size="lg"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          {pole('Nazwa salonu', 'nazwaSlonu', 'text', true)}
        </div>
        {pole('Imię właścicielki', 'imie')}
        {pole('Telefon', 'telefon', 'tel', true)}
        {pole('Miasto', 'miasto')}
        {pole('Strona WWW', 'www', 'url')}

        <div>
          <label className="label">Źródło</label>
          <select
            value={dane.zrodlo}
            onChange={e => set('zrodlo', e.target.value)}
            className="input"
          >
            {Object.entries(ZRODLO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Pora dnia kontaktu</label>
          <select
            value={dane.poraDnia}
            onChange={e => set('poraDnia', e.target.value)}
            className="input"
          >
            <option value="">Brak preferencji</option>
            {Object.entries(PORA_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          {pole('Wartość kontraktu (PLN)', 'wartoscKontraktu', 'number')}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
        <button onClick={onClose} className="btn-ghost">Anuluj</button>
        <button onClick={zapisz} className="btn-primary">
          {edycja ? 'Zapisz zmiany' : 'Dodaj kontakt'}
        </button>
      </div>
    </Modal>
  )
}
