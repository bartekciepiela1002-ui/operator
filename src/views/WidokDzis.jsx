import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import StatusBadge from '../components/StatusBadge'
import { edytujKontakt } from '../utils/storage'
import { today, daysDiff, formatDate } from '../utils/helpers'

export default function WidokDzis() {
  const { kontakty, odswierz } = useKontakty()
  const navigate = useNavigate()
  const dzis = today()
  const [editingReminder, setEditingReminder] = useState(null)
  const [reminderVal, setReminderVal] = useState('')

  const zapiszPrzypomnienie = (id) => {
    if (!reminderVal) return
    edytujKontakt(id, { dataPrzypomnienia: reminderVal })
    odswierz()
    setEditingReminder(null)
    setReminderVal('')
  }

  const przypomnienia = kontakty
    .filter(k => k.dataPrzypomnienia === dzis && k.status !== 'archiwum')
    .sort((a, b) => a.status.localeCompare(b.status))

  const stale = kontakty.filter(k =>
    ['demo_umowione', 'po_demo'].includes(k.status) &&
    daysDiff(k.dataOstatniegoKontaktu) > 7
  )

  const KartaKontaktu = ({ k, wariant }) => (
    <div className={`card p-4 ${wariant === 'stale' ? 'border-[#F59E0B]/30 bg-[#0C1520]' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#E2E8F0] text-sm font-medium">{k.imie || k.nazwaSlonu}</span>
            {k.imie && <span className="text-[#64748B] text-xs">{k.nazwaSlonu}</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <StatusBadge status={k.status} />
            {wariant === 'stale' && (
              <span className="text-[#F59E0B] font-mono text-[10px]">
                {daysDiff(k.dataOstatniegoKontaktu)}d bez kontaktu
              </span>
            )}
            {wariant === 'przypomnienie' && k.nastepnyKrok && (
              <span className="text-[#64748B] text-[10px] truncate">{k.nastepnyKrok}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setEditingReminder(k.id); setReminderVal(k.dataPrzypomnienia || '') }}
            className="text-[10px] text-[#64748B] hover:text-[#22D4F0] transition-colors"
          >
            {k.dataPrzypomnienia ? `🔔 ${formatDate(k.dataPrzypomnienia)}` : '+ Przypomnij'}
          </button>
          <button
            onClick={() => navigate(`/kontakt/${k.id}`)}
            className="btn-ghost text-xs"
          >
            Otwórz →
          </button>
        </div>
      </div>

      {editingReminder === k.id && (
        <div className="mt-3 pt-3 border-t border-[#1A2535] flex items-center gap-2">
          <input
            type="date"
            value={reminderVal}
            min={dzis}
            onChange={e => setReminderVal(e.target.value)}
            className="input py-1 text-xs"
            autoFocus
          />
          <button onClick={() => zapiszPrzypomnienie(k.id)} disabled={!reminderVal} className="btn-primary px-3 py-1 text-xs">
            Zapisz
          </button>
          <button onClick={() => setEditingReminder(null)} className="text-[10px] text-[#64748B] hover:text-[#E2E8F0] transition-colors">
            Anuluj
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-[#E2E8F0] font-medium text-xl">Dziś</h1>
        <span className="font-mono text-[11px] text-[#64748B]">{formatDate(dzis)}</span>
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="section-label">Przypomnienia</span>
          {przypomnienia.length > 0 && (
            <span className="bg-[#22D4F0] text-[#050810] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {przypomnienia.length}
            </span>
          )}
        </div>
        {przypomnienia.length === 0 ? (
          <div className="card p-5 text-center text-[#64748B] text-xs">Brak przypomnień na dziś</div>
        ) : (
          <div className="flex flex-col gap-2">
            {przypomnienia.map(k => <KartaKontaktu key={k.id} k={k} wariant="przypomnienie" />)}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="section-label">Stale alerty — demo bez ruchu &gt;7 dni</span>
          {stale.length > 0 && (
            <span className="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
              {stale.length}
            </span>
          )}
        </div>
        {stale.length === 0 ? (
          <div className="card p-5 text-center text-[#64748B] text-xs">Brak stale alertów</div>
        ) : (
          <div className="flex flex-col gap-2">
            {stale.map(k => <KartaKontaktu key={k.id} k={k} wariant="stale" />)}
          </div>
        )}
      </section>
    </div>
  )
}
