import { useState } from 'react'
import { useSprint } from '../context/SprintContext'
import { startSprint, getLast7Sprints, getDefaultCel, resetTodaySprint } from '../utils/sprint'
import { today } from '../utils/helpers'

const DNI = ['NIE', 'PON', 'WT', 'ŚR', 'CZW', 'PT', 'SOB']

function get7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

export default function WidokSprint() {
  const { sprintDzis, odswierzSprint, setFocusModeOpen } = useSprint()
  const [celInput, setCelInput] = useState(String(getDefaultCel()))

  const handleStart = () => {
    const cel = Math.max(parseInt(celInput) || getDefaultCel(), 1)
    startSprint(cel)
    odswierzSprint()
  }

  const historiaMap = {}
  getLast7Sprints().forEach(s => { historiaMap[s.date] = s })
  if (sprintDzis) historiaMap[sprintDzis.date] = sprintDzis
  const dni7 = get7Days()
  const dzis = today()

  if (!sprintDzis) {
    return (
      <div className="p-6" style={{ maxWidth: 380 }}>
        <p className="section-label mb-6">DZIENNY SPRINT</p>
        <div className="bg-[#0F1218] border border-[#1A2535] rounded-lg p-6 mb-6">
          <label className="label text-center block mb-3">Ile telefonów planujesz dziś?</label>
          <input
            type="number"
            value={celInput}
            onChange={e => setCelInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            min={1}
            autoFocus
            style={{
              fontSize: 48,
              color: '#E2E8F0',
              background: '#141921',
              border: '1px solid #1A2535',
              padding: '12px',
              borderRadius: 8,
              width: '100%',
              textAlign: 'center',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              outline: 'none'
            }}
            onFocus={e => { e.target.style.borderColor = '#22D4F0' }}
            onBlur={e => { e.target.style.borderColor = '#1A2535' }}
          />
          <p className="text-center mb-5" style={{ fontSize: 11, color: '#64748B' }}>
            Sugerowany cel: {getDefaultCel()}
          </p>
          <button
            onClick={handleStart}
            className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-[0.08em] transition-all hover:brightness-110"
            style={{ background: '#22D4F0', color: '#050810' }}
          >
            Startuj sprint
          </button>
        </div>
        <HistoriaDni dni7={dni7} historiaMap={historiaMap} dzis={dzis} />
      </div>
    )
  }

  const { cel, wykonano, ukonczony } = sprintDzis
  const procent = Math.min((wykonano / cel) * 100, 100)

  return (
    <div style={{ maxWidth: 520 }} className="p-6">
      <p className="section-label mb-6">DZIENNY SPRINT</p>

      <div className="bg-[#0F1218] border border-[#1A2535] rounded-xl p-10 mb-5 text-center">
        {ukonczony && (
          <p className="text-xs font-semibold tracking-[0.1em] uppercase mb-4" style={{ color: '#10B981' }}>
            Sprint ukończony
          </p>
        )}

        <div className="flex items-baseline justify-center gap-2 mb-5">
          <span
            key={wykonano}
            className="font-mono font-bold animate-entry"
            style={{
              fontSize: 80,
              lineHeight: 1,
              color: ukonczony ? '#10B981' : '#E2E8F0',
              textShadow: ukonczony
                ? '0 0 24px rgba(16,185,129,0.4)'
                : '0 0 24px rgba(226,232,240,0.1)'
            }}
          >
            {wykonano}
          </span>
          <span className="font-mono" style={{ fontSize: 44, color: '#1A2535' }}>/</span>
          <span className="font-mono" style={{ fontSize: 44, color: '#64748B' }}>{cel}</span>
        </div>

        <div className="mx-auto max-w-xs mb-6">
          <div className="h-[4px] bg-[#141921] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full`}
              style={{
                '--fill-w': `${procent}%`,
                width: 0,
                animation: 'fillBar 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s forwards',
                background: ukonczony ? '#10B981' : '#22D4F0',
                boxShadow: ukonczony
                  ? '0 0 8px rgba(16,185,129,0.6)'
                  : '0 0 8px rgba(34,212,240,0.6)'
              }}
            />
          </div>
        </div>

        <button onClick={() => setFocusModeOpen(true)} className="btn-primary px-10 py-2.5">
          ▶ Focus Mode
        </button>

        <div className="mt-5">
          <button
            onClick={() => { resetTodaySprint(); odswierzSprint() }}
            className="text-[10px] transition-colors"
            style={{ color: '#64748B' }}
            onMouseEnter={e => { e.target.style.color = '#EF4444' }}
            onMouseLeave={e => { e.target.style.color = '#64748B' }}
          >
            Resetuj sprint
          </button>
        </div>
      </div>

      <HistoriaDni dni7={dni7} historiaMap={historiaMap} dzis={dzis} />
    </div>
  )
}

function HistoriaDni({ dni7, historiaMap, dzis }) {
  return (
    <div style={{ maxWidth: 380 }}>
      <p className="section-label mb-3">OSTATNIE 7 DNI</p>
      <div className="flex gap-1.5">
        {dni7.map(dateStr => {
          const sprint = historiaMap[dateStr]
          const jest = Boolean(sprint)
          const ukonczony = sprint?.ukonczony
          const jestDzis = dateStr === dzis

          const d = new Date(dateStr)
          const dzienNazwa = DNI[d.getDay()]

          let bg, border, labelColor, numColor
          if (ukonczony) {
            bg = '#091C28'; border = '#22D4F0'; labelColor = '#22D4F0'; numColor = '#22D4F0'
          } else if (jestDzis && jest) {
            bg = '#0C1520'; border = '#22D4F0'; labelColor = '#22D4F0'; numColor = '#E2E8F0'
          } else {
            bg = '#0F1218'; border = '#1A2535'; labelColor = '#64748B'; numColor = '#64748B'
          }

          return (
            <div
              key={dateStr}
              style={{
                flex: 1, height: 48, borderRadius: 4, border: `1px solid ${border}`,
                background: bg, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 8, letterSpacing: '0.06em', color: labelColor, lineHeight: 1 }}>
                {dzienNazwa}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: numColor, lineHeight: 1, marginTop: 2 }}>
                {jest ? `${sprint.wykonano}/${sprint.cel}` : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
