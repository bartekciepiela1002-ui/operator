import { useNavigate } from 'react-router-dom'
import { useOperator } from '../context/OperatorContext'

function formatSeconds(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TimerBubble() {
  const navigate = useNavigate()
  const { timerState, elapsedSeconds, stopKategoria } = useOperator()
  const aktywna = timerState?.activeCategory

  const totalSecs = aktywna
    ? Math.floor((timerState.todayTimes[aktywna] || 0) * 60) + elapsedSeconds
    : 0

  if (!aktywna) {
    return (
      <button
        onClick={() => navigate('/stoper')}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full
                   bg-[#0C1520] border border-[#1A2535]
                   flex items-center justify-center
                   text-[#64748B] hover:text-[#22D4F0] transition-colors z-50"
        title="Stoper"
      >
        ⏱
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50
                 bg-[#0C1520] border border-[#22D4F0]/30
                 rounded-lg px-3 py-2 flex items-center gap-3
                 shadow-lg cursor-pointer"
      onClick={() => navigate('/stoper')}
    >
      <div className="w-2 h-2 rounded-full bg-[#22D4F0] animate-pulse" />
      <span className="text-[11px] text-[#64748B] truncate max-w-[100px]">
        {aktywna.replace(/_/g, ' ')}
      </span>
      <span className="font-mono text-[13px] text-[#E2E8F0]">
        {formatSeconds(totalSecs)}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); stopKategoria() }}
        className="text-[#64748B] hover:text-[#EF4444] transition-colors ml-1"
        title="Stop"
      >
        ■
      </button>
    </div>
  )
}
