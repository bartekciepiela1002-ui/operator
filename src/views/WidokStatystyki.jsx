import { useMemo } from 'react'
import { useKontakty } from '../context/KontaktyContext'
import { STATUS_LABELS, POWOD_LABELS, ZRODLO_LABELS } from '../utils/helpers'

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

function BarChart({ items, colorClass = 'bg-indigo-500' }) {
  const max = Math.max(...items.map(i => i.val), 1)
  return (
    <div className="space-y-2">
      {items.map(({ label, val, color }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-36 shrink-0 truncate">{label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${color || colorClass}`}
              style={{ width: `${Math.max((val / max) * 100, val > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-6 text-right">{val}</span>
        </div>
      ))}
    </div>
  )
}

function KartaStat({ label, val, sub, color = 'text-indigo-600' }) {
  return (
    <div className="card p-5">
      <div className={`text-3xl font-bold ${color}`}>{val}</div>
      <div className="text-sm font-medium text-gray-700 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function WidokStatystyki() {
  const { kontakty } = useKontakty()

  const stats = useMemo(() => {
    const aktywne = kontakty.filter(k => k.status !== 'archiwum' && !['zamkniete_tak', 'zamkniete_nie'].includes(k.status))
    const wygrane = kontakty.filter(k => k.status === 'zamkniete_tak')
    const przegrane = kontakty.filter(k => k.status === 'zamkniete_nie')
    const wPipeline = kontakty.filter(k => !['archiwum', 'zamkniete_tak', 'zamkniete_nie'].includes(k.status))

    // Lejek konwersji
    const lejek = PIPELINE_STATUSY.map(s => ({
      label: STATUS_LABELS[s],
      val: kontakty.filter(k => k.status === s).length,
      color: s === 'zamkniete_tak' ? 'bg-green-500' : s === 'zamkniete_nie' ? 'bg-red-400' : 'bg-indigo-500'
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

    return { aktywne, wygrane, przegrane, wPipeline, lejek, zrodla, miasta, srCykl, powody }
  }, [kontakty])

  const konwersja = kontakty.length > 0
    ? Math.round((stats.wygrane.length / kontakty.length) * 100)
    : 0

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Statystyki</h1>

      {/* Karty podsumowania */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KartaStat
          label="Wszystkich kontaktów"
          val={kontakty.length}
          color="text-gray-900"
        />
        <KartaStat
          label="W pipeline"
          val={stats.wPipeline.length}
          color="text-indigo-600"
        />
        <KartaStat
          label="Zamknięte — wygrane"
          val={stats.wygrane.length}
          sub={`${konwersja}% konwersja`}
          color="text-green-600"
        />
        <KartaStat
          label="Zamknięte — przegrane"
          val={stats.przegrane.length}
          color="text-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lejek konwersji */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Lejek konwersji</h2>
          {stats.lejek.every(i => i.val === 0) ? (
            <p className="text-gray-400 text-sm">Brak danych</p>
          ) : (
            <BarChart items={stats.lejek} />
          )}
        </div>

        {/* Rozkład per miasto */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Rozkład per miasto</h2>
          {stats.miasta.length === 0 ? (
            <p className="text-gray-400 text-sm">Brak danych</p>
          ) : (
            <BarChart items={stats.miasta} colorClass="bg-blue-400" />
          )}
        </div>

        {/* Źródło → konwersja */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Źródło → konwersja</h2>
          {stats.zrodla.length === 0 ? (
            <p className="text-gray-400 text-sm">Brak danych</p>
          ) : (
            <div className="space-y-3">
              {stats.zrodla.map(z => (
                <div key={z.label} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{z.label}</div>
                    <div className="text-xs text-gray-400">{z.total} kontaktów · {z.zamkniete} wygranych</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{z.procent}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Średni czas cyklu + powody odmowy */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Średni czas cyklu</h2>
            {stats.srCykl === null ? (
              <p className="text-gray-400 text-sm">Brak zamkniętych wygranych</p>
            ) : (
              <div>
                <div className="text-3xl font-bold text-indigo-600">{stats.srCykl}</div>
                <div className="text-sm text-gray-400">dni od dodania do zamknięcia (wygrane)</div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Powody odmowy</h2>
            {stats.powody.length === 0 ? (
              <p className="text-gray-400 text-sm">Brak danych</p>
            ) : (
              <BarChart items={stats.powody} colorClass="bg-red-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
