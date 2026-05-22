import { useState, useRef } from 'react'
import Modal from '../Modal'
import { wczytajKontakty, zapiszKontakty } from '../../utils/storage'
import { useKontakty } from '../../context/KontaktyContext'
import { today } from '../../utils/helpers'

const POLA_CRM = [
  { id: 'nazwaSlonu', label: 'Nazwa salonu', required: true },
  { id: 'telefon', label: 'Telefon', required: true },
  { id: 'imie', label: 'Imię' },
  { id: 'miasto', label: 'Miasto' },
  { id: 'www', label: 'WWW' }
]

const DOMYSLNE_MAPOWANIE = {
  name: 'nazwaSlonu',
  phone: 'telefon',
  address: 'miasto',
  site: 'www',
  title: 'nazwaSlonu'
}

function parseCSVRow(line) {
  const result = []
  let inQuotes = false
  let current = ''
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if ((ch === ',' || ch === ';') && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCSVRow(lines[0])
  const rows = lines.slice(1).map(parseCSVRow)
  return { headers, rows }
}

export default function ModalImportCSV({ onClose }) {
  const { odswierz } = useKontakty()
  const [krok, setKrok] = useState(1)
  const [csvData, setCsvData] = useState(null)
  const [mapowanie, setMapowanie] = useState({})
  const [wynik, setWynik] = useState(null)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef()

  const wczytajPlik = (plik) => {
    if (!plik || !plik.name.endsWith('.csv')) {
      alert('Wybierz plik .csv')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target.result)
      if (!headers.length) { alert('Nie można odczytać pliku CSV'); return }
      setCsvData({ headers, rows })
      const autoMapowanie = {}
      headers.forEach(h => {
        const normalized = h.toLowerCase().trim()
        if (DOMYSLNE_MAPOWANIE[normalized]) {
          autoMapowanie[DOMYSLNE_MAPOWANIE[normalized]] = h
        }
      })
      setMapowanie(autoMapowanie)
      setKrok(2)
    }
    reader.readAsText(plik, 'UTF-8')
  }

  const podglad = csvData?.rows.slice(0, 5).map(row => {
    const obj = {}
    POLA_CRM.forEach(({ id }) => {
      const csvCol = mapowanie[id]
      const colIdx = csvData.headers.indexOf(csvCol)
      obj[id] = colIdx >= 0 ? (row[colIdx] || '') : ''
    })
    return obj
  }) || []

  const importuj = () => {
    const istniejace = new Set(
      wczytajKontakty().map(k => k.telefon?.replace(/\s+/g, ''))
    )

    let dodane = 0
    let pominiete = 0
    const nowe = []

    csvData.rows.forEach(row => {
      const obj = {}
      POLA_CRM.forEach(({ id }) => {
        const csvCol = mapowanie[id]
        const colIdx = csvData.headers.indexOf(csvCol)
        obj[id] = colIdx >= 0 ? (row[colIdx] || '').trim() : ''
      })

      if (!obj.telefon && !obj.nazwaSlonu) { pominiete++; return }

      const telNorm = obj.telefon?.replace(/\s+/g, '')
      if (telNorm && istniejace.has(telNorm)) { pominiete++; return }

      nowe.push({
        id: crypto.randomUUID(),
        nazwaSlonu: obj.nazwaSlonu || '',
        imie: obj.imie || '',
        telefon: obj.telefon || '',
        miasto: obj.miasto || '',
        www: obj.www || '',
        zrodlo: 'google_maps',
        status: 'do_zadzwonienia',
        tor: null,
        licznikTel: 0,
        licznikOutreach: 0,
        dataOstatniegoKontaktu: null,
        nastepnyKrok: '',
        dataPrzypomnienia: null,
        mailWyslany: false,
        dataMail: null,
        typDemo: null,
        linkLubAdres: '',
        wartoscKontraktu: null,
        powodOdmowy: null,
        poraDnia: null,
        dataArchiwizacji: null,
        dataNurturingu: null,
        notatki: [],
        dataUtworzenia: today()
      })

      if (telNorm) istniejace.add(telNorm)
      dodane++
    })

    const aktualne = wczytajKontakty()
    zapiszKontakty([...nowe, ...aktualne])
    odswierz()
    setWynik({ dodane, pominiete })
    setKrok(4)
  }

  return (
    <Modal title="Importuj CSV" onClose={onClose} size="xl">
      {/* Kroki */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              krok >= n ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>{n}</div>
            {n < 4 && <div className={`h-px w-8 ${krok > n ? 'bg-indigo-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-2">
          {['', 'Wgraj plik', 'Mapowanie kolumn', 'Podgląd', 'Gotowe'][krok]}
        </span>
      </div>

      {/* Krok 1 — Upload */}
      {krok === 1 && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            drag ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); wczytajPlik(e.dataTransfer.files[0]) }}
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-600 mb-2">Przeciągnij plik CSV tutaj</p>
          <p className="text-gray-400 text-sm mb-4">lub</p>
          <button onClick={() => inputRef.current.click()} className="btn-primary">
            Wybierz plik
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => wczytajPlik(e.target.files[0])}
          />
          <p className="text-xs text-gray-400 mt-4">
            Obsługiwane: eksport z Outscrapera, dowolny CSV z nagłówkami
          </p>
        </div>
      )}

      {/* Krok 2 — Mapowanie */}
      {krok === 2 && csvData && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Znaleziono {csvData.headers.length} kolumn i {csvData.rows.length} wierszy.
            Przypisz kolumny CSV do pól CRM:
          </p>
          <div className="space-y-3">
            {POLA_CRM.map(({ id, label, required }) => (
              <div key={id} className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-40 shrink-0">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={mapowanie[id] || ''}
                  onChange={e => setMapowanie(m => ({ ...m, [id]: e.target.value }))}
                  className="input"
                >
                  <option value="">— pomiń —</option>
                  {csvData.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setKrok(1)} className="btn-ghost">Wróć</button>
            <button
              onClick={() => setKrok(3)}
              disabled={!mapowanie.telefon && !mapowanie.nazwaSlonu}
              className="btn-primary"
            >
              Podgląd →
            </button>
          </div>
        </div>
      )}

      {/* Krok 3 — Podgląd */}
      {krok === 3 && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            Podgląd pierwszych {podglad.length} wierszy:
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {POLA_CRM.filter(p => mapowanie[p.id]).map(p => (
                    <th key={p.id} className="text-left px-3 py-2 font-medium text-gray-500">{p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {podglad.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {POLA_CRM.filter(p => mapowanie[p.id]).map(p => (
                      <td key={p.id} className="px-3 py-2 text-gray-700">{row[p.id] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Łącznie do zaimportowania: {csvData.rows.length} wierszy (duplikaty wg telefonu zostaną pominięte)
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setKrok(2)} className="btn-ghost">Wróć</button>
            <button onClick={importuj} className="btn-primary">
              Importuj {csvData.rows.length} wierszy
            </button>
          </div>
        </div>
      )}

      {/* Krok 4 — Wynik */}
      {krok === 4 && wynik && (
        <div className="text-center py-6">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Import zakończony</h3>
          <p className="text-gray-600">
            Zaimportowano <span className="font-bold text-green-600">{wynik.dodane}</span> kontaktów
          </p>
          {wynik.pominiete > 0 && (
            <p className="text-gray-400 text-sm mt-1">
              Pominięto {wynik.pominiete} duplikatów / pustych wierszy
            </p>
          )}
          <button onClick={onClose} className="btn-primary mt-6">Zamknij</button>
        </div>
      )}
    </Modal>
  )
}
