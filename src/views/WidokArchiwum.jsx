import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { edytujKontakt } from '../utils/storage'
import { formatDate, POWOD_LABELS, today } from '../utils/helpers'

export default function WidokArchiwum() {
  const { kontakty, odswierz } = useKontakty()
  const navigate = useNavigate()
  const [filtr, setFiltr] = useState('wszystkie')
  const [potwierdzId, setPotwierdzId] = useState(null)

  const dzis = today()

  const archiwum = useMemo(() => {
    return kontakty.filter(k => {
      if (k.status === 'archiwum') {
        if (filtr === 'nurturing') return true
        return filtr === 'wszystkie' || filtr === 'archiwum'
      }
      if (k.status === 'odlozone') {
        return filtr === 'odlozone' || filtr === 'wszystkie'
      }
      if (k.status === 'zamkniete_nie') {
        return filtr === 'zamkniete_nie' || filtr === 'wszystkie'
      }
      return false
    }).sort((a, b) => {
      const da = a.dataArchiwizacji || a.dataOstatniegoKontaktu || ''
      const db = b.dataArchiwizacji || b.dataOstatniegoKontaktu || ''
      return db.localeCompare(da)
    })
  }, [kontakty, filtr])

  const reaktywuj = (id) => {
    edytujKontakt(id, {
      status: 'do_zadzwonienia',
      tor: null,
      licznikTel: 0,
      licznikOutreach: 0,
      dataArchiwizacji: null,
      dataNurturingu: null,
      dataPrzypomnienia: null,
      dataOstatniegoKontaktu: null
    })
    odswierz()
    setPotwierdzId(null)
  }

  const filtrBtn = (val, label) => (
    <button
      onClick={() => setFiltr(val)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        filtr === val
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )

  const kontaktDoPotwierdzenia = kontakty.find(k => k.id === potwierdzId)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Archiwum</h1>
        <span className="text-sm text-gray-400">{archiwum.length} kontaktów</span>
      </div>

      <div className="flex gap-2 mb-4">
        {filtrBtn('wszystkie', 'Wszystkie')}
        {filtrBtn('archiwum', 'Archiwum')}
        {filtrBtn('nurturing', 'Nurturing')}
        {filtrBtn('odlozone', 'Odłożone')}
        {filtrBtn('zamkniete_nie', 'Zamknięte ✗')}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Salon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Miasto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Data archiwizacji</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Powrót / przypomnienie</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Powód</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {archiwum.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  Brak kontaktów w archiwum
                </td>
              </tr>
            ) : (
              archiwum.map(k => {
                const powrot = k.dataNurturingu || k.dataPrzypomnienia
                const powrotMiniony = powrot && powrot <= dzis
                return (
                  <tr
                    key={k.id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/kontakt/${k.id}`)}
                        className="font-medium text-gray-900 hover:text-indigo-600 text-left"
                      >
                        {k.nazwaSlonu}
                      </button>
                      {k.imie && <div className="text-xs text-gray-400">{k.imie}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{k.miasto || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(k.dataArchiwizacji)}</td>
                    <td className="px-4 py-3">
                      {powrot ? (
                        <span className={`text-sm font-medium ${powrotMiniony ? 'text-green-600' : 'text-gray-500'}`}>
                          {formatDate(powrot)}
                          {powrotMiniony && ' — czas wrócić!'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {POWOD_LABELS[k.powodOdmowy] || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setPotwierdzId(k.id)}
                        className="btn-ghost text-xs"
                      >
                        Reaktywuj
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {potwierdzId && kontaktDoPotwierdzenia && (
        <Modal title="Reaktywuj kontakt" onClose={() => setPotwierdzId(null)}>
          <p className="text-gray-600 text-sm mb-1">
            Kontakt <strong>{kontaktDoPotwierdzenia.nazwaSlonu}</strong> wróci do statusu{' '}
            <strong>Do zadzwonienia</strong>.
          </p>
          <p className="text-amber-600 text-sm mb-4">
            Liczniki prób tel i outreach zostaną wyzerowane.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setPotwierdzId(null)} className="btn-ghost">Anuluj</button>
            <button onClick={() => reaktywuj(potwierdzId)} className="btn-primary">
              Reaktywuj
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
