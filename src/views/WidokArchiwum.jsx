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

  const Chip = ({ val, label }) => (
    <button
      onClick={() => setFiltr(val)}
      className={`text-[10px] px-2 py-0.5 rounded border tracking-[0.04em] transition-all ${
        filtr === val
          ? 'bg-[#091C28] text-[#22D4F0] border-[#22D4F0]/40'
          : 'text-[#64748B] border-[#1A2535] hover:border-[#22D4F0] hover:text-[#22D4F0]'
      }`}
    >
      {label}
    </button>
  )

  const kontaktDoPotwierdzenia = kontakty.find(k => k.id === potwierdzId)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="section-label">ARCHIWUM</span>
        <span className="font-mono text-[#64748B] text-[11px]">{archiwum.length} kontaktów</span>
      </div>

      <div className="flex gap-2 mb-4">
        <Chip val="wszystkie" label="Wszystkie" />
        <Chip val="archiwum" label="Archiwum" />
        <Chip val="nurturing" label="Nurturing" />
        <Chip val="odlozone" label="Odłożone" />
        <Chip val="zamkniete_nie" label="Zamknięte ✗" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#141921] border-b border-[#1A2535]">
            <tr>
              <th className="text-left px-4 py-2.5"><span className="section-label">Salon</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Miasto</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Status</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Data archiwizacji</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Powrót / przypomnienie</span></th>
              <th className="text-left px-4 py-2.5"><span className="section-label">Powód</span></th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {archiwum.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-[#64748B] text-xs">
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
                    className="border-t border-[#1A2535] hover:bg-[#0C1520] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/kontakt/${k.id}`)}
                        className="font-medium text-[#E2E8F0] hover:text-[#22D4F0] text-left transition-colors"
                      >
                        {k.nazwaSlonu}
                      </button>
                      {k.imie && <div className="text-xs text-[#64748B]">{k.imie}</div>}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">{k.miasto || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#64748B]">{formatDate(k.dataArchiwizacji)}</td>
                    <td className="px-4 py-3">
                      {powrot ? (
                        <span className={`font-mono text-[11px] ${powrotMiniony ? 'text-[#10B981]' : 'text-[#64748B]'}`}>
                          {formatDate(powrot)}
                          {powrotMiniony && ' — czas wrócić!'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">
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
          <p className="text-[#64748B] text-sm mb-1">
            Kontakt <strong className="text-[#E2E8F0]">{kontaktDoPotwierdzenia.nazwaSlonu}</strong> wróci do statusu{' '}
            <strong className="text-[#E2E8F0]">Do zadzwonienia</strong>.
          </p>
          <p className="text-[#F59E0B] text-xs mb-4">
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
