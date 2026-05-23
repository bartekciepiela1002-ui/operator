import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import { STATUS_LABELS, POWOD_LABELS, ZRODLO_LABELS, daysDiff } from '../utils/helpers'

const PIPELINE_STATUSY = [
  'do_zadzwonienia',
  'proby_kontaktu',
  'w_kontakcie',
  'prosi_o_maila',
  'mail_wyslany',
  'demo_umowione',
  'po_demo',
  'zamkniete_tak',
  'zamkniete_nie'
]

function BarChart({ items, colorClass = 'bg-[#22D4F0]' }) {
  const max = Math.max(...items.map(i => i.val), 1)
  return (
    <div className="space-y-2">
      {items.map(({ label, val, color }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-[10px] text-[#64748B] w-36 shrink-0 truncate">{label}</span>
          <div className="flex-1 bg-[#141921] rounded-full h-[3px] overflow-hidden">
            <div
              className={color === 'bg-[#10B981]' ? 'bg-[#10B981]' : color === 'bg-[#EF4444]' ? 'bg-[#EF4444]' : colorClass}
              style={{
                height: '100%',
                borderRadius: '9999px',
                '--fill-w': `${Math.max((val / max) * 100, val > 0 ? 4 : 0)}%`,
                width: 0,
                animation: 'fillBar 1s cubic-bezier(0.4,0,0.2,1) 0.2s forwards',
                boxShadow: color === 'bg-[#10B981]'
                  ? '0 0 4px rgba(16,185,129,0.5)'
                  : color === 'bg-[#EF4444]'
                  ? '0 0 4px rgba(239,68,68,0.5)'
                  : '0 0 4px rgba(34,212,240,0.5)'
              }}
            />
          </div>
          <span className="font-mono text-[11px] text-[#E2E8F0] w-6 text-right">{val}</span>
        </div>
      ))}
    </div>
  )
}

function KartaStat({ label, val, sub, colorStyle = '#E2E8F0' }) {
  return (
    <div className="card p-5">
      <div className="font-mono text-3xl font-bold animate-entry" style={{ color: colorStyle }}>{val}</div>
      <div className="text-xs text-[#64748B] mt-1">{label}</div>
      {sub && <div className="text-[10px] text-[#64748B] mt-0.5">{sub}</div>}
    </div>
  )
}

export default function WidokStatystyki() {
  const { kontakty } = useKontakty()
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const aktywne = kontakty.filter(k => k.status !== 'archiwum' && !['zamkniete_tak', 'zamkniete_nie'].includes(k.status))
    const wygrane = kontakty.filter(k => k.status === 'zamkniete_tak')
    const przegrane = kontakty.filter(k => k.status === 'zamkniete_nie')
    const wPipeline = kontakty.filter(k => !['archiwum', 'zamkniete_tak', 'zamkniete_nie'].includes(k.status))

    // Lejek konwersji
    const lejek = PIPELINE_STATUSY.map(s => ({
      label: STATUS_LABELS[s],
      val: kontakty.filter(k => k.status === s).length,
      color: s === 'zamkniete_tak' ? 'bg-[#10B981]' : s === 'zamkniete_nie' ? 'bg-[#EF4444]' : 'bg-[#22D4F0]'
    }))

    // Źródło → konwersja
    const zrodla = Object.keys(ZRODLO_LABELS).map(z => {
      const total = kontakty.filter(k => k.zrodlo === z).length
      const zamkn = kontakty.filter(k => k.zrodlo === z && k.status === 'zamkniete_tak').length
      return {
        label: ZRODLO_LABELS[z],
        total,
        zamkniete: zamkn,
        procent: total > 0 ? Math.round((zamkn / total) * 100) : 0
      }
    }).filter(z => z.total > 0)

    // Rozkład per miasto
    const miastaCounts = {}
    kontakty.forEach(k => {
      if (k.miasto && k.status !== 'archiwum') {
        miastaCounts[k.miasto] = (miastaCounts[k.miasto] || 0) + 1
      }
    })
    const miasta = Object.entries(miastaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, val]) => ({ label, val }))

    // Średni czas cyklu
    const cykleDni = wygrane
      .filter(k => k.dataUtworzenia)
      .map(k => {
        const start = new Date(k.dataUtworzenia)
        const end = new Date(k.dataOstatniegoKontaktu || new Date())
        return Math.floor((end - start) / 86400000)
      })
      .filter(d => d >= 0)

    const srCykl = cykleDni.length > 0
      ? Math.round(cykleDni.reduce((a, b) => a + b, 0) / cykleDni.length)
      : null

    // Powody odmowy
    const powody = Object.keys(POWOD_LABELS).map(p => ({
      label: POWOD_LABELS[p],
      val: przegrane.filter(k => k.powodOdmowy === p).length
    })).filter(p => p.val > 0)

    // Tracker objekcji — szczegóły
    const szczegoly = kontakty
      .filter(k => k.szczegolObjekcji && k.status === 'zamkniete_nie')
      .sort((a, b) => (b.dataOstatniegoKontaktu || '').localeCompare(a.dataOstatniegoKontaktu || ''))
      .slice(0, 10)

    return { aktywne, wygrane, przegrane, wPipeline, lejek, zrodla, miasta, srCykl, powody, szczegoly }
  }, [kontakty])

  const konwersja = kontakty.length > 0
    ? Math.round((stats.wygrane.length / kontakty.length) * 100)
    : 0

  return (
    <div className="max-w-4xl">
      <p className="section-label mb-6">STATYSTYKI</p>

      {/* Karty podsumowania */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KartaStat
          label="Wszystkich kontaktów"
          val={kontakty.length}
          colorStyle="#E2E8F0"
        />
        <KartaStat
          label="W pipeline"
          val={stats.wPipeline.length}
          colorStyle="#22D4F0"
        />
        <KartaStat
          label="Zamknięte — wygrane"
          val={stats.wygrane.length}
          sub={`${konwersja}% konwersja`}
          colorStyle="#10B981"
        />
        <KartaStat
          label="Zamknięte — przegrane"
          val={stats.przegrane.length}
          colorStyle="#EF4444"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lejek konwersji */}
        <div className="card p-5">
          <p className="section-label mb-4">Lejek konwersji</p>
          {stats.lejek.every(i => i.val === 0) ? (
            <p className="text-[#64748B] text-xs">Brak danych</p>
          ) : (
            <BarChart items={stats.lejek} />
          )}
        </div>

        {/* Rozkład per miasto */}
        <div className="card p-5">
          <p className="section-label mb-4">Rozkład per miasto</p>
          {stats.miasta.length === 0 ? (
            <p className="text-[#64748B] text-xs">Brak danych</p>
          ) : (
            <BarChart items={stats.miasta} colorClass="bg-[#22D4F0]" />
          )}
        </div>

        {/* Źródło → konwersja */}
        <div className="card p-5">
          <p className="section-label mb-4">Źródło → konwersja</p>
          {stats.zrodla.length === 0 ? (
            <p className="text-[#64748B] text-xs">Brak danych</p>
          ) : (
            <div className="space-y-3">
              {stats.zrodla.map(z => (
                <div key={z.label} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#64748B]">{z.label}</div>
                    <div className="font-mono text-[10px] text-[#64748B]">{z.total} kontaktów · {z.zamkniete} wygranych</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-[#10B981]">{z.procent}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Średni czas cyklu + powody odmowy */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="section-label mb-2">Średni czas cyklu</p>
            {stats.srCykl === null ? (
              <p className="text-[#64748B] text-xs">Brak zamkniętych wygranych</p>
            ) : (
              <div>
                <div className="font-mono text-3xl font-bold text-[#22D4F0] animate-entry">{stats.srCykl}</div>
                <div className="text-[10px] text-[#64748B]">dni od dodania do zamknięcia (wygrane)</div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <p className="section-label mb-4">Powody odmowy</p>
            {stats.powody.length === 0 ? (
              <p className="text-[#64748B] text-xs">Brak danych</p>
            ) : (
              <BarChart items={stats.powody} colorClass="bg-[#EF4444]" />
            )}
          </div>
        </div>
      </div>

      {/* Tracker objekcji */}
      <div className="mt-8">
        <p className="section-label mb-5">Tracker objekcji</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rozkład powodów odmowy z % */}
          <div className="card p-5">
            <p className="section-label mb-4">Rozkład powodów odmowy</p>
            {stats.przegrane.length === 0 ? (
              <p className="text-[#64748B] text-xs">Brak danych</p>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(POWOD_LABELS).map(([key, label]) => {
                  const count = stats.przegrane.filter(k => k.powodOdmowy === key).length
                  const procent = Math.round((count / stats.przegrane.length) * 100)
                  if (count === 0) return null
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-[10px] text-[#64748B] w-36 shrink-0 truncate">{label}</span>
                      <div className="flex-1 bg-[#141921] rounded-full h-[3px] overflow-hidden">
                        <div
                          className="bg-[#EF4444] h-full rounded-full"
                          style={{
                            '--fill-w': `${procent}%`,
                            width: 0,
                            animation: 'fillBar 1s cubic-bezier(0.4,0,0.2,1) 0.2s forwards',
                            boxShadow: '0 0 4px rgba(239,68,68,0.5)'
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-[#E2E8F0] w-5 text-right shrink-0">{count}</span>
                      <span className="font-mono text-[10px] text-[#64748B] w-8 text-right shrink-0">({procent}%)</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Ostatnie szczegóły */}
          <div className="card p-5">
            <p className="section-label mb-4">Ostatnie szczegóły objekcji</p>
            {stats.szczegoly.length === 0 ? (
              <p className="text-[#64748B] text-xs">Brak zapisanych szczegółów. Uzupełnij "Co powiedziała?" przy zamknięciu kontaktu.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.szczegoly.map(k => (
                  <div
                    key={k.id}
                    onClick={() => navigate(`/kontakt/${k.id}`)}
                    className="cursor-pointer hover:bg-[#0C1520] rounded-lg p-2.5 transition-colors border border-[#1A2535] hover:border-[#22D4F0]/30"
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-mono bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 rounded px-1.5 py-0.5 shrink-0">
                        {POWOD_LABELS[k.powodOdmowy] || k.powodOdmowy}
                      </span>
                      <span className="text-[#64748B] text-[10px] truncate">{k.imie ? `${k.imie}, ${k.nazwaSlonu}` : k.nazwaSlonu}</span>
                      <span className="text-[#64748B] text-[10px] ml-auto shrink-0 font-mono">
                        {k.dataOstatniegoKontaktu ? `${daysDiff(k.dataOstatniegoKontaktu)}d temu` : ''}
                      </span>
                    </div>
                    <p className="text-[#64748B] text-xs leading-relaxed">
                      "{k.szczegolObjekcji}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
