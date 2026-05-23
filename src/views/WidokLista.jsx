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
      className={`text-[10px] px-2 py-0.5 rounded border tracking-[0.04em] transition-all ${
        active
          ? 'bg-[#091C28] text-[#22D4F0] border-[#22D4F0]/40'
          : 'text-[#64748B] border-[#1A2535] hover:border-[#22D4F0] hover:text-[#22D4F0]'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="section-label">LISTA KONTAKTÓW</span>
        <span className="font-mono text-[#64748B] text-[11px]">{filtered.length} kontaktów</span>
      </div>

      {/* FilterBar */}
      <div className="card p-3 mb-4 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Szukaj po nazwie, imieniu, telefonie..."
            value={filtry.szukaj}
            onChange={e => setFiltry(f => ({ ...f, szukaj: e.target.value }))}
            className="input py-1.5 text-xs w-56"
          />
          {maFiltry ? (
            <button
              onClick={() => setFiltry({ statusy: [], miasta: [], zrodla: [], szukaj: '' })}
              className="text-[10px] text-[#64748B] hover:text-[#EF4444] ml-auto transition-colors"
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
          <thead className="bg-[#141921] border-b border-[#1A2535]">
            <tr>
              <th className="text-left px-4 py-2.5"><span className="section-label">Salon</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Imię</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Telefon</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Miasto</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Status</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Próby</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Ostatni kontakt</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Następny krok</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-[#64748B] text-xs">
                  {maFiltry ? 'Brak wyników dla wybranych filtrów' : 'Brak kontaktów — dodaj pierwszy lub zaimportuj CSV'}
                </td>
              </tr>
            ) : (
              filtered.map((k, i) => (
                <tr
                  key={k.id}
                  onClick={() => navigate(`/kontakt/${k.id}`)}
                  className="border-t border-[#1A2535] hover:bg-[#0C1520] cursor-pointer transition-colors animate-entry"
                  style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                >
                  <td className="px-4 py-3 text-[#E2E8F0] font-medium">{k.nazwaSlonu}</td>
                  <td className="px-4 py-3 text-[#64748B]">{k.imie || '—'}</td>
                  <td className="px-4 py-3 font-mono text-[#64748B] text-xs">{k.telefon}</td>
                  <td className="px-4 py-3 text-[#64748B]">{k.miasto || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                  <td className="px-4 py-3 font-mono text-[#64748B] text-xs">
                    {k.tor === 'nie_odbiera'
                      ? `${k.licznikTel}/6 · ${k.licznikOutreach}/2`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#64748B] text-xs">{formatDate(k.dataOstatniegoKontaktu)}</td>
                  <td className="px-4 py-3 text-[#64748B] text-xs truncate max-w-[160px]">{k.nastepnyKrok || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
