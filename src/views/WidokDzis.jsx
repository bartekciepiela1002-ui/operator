import { useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import StatusBadge from '../components/StatusBadge'
import { today, daysDiff, formatDate } from '../utils/helpers'

export default function WidokDzis() {
  const { kontakty } = useKontakty()
  const navigate = useNavigate()
  const dzis = today()

  const przypomnienia = kontakty
    .filter(k => k.dataPrzypomnienia === dzis && k.status !== 'archiwum')
    .sort((a, b) => a.status.localeCompare(b.status))

  const stale = kontakty.filter(k =>
    ['demo_umowione', 'po_demo'].includes(k.status) &&
    daysDiff(k.dataOstatniegoKontaktu) > 7
  )

  const KartaKontaktu = ({ k, wariant }) => (
    <div className={`card p-4 flex items-center justify-between ${wariant === 'stale' ? 'bg-amber-50 border-amber-200' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{k.imie || k.nazwaSlonu}</span>
          {k.imie && <span className="text-sm text-gray-400">{k.nazwaSlonu}</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <StatusBadge status={k.status} />
          {wariant === 'stale' && (
            <span className="text-xs text-amber-700 font-medium">
              Brak kontaktu od {daysDiff(k.dataOstatniegoKontaktu)} dni
            </span>
          )}
          {wariant === 'przypomnienie' && k.nastepnyKrok && (
            <span className="text-xs text-gray-500 truncate">{k.nastepnyKrok}</span>
          )}
        </div>
        {k.miasto && <div className="text-xs text-gray-400 mt-0.5">{k.miasto}</div>}
      </div>
      <button
        onClick={() => navigate(`/kontakt/${k.id}`)}
        className="btn-ghost ml-4 shrink-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
      >
        Otwórz →
      </button>
    </div>
  )

  const SectionHeader = ({ title, count, variant }) => (
    <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
      {title}
      {count > 0 && (
        <span className={`text-white text-xs rounded-full px-2 py-0.5 ${variant === 'stale' ? 'bg-amber-500' : 'bg-red-500'}`}>
          {count}
        </span>
      )}
    </h2>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-baseline gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dziś</h1>
        <span className="text-sm text-gray-400">{formatDate(dzis)}</span>
      </div>

      <section className="mb-8">
        <SectionHeader title="Przypomnienia" count={przypomnienia.length} variant="przypomnienie" />
        {przypomnienia.length === 0 ? (
          <div className="card p-6 text-center text-gray-400 text-sm">
            Brak przypomnień na dziś 🎉
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {przypomnienia.map(k => (
              <KartaKontaktu key={k.id} k={k} wariant="przypomnienie" />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Stale alerty — demo bez ruchu &gt;7 dni" count={stale.length} variant="stale" />
        {stale.length === 0 ? (
          <div className="card p-6 text-center text-gray-400 text-sm">
            Brak stale alertów
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {stale.map(k => (
              <KartaKontaktu key={k.id} k={k} wariant="stale" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
