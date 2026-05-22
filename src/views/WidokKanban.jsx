import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import StatusBadge from '../components/StatusBadge'
import { edytujKontakt } from '../utils/storage'
import {
  STATUS_LABELS, STATUS_COLUMN_COLORS, KANBAN_STATUSY, formatDate, today
} from '../utils/helpers'

export default function WidokKanban() {
  const { kontakty, odswierz } = useKontakty()
  const navigate = useNavigate()
  const [draggedId, setDraggedId] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const aktywne = kontakty.filter(k => k.status !== 'archiwum')

  const kolumny = KANBAN_STATUSY.map(status => ({
    status,
    karty: aktywne.filter(k => k.status === status)
  }))

  const handleDragStart = (e, id) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(status)
  }

  const handleDrop = (e, nowyStatus) => {
    e.preventDefault()
    setDragOver(null)
    if (!draggedId) return
    const kontakt = kontakty.find(k => k.id === draggedId)
    if (!kontakt || kontakt.status === nowyStatus) { setDraggedId(null); return }
    // Nie pozwalaj przenosić do archiwum
    if (nowyStatus === 'archiwum') { setDraggedId(null); return }

    const dane = { status: nowyStatus, dataOstatniegoKontaktu: today() }
    // Ustaw tor jeśli brak
    if (!kontakt.tor) {
      if (['proby_kontaktu'].includes(nowyStatus)) dane.tor = 'nie_odbiera'
      if (['w_kontakcie', 'prosi_o_maila', 'mail_wyslany', 'demo_umowione', 'po_demo'].includes(nowyStatus)) {
        dane.tor = 'rozmawial'
      }
    }

    edytujKontakt(draggedId, dane)
    odswierz()
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOver(null)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-baseline gap-3 mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Kanban</h1>
        <span className="text-sm text-gray-400">{aktywne.length} aktywnych kontaktów</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 flex-1 items-start">
        {kolumny.map(({ status, karty }) => (
          <div
            key={status}
            className={`shrink-0 w-52 flex flex-col rounded-xl border-t-4 bg-gray-50 border border-gray-200 transition-colors ${
              STATUS_COLUMN_COLORS[status]
            } ${dragOver === status ? 'bg-indigo-50 border-indigo-200' : ''}`}
            onDragOver={e => handleDragOver(e, status)}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, status)}
          >
            {/* Nagłówek kolumny */}
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 truncate">
                {STATUS_LABELS[status]}
              </span>
              <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {karty.length}
              </span>
            </div>

            {/* Karty */}
            <div className="flex flex-col gap-2 px-2 pb-2 min-h-16">
              {karty.map(k => (
                <div
                  key={k.id}
                  draggable
                  onDragStart={e => handleDragStart(e, k.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(`/kontakt/${k.id}`)}
                  className={`bg-white border border-gray-200 rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-sm transition-all select-none ${
                    draggedId === k.id ? 'opacity-40' : ''
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-900 leading-tight truncate">
                    {k.nazwaSlonu}
                  </p>
                  {k.imie && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{k.imie}</p>
                  )}
                  {k.miasto && (
                    <p className="text-xs text-gray-400 truncate">{k.miasto}</p>
                  )}
                  {k.tor === 'nie_odbiera' && (
                    <p className="text-xs text-yellow-600 mt-1 font-medium">
                      {k.licznikTel}/6 · {k.licznikOutreach}/2
                    </p>
                  )}
                  {k.dataOstatniegoKontaktu && (
                    <p className="text-xs text-gray-300 mt-1">
                      {formatDate(k.dataOstatniegoKontaktu)}
                    </p>
                  )}
                </div>
              ))}
              {karty.length === 0 && (
                <div className="text-xs text-gray-300 text-center py-4">puste</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
