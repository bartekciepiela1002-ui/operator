import { useState } from 'react'
import { useOperator } from '../context/OperatorContext'

const STATUS_ICON = {
  zaliczony: { icon: '✓', cls: 'text-[#10B981]' },
  mocno_zaliczony: { icon: '★', cls: 'text-[#22D4F0]' },
  urlopowy: { icon: '○', cls: 'text-[#94A3B8]' },
  niezaliczony: { icon: '✗', cls: 'text-[#EF4444]' },
}

export default function DayStatusBar() {
  const { dzisiejszyDzien, challengeState, aktualnyLevel } = useOperator()

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('operator_statusbar_collapsed') === '1'
  })

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('operator_statusbar_collapsed', next ? '1' : '0')
  }

  // Oblicz numer dnia challengeu
  const dayNumber = challengeState?.startDate
    ? Math.floor((Date.now() - new Date(challengeState.startDate).getTime()) / 86400000) + 1
    : null

  const streak = challengeState?.streakCurrent ?? 0
  const status = dzisiejszyDzien?.status ?? null
  const sprintWykonano = dzisiejszyDzien?.sprintWykonano ?? 0
  const pracaMin = dzisiejszyDzien?.pracaWlasciwaMin ?? 0

  const godz = new Date().getHours()
  const alertBrakKontaktu = godz >= 16 && sprintWykonano === 0
  const alertMaloPracy = godz >= 17 && pracaMin < 120

  const statusInfo = status ? STATUS_ICON[status] : null

  if (!(challengeState?.aktywny ?? true)) return null

  if (collapsed) {
    return (
      <div className="h-6 bg-[#0C1520] border-b border-[#1A2535] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
          {(alertBrakKontaktu || alertMaloPracy) && (
            <span className="text-[#F59E0B]">⚠</span>
          )}
          {statusInfo && (
            <span className={statusInfo.cls}>{statusInfo.icon}</span>
          )}
        </div>
        <button
          onClick={toggle}
          className="text-[10px] text-[#64748B] hover:text-[#22D4F0] transition-colors"
          title="Rozwiń pasek"
        >
          ▾
        </button>
      </div>
    )
  }

  return (
    <div className="h-8 bg-[#0C1520] border-b border-[#1A2535] flex items-center px-4 gap-5 flex-shrink-0 overflow-hidden">
      {/* Dzień X/30 */}
      {dayNumber !== null && (
        <span className="text-[11px] text-[#64748B]">
          Dzień <span className="text-[#E2E8F0] font-mono">{dayNumber}</span>
          <span className="text-[#1A2535]">/30</span>
        </span>
      )}

      {/* Streak */}
      <span className="text-[11px] text-[#64748B]">
        🔥 <span className="text-[#22D4F0] font-mono font-bold">{streak}</span>
      </span>

      {/* Level */}
      {aktualnyLevel > 0 && (
        <span className="text-[10px] bg-[#091C28] border border-[#22D4F0]/20 text-[#22D4F0] rounded px-1.5 py-0.5 font-mono">
          Lvl {aktualnyLevel}
        </span>
      )}

      {/* Status dnia */}
      {statusInfo ? (
        <span className={`text-[11px] font-medium ${statusInfo.cls}`}>
          {statusInfo.icon} {
            { zaliczony: 'Zaliczony', mocno_zaliczony: 'Mocno zaliczony', urlopowy: 'Urlopowy', niezaliczony: 'Niezaliczony' }[status]
          }
        </span>
      ) : (
        <span className="text-[11px] text-[#1A2535]">— brak oceny</span>
      )}

      {/* Alerty */}
      {alertBrakKontaktu && (
        <span className="text-[10px] text-[#F59E0B] font-medium">
          ⚠ Brak kontaktu z rynkiem
        </span>
      )}
      {alertMaloPracy && (
        <span className="text-[10px] text-[#F59E0B] font-medium">
          ⚠ Mało pracy
        </span>
      )}

      <button
        onClick={toggle}
        className="ml-auto text-[10px] text-[#1A2535] hover:text-[#64748B] transition-colors"
        title="Zwiń pasek"
      >
        ▴
      </button>
    </div>
  )
}
