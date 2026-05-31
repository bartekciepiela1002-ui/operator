import { NavLink } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import { useSprint } from '../context/SprintContext'
import { useOperator } from '../context/OperatorContext'
import { today, getDzisiajLokalnie } from '../utils/helpers'
import {
  IconPlayerPlay, IconSun, IconLayoutKanban, IconList, IconChartBar,
  IconArchive, IconCalendarWeek, IconSettings, IconTrophy, IconClock,
} from '@tabler/icons-react'

function policzAktywneNudges() {
  try {
    const raw = localStorage.getItem(`operator_nudges_${getDzisiajLokalnie()}`)
    if (!raw) return 0
    const { nudges } = JSON.parse(raw)
    return (nudges || []).filter(n => n.typ === 'warning' || n.typ === 'action').length
  } catch {
    return 0
  }
}

export default function Sidebar({ onDodaj, onImport }) {
  const { kontakty } = useKontakty()
  const { sprintDzis, setFocusModeOpen } = useSprint()
  const { challengeState, timerState, aktualnyLevel } = useOperator()
  const dzis = today()

  const przypomnienia = kontakty.filter(
    k => k.dataPrzypomnienia === dzis && k.status !== 'archiwum'
  ).length

  const navCls = ({ isActive }) =>
    `flex items-center gap-3 px-[18px] py-[10px] text-[13px] font-medium transition-all border-l-2 ${
      isActive
        ? 'text-[#22D4F0] bg-[#091C28] border-[#22D4F0]'
        : 'text-[#64748B] border-transparent hover:text-[#E2E8F0] hover:bg-[#0C1520]'
    }`

  const sprintAktywny = sprintDzis && (sprintDzis.sprintCel || 0) > 0
  const sprintBadge = sprintAktywny ? (
    <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 font-mono ${
      sprintDzis.sprintUkonczony
        ? 'bg-[#001A0E] text-[#10B981]'
        : 'bg-[#091C28] text-[#22D4F0]'
    }`}>
      {sprintDzis.sprintUkonczony ? '✓' : `${sprintDzis.sprintWykonano}/${sprintDzis.sprintCel}`}
    </span>
  ) : null

  const focusBtn = sprintAktywny ? (
    <button
      onClick={() => setFocusModeOpen(true)}
      title="Focus Mode"
      className="ml-1 w-7 h-7 flex items-center justify-center text-[#22D4F0] hover:bg-[#0C1520] rounded transition-colors shrink-0"
    >
      <IconPlayerPlay size={14} />
    </button>
  ) : null

  const przypomnieniaBadge = przypomnienia > 0 ? (
    <span className="bg-[#22D4F0] text-[#050810] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
      {przypomnienia}
    </span>
  ) : null

  const nudgesCount = policzAktywneNudges()
  const nudgesBadge = nudgesCount > 0 ? (
    <span
      className="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
    >
      {nudgesCount}
    </span>
  ) : null

  // Badge dla /challenge: "Dzień X/30" lub level
  const challengeAktywny = challengeState?.aktywny ?? true
  const dayNumber = challengeAktywny && challengeState?.startDate
    ? Math.floor((Date.now() - new Date(challengeState.startDate).getTime()) / 86400000) + 1
    : null
  const challengeBadge = dayNumber !== null ? (
    <span className="text-[10px] font-mono text-[#64748B]">
      {dayNumber}/30
    </span>
  ) : null

  // Badge dla /stoper: aktywna kategoria
  const timerAktywny = timerState?.activeCategory
  const stoperBadge = timerAktywny ? (
    <span
      className="text-[10px] rounded px-1.5 py-0.5 font-mono"
      style={{ background: 'rgba(34,212,240,0.1)', color: '#22D4F0' }}
    >
      ●
    </span>
  ) : null

  return (
    <aside className="w-[220px] bg-[#080B10] border-r border-[#1A2535] flex flex-col h-full py-5 shrink-0">
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: '#22D4F0', boxShadow: '0 0 6px rgba(34,212,240,0.8)' }}
          />
          <div
            className="text-[13px] font-bold uppercase tracking-[0.18em] font-mono"
            style={{ color: '#22D4F0', textShadow: '0 0 10px rgba(34,212,240,0.45)' }}
          >
            OUTREACH
          </div>
        </div>
        <div className="text-[10px] pl-3.5" style={{ color: '#64748B', letterSpacing: '0.08em' }}>
          cold CRM · solo
        </div>
        <div className="mt-3 h-px" style={{ background: 'linear-gradient(90deg, rgba(34,212,240,0.25) 0%, transparent 100%)' }} />
      </div>

      <nav className="flex flex-col flex-1">
        {/* 1. Dziś */}
        <NavLink to="/dzis" className={navCls}>
          <IconSun size={15} />
          <span className="flex-1">Dziś</span>
          {nudgesBadge}
          {przypomnieniaBadge}
        </NavLink>

        {/* 2. Challenge */}
        <NavLink to="/challenge" className={navCls}>
          <IconTrophy size={15} />
          <span className="flex-1">Challenge</span>
          {challengeBadge}
        </NavLink>

        {/* 3. Sprint */}
        <div className="flex items-center">
          <NavLink to="/sprint" style={{ flex: 1 }} className={navCls}>
            <IconPlayerPlay size={15} />
            <span className="flex-1">Sprint</span>
            {sprintBadge}
          </NavLink>
          {focusBtn}
        </div>

        {/* 4. Kanban */}
        <NavLink to="/kanban" className={navCls}>
          <IconLayoutKanban size={15} />
          <span>Kanban</span>
        </NavLink>

        {/* 5. Lista */}
        <NavLink to="/lista" className={navCls}>
          <IconList size={15} />
          <span>Lista</span>
        </NavLink>

        {/* 6. Statystyki */}
        <NavLink to="/statystyki" className={navCls}>
          <IconChartBar size={15} />
          <span>Statystyki</span>
        </NavLink>

        {/* 7. Archiwum */}
        <NavLink to="/archiwum" className={navCls}>
          <IconArchive size={15} />
          <span>Archiwum</span>
        </NavLink>

        {/* 8. Digest */}
        <NavLink to="/digest" className={navCls}>
          <IconCalendarWeek size={15} />
          <span>Digest</span>
        </NavLink>

        {/* 9. Stoper */}
        <NavLink to="/stoper" className={navCls}>
          <IconClock size={15} />
          <span className="flex-1">Stoper</span>
          {stoperBadge}
        </NavLink>

        <div className="mt-auto pt-3 border-t border-[#1A2535] mx-[18px]" />

        {/* 10. Ustawienia */}
        <NavLink to="/ustawienia" className={navCls}>
          <IconSettings size={15} />
          <span>Ustawienia</span>
        </NavLink>
      </nav>

      <div className="px-4 flex flex-col gap-2 pt-4 border-t border-[#1A2535] mt-4">
        <button
          onClick={onDodaj}
          className="w-full bg-[#22D4F0] text-[#050810] font-bold uppercase rounded-lg px-3 py-2 text-[12px] tracking-[0.08em] hover:brightness-110 transition-all text-center"
        >
          + Dodaj kontakt
        </button>
        <button
          onClick={onImport}
          className="w-full btn-ghost text-[12px] rounded-lg px-3 py-2"
        >
          Importuj CSV
        </button>
      </div>
    </aside>
  )
}
