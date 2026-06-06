import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import StatusBadge from '../components/StatusBadge'
import { formatDate, STATUS_LABELS, ZRODLO_LABELS, BRANZA_LABELS } from '../utils/helpers'
import { archiwizujKontakt, usunKontakt } from '../utils/storage'

const STATUSY_OPCJE = Object.entries(STATUS_LABELS).filter(([s]) => s !== 'archiwum')

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`text-[10px] px-2 py-0.5 rounded border tracking-[0.04em] transition-all whitespace-nowrap ${
      active
        ? 'bg-[#091C28] text-[#22D4F0] border-[#22D4F0]/40'
        : 'text-[#64748B] border-[#1A2535] hover:border-[#22D4F0] hover:text-[#22D4F0]'
    }`}
  >
    {children}
  </button>
)

export default function WidokLista() {
  const { kontakty, odswierz } = useKontakty()
  const navigate = useNavigate()

  const [filtry, setFiltry] = useState({ statusy: [], miasta: [], branze: [], szukaj: '' })
  const [zaznaczone, setZaznaczone] = useState(new Set())
  const [potwierdzUsun, setPotwierdzUsun] = useState(false)   // 'archiwum' | 'trwale' | false

  const miasta = useMemo(
    () => [...new Set(kontakty.map(k => k.miasto).filter(Boolean))].sort(),
    [kontakty]
  )

  const branze = useMemo(
    () => [...new Set(kontakty.map(k => k.branża).filter(Boolean))].sort(),
    [kontakty]
  )

  const filtered = useMemo(() => {
    return kontakty.filter(k => {
      if (k.status === 'archiwum') return false
      if (filtry.statusy.length && !filtry.statusy.includes(k.status)) return false
      if (filtry.miasta.length && !filtry.miasta.includes(k.miasto)) return false
      if (filtry.branze.length && !filtry.branze.includes(k.branża)) return false
      if (filtry.szukaj) {
        const q = filtry.szukaj.toLowerCase()
        if (
          !k.nazwaSlonu?.toLowerCase().includes(q) &&
          !k.imie?.toLowerCase().includes(q) &&
          !k.telefon?.includes(q) &&
          !k.miasto?.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [kontakty, filtry])

  const toggle = (pole, val) =>
    setFiltry(f => ({
      ...f,
      [pole]: f[pole].includes(val) ? f[pole].filter(x => x !== val) : [...f[pole], val]
    }))

  const maFiltry = filtry.statusy.length || filtry.miasta.length || filtry.branze.length || filtry.szukaj

  // ── Zaznaczanie ──────────────────────────────────────────────────────────────

  const wszystkieZaznaczone = filtered.length > 0 && filtered.every(k => zaznaczone.has(k.id))
  const czescZaznaczona = filtered.some(k => zaznaczone.has(k.id)) && !wszystkieZaznaczone

  const toggleZaznacz = (id, e) => {
    e.stopPropagation()
    setZaznaczone(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleWszystkie = () => {
    if (wszystkieZaznaczone) {
      setZaznaczone(new Set())
    } else {
      setZaznaczone(new Set(filtered.map(k => k.id)))
    }
  }

  const handleArchiwizuj = () => {
    if (potwierdzUsun !== 'archiwum') { setPotwierdzUsun('archiwum'); return }
    zaznaczone.forEach(id => archiwizujKontakt(id))
    odswierz()
    setZaznaczone(new Set())
    setPotwierdzUsun(false)
  }

  const handleUsunTrwale = () => {
    if (potwierdzUsun !== 'trwale') { setPotwierdzUsun('trwale'); return }
    zaznaczone.forEach(id => usunKontakt(id))
    odswierz()
    setZaznaczone(new Set())
    setPotwierdzUsun(false)
  }

  const anulujUsun = () => setPotwierdzUsun(false)

  return (
    <div>
      {/* Nagłówek */}
      <div className="flex items-center justify-between mb-4">
        <span className="section-label">LISTA KONTAKTÓW</span>
        <span className="font-mono text-[#64748B] text-[11px]">{filtered.length} kontaktów</span>
      </div>

      {/* ── FilterBar ── */}
      <div className="card p-3 mb-4 space-y-2.5">
        {/* Wiersz 1: szukaj + wyczyść */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Szukaj nazwy, imienia, miasta..."
            value={filtry.szukaj}
            onChange={e => setFiltry(f => ({ ...f, szukaj: e.target.value }))}
            className="input py-1.5 text-xs flex-1 max-w-xs"
          />
          {maFiltry ? (
            <button
              onClick={() => setFiltry({ statusy: [], miasta: [], branze: [], szukaj: '' })}
              className="text-[10px] text-[#64748B] hover:text-[#EF4444] ml-auto transition-colors shrink-0"
            >
              Wyczyść filtry
            </button>
          ) : null}
        </div>

        {/* Wiersz 2: Status */}
        <div className="flex items-start gap-2">
          <span className="text-[10px] text-[#1A2535] uppercase tracking-[0.1em] pt-0.5 w-20 shrink-0">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUSY_OPCJE.map(([v, l]) => (
              <Chip key={v} active={filtry.statusy.includes(v)} onClick={() => toggle('statusy', v)}>
                {l}
              </Chip>
            ))}
          </div>
        </div>

        {/* Wiersz 3: Miejscowość */}
        {miasta.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-[#1A2535] uppercase tracking-[0.1em] pt-0.5 w-20 shrink-0">Miasto</span>
            <div className="flex flex-wrap gap-1.5">
              {miasta.map(m => (
                <Chip key={m} active={filtry.miasta.includes(m)} onClick={() => toggle('miasta', m)}>
                  {m}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Wiersz 4: Branża */}
        {branze.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-[#1A2535] uppercase tracking-[0.1em] pt-0.5 w-20 shrink-0">Branża</span>
            <div className="flex flex-wrap gap-1.5">
              {branze.map(b => (
                <Chip key={b} active={filtry.branze.includes(b)} onClick={() => toggle('branze', b)}>
                  {BRANZA_LABELS[b] ?? b}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Pasek akcji zbiorczych ── */}
      {zaznaczone.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-[#0F1218] border border-[#1A2535] rounded-lg">
          <span className="text-xs text-[#64748B]">
            Zaznaczono <span className="text-[#E2E8F0] font-mono">{zaznaczone.size}</span>
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {potwierdzUsun === 'archiwum' ? (
              <>
                <span className="text-xs text-[#F59E0B]">Archiwizować {zaznaczone.size} kontaktów?</span>
                <button onClick={handleArchiwizuj} className="text-xs px-3 py-1 rounded border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/10 transition-all">
                  Tak, archiwizuj
                </button>
                <button onClick={anulujUsun} className="text-xs text-[#64748B] hover:text-[#E2E8F0] transition-colors">
                  Anuluj
                </button>
              </>
            ) : potwierdzUsun === 'trwale' ? (
              <>
                <span className="text-xs text-[#EF4444]">Trwale usunąć {zaznaczone.size} kontaktów? Tego nie cofniesz.</span>
                <button onClick={handleUsunTrwale} className="text-xs px-3 py-1 rounded bg-[#EF4444]/20 border border-[#EF4444]/60 text-[#EF4444] hover:bg-[#EF4444]/30 transition-all font-medium">
                  Tak, usuń na zawsze
                </button>
                <button onClick={anulujUsun} className="text-xs text-[#64748B] hover:text-[#E2E8F0] transition-colors">
                  Anuluj
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setZaznaczone(new Set())} className="text-xs text-[#64748B] hover:text-[#E2E8F0] transition-colors">
                  Odznacz
                </button>
                <button onClick={handleArchiwizuj} className="text-xs px-3 py-1 rounded border border-[#1A2535] text-[#64748B] hover:border-[#EF4444]/40 hover:text-[#EF4444] transition-all">
                  Archiwizuj
                </button>
                <button onClick={handleUsunTrwale} className="text-xs px-3 py-1 rounded border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/10 transition-all">
                  Usuń trwale
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Tabela ── */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#141921] border-b border-[#1A2535]">
            <tr>
              <th className="px-3 py-2.5 w-9">
                <input
                  type="checkbox"
                  checked={wszystkieZaznaczone}
                  ref={el => { if (el) el.indeterminate = czescZaznaczona }}
                  onChange={toggleWszystkie}
                  className="w-3.5 h-3.5 accent-[#22D4F0] cursor-pointer"
                />
              </th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Salon</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Imię</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Telefon</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Miasto</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Branża</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Status</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Ostatni kontakt</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Następny krok</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-[#64748B] text-xs">
                  {maFiltry ? 'Brak wyników dla wybranych filtrów' : 'Brak kontaktów — dodaj pierwszy lub zaimportuj CSV'}
                </td>
              </tr>
            ) : (
              filtered.map((k, i) => (
                <tr
                  key={k.id}
                  onClick={() => navigate(`/kontakt/${k.id}`)}
                  className={`border-t border-[#1A2535] cursor-pointer transition-colors animate-entry ${
                    zaznaczone.has(k.id) ? 'bg-[#091C28]' : 'hover:bg-[#0C1520]'
                  }`}
                  style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                >
                  <td
                    className="px-3 py-3"
                    onClick={e => toggleZaznacz(k.id, e)}
                  >
                    <input
                      type="checkbox"
                      checked={zaznaczone.has(k.id)}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 accent-[#22D4F0] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-[#E2E8F0] font-medium">{k.nazwaSlonu}</td>
                  <td className="px-4 py-3 text-[#64748B]">{k.imie || '—'}</td>
                  <td className="px-4 py-3 font-mono text-[#64748B] text-xs">{k.telefon}</td>
                  <td className="px-4 py-3 text-[#64748B]">{k.miasto || '—'}</td>
                  <td className="px-4 py-3 text-[#64748B] text-xs">
                    {k.branża ? (BRANZA_LABELS[k.branża] ?? k.branża) : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                  <td className="px-4 py-3 font-mono text-[#64748B] text-xs">{formatDate(k.dataOstatniegoKontaktu)}</td>
                  <td className="px-4 py-3 text-[#64748B] text-xs truncate max-w-[140px]">{k.nastepnyKrok || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
