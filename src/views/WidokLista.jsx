import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import StatusBadge from '../components/StatusBadge'
import { formatDate, STATUS_LABELS, ZRODLO_LABELS } from '../utils/helpers'

const STATUSY_OPCJE = Object.entries(STATUS_LABELS).filter(([s]) => s !== 'archiwum')

export default function WidokLista() {
  const { kontakty } = useKontakty()
  const navigate = useNavigate()

  const [filtry, setFiltry] = useState({
    statusy: [],
    miasta: [],
    zrodla: [],
    szukaj: ''
  })

  const miasta = useMemo(
    () => [...new Set(kontakty.map(k => k.miasto).filter(Boolean))].sort(),
    [kontakty]
  )

  const filtered = useMemo(() => {
    return kontakty.filter(k => {
      if (k.status === 'archiwum') return false
      if (filtry.statusy.length && !filtry.statusy.includes(k.status)) return false
      if (filtry.miasta.length && !filtry.miasta.includes(k.miasto)) return false
      if (filtry.zrodla.length && !filtry.zrodla.includes(k.zrodlo)) return false
      if (filtry.szukaj) {
        const q = filtry.szukaj.toLowerCase()
        const match =
          k.nazwaSlonu?.toLowerCase().includes(q) ||
          k.imie?.toLowerCase().includes(q) ||
          k.telefon?.includes(q) ||
          k.miasto?.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [kontakty, filtry])

  const toggle = (pole, val) =>
    setFiltry(f => ({
      ...f,
      [pole]: f[pole].includes(val) ? f[pole].filter(x => x !== val) : [...f[pole], val]
    }))

  const maFiltry = filtry.statusy.length || filtry.miasta.length || filtry.zrodla.length || filtry.szukaj

  const Chip = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs border transition-colors font-medium ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Lista kontaktów</h1>
        <span className="text-sm text-gray-400">{filtered.length} kontaktów</span>
      </div>

      {/* FilterBar */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Szukaj po nazwie, imieniu, telefonie..."
            value={filtry.szukaj}
            onChange={e => setFiltry(f => ({ ...f, szukaj: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {maFiltry ? (
            <button
              onClick={() => setFiltry({ statusy: [], miasta: [], zrodla: [], szukaj: '' })}
              className="text-xs text-gray-400 hover:text-red-500 ml-auto"
            >
              Wyczyść filtry
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUSY_OPCJE.map(([v, l]) => (
            <Chip key={v} active={filtry.statusy.includes(v)} onClick={() => toggle('statusy', v)}>
              {l}
            </Chip>
          ))}
        </div>

        {miasta.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {miasta.map(m => (
              <Chip key={m} active={filtry.miasta.includes(m)} onClick={() => toggle('miasta', m)}>
                {m}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Salon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Imię</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Telefon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Miasto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Próby</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Ostatni kontakt</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 max-w-xs">Następny krok</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  {maFiltry ? 'Brak wyników dla wybranych filtrów' : 'Brak kontaktów — dodaj pierwszy lub zaimportuj CSV'}
                </td>
              </tr>
            ) : (
              filtered.map(k => (
                <tr
                  key={k.id}
                  onClick={() => navigate(`/kontakt/${k.id}`)}
                  className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{k.nazwaSlonu}</td>
                  <td className="px-4 py-3 text-gray-600">{k.imie || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{k.telefon}</td>
                  <td className="px-4 py-3 text-gray-600">{k.miasto || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {k.tor === 'nie_odbiera'
                      ? `${k.licznikTel}/6 tel · ${k.licznikOutreach}/2 out`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(k.dataOstatniegoKontaktu)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{k.nastepnyKrok || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
