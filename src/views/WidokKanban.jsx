import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import { edytujKontakt } from '../utils/storage'
import { STATUS_LABELS, STATUS_COLUMN_COLORS, KANBAN_STATUSY, formatDate, today } from '../utils/helpers'

const RZAD_1 = KANBAN_STATUSY.slice(0, 5)
const RZAD_2 = KANBAN_STATUSY.slice(5)

export default function WidokKanban() {
  const { kontakty, odswierz } = useKontakty()
  const navigate = useNavigate()
  const [draggedId, setDraggedId] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const aktywne = kontakty.filter(k => k.status !== 'archiwum')

  const handleDragStart = (e, id) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e, nowyStatus) => {
    e.preventDefault()
    setDragOver(null)
    if (!draggedId) return
    const kontakt = kontakty.find(k => k.id === draggedId)
    if (!kontakt || kontakt.status === nowyStatus) { setDraggedId(null); return }
    const dane = { status: nowyStatus, dataOstatniegoKontaktu: today() }
    if (!kontakt.tor) {
      if (nowyStatus === 'proby_kontaktu') dane.tor = 'nie_odbiera'
      if (['w_kontakcie', 'prosi_o_maila', 'mail_wyslany', 'demo_umowione', 'po_demo'].includes(nowyStatus)) dane.tor = 'rozmawial'
    }
    edytujKontakt(draggedId, dane)
    odswierz()
    setDraggedId(null)
  }

  const Kolumna = ({ status }) => {
    const karty = aktywne.filter(k => k.status === status)
    const aktywny = dragOver === status

    return (
      <div
        className={`flex flex-col rounded-lg border border-t-2 transition-colors ${STATUS_COLUMN_COLORS[status]} ${
          aktywny ? 'bg-[#091C28] border-[#22D4F0]/40' : 'bg-[#0F1218] border-[#1A2535]'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(status) }}
        onDragLeave={() => setDragOver(null)}
        onDrop={e => handleDrop(e, status)}
      >
        <div className="px-2.5 py-2 flex items-center justify-between shrink-0 border-b border-[#1A2535]">
          <span className="section-label truncate leading-tight">
            {STATUS_LABELS[status]}
          </span>
          <span className="font-mono text-[#64748B] text-[10px] ml-1 shrink-0">{karty.length}</span>
        </div>

        <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto" style={{ maxHeight: '36vh', minHeight: '3rem' }}>
          {karty.map(k => (
            <div
              key={k.id}
              draggable
              onDragStart={e => handleDragStart(e, k.id)}
              onDragEnd={() => { setDraggedId(null); setDragOver(null) }}
              onClick={() => navigate(`/kontakt/${k.id}`)}
              className={`bg-[#141921] border border-[#1A2535] rounded p-2.5 cursor-grab hover:border-[#22D4F0]/40 transition-all select-none ${
                draggedId === k.id ? 'opacity-30' : ''
              }`}
            >
              <p className="text-[11px] font-medium text-[#E2E8F0] leading-tight truncate">{k.nazwaSlonu}</p>
              {k.imie && <p className="text-[10px] text-[#64748B] truncate">{k.imie}</p>}
              {k.miasto && <p className="text-[10px] text-[#64748B] truncate">{k.miasto}</p>}
              {k.tor === 'nie_odbiera' && (
                <p className="text-[9px] text-[#F59E0B] font-mono mt-0.5">
                  {k.licznikTel}/6 · {k.licznikOutreach}/2
                </p>
              )}
              {k.dataOstatniegoKontaktu && (
                <p className="text-[9px] text-[#64748B] font-mono mt-0.5">
                  {formatDate(k.dataOstatniegoKontaktu)}
                </p>
              )}
            </div>
          ))}
          {karty.length === 0 && (
            <div className="text-[10px] text-[#64748B]/40 text-center py-3">puste</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="section-label">KANBAN</span>
        <span className="font-mono text-[#64748B] text-[11px]">{aktywne.length}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {RZAD_1.map(s => <Kolumna key={s} status={s} />)}
      </div>
      <div className="flex items-center gap-3 py-0.5">
        <div className="h-px flex-1 bg-[#1A2535]" />
        <span className="section-label">CLOSING</span>
        <div className="h-px flex-1 bg-[#1A2535]" />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {RZAD_2.map(s => <Kolumna key={s} status={s} />)}
      </div>
    </div>
  )
}
