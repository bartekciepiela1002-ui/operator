import { NavLink } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import { useSprint } from '../context/SprintContext'
import { today } from '../utils/helpers'
import { IconPlayerPlay, IconSun, IconLayoutKanban, IconList, IconChartBar, IconArchive, IconCalendarWeek, IconSettings } from '@tabler/icons-react'

export default function Sidebar({ onDodaj, onImport }) {
  const { kontakty } = useKontakty()
  const { sprintDzis, setFocusModeOpen } = useSprint()
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

  const sprintBadge = sprintDzis ? (
    <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 font-mono ${
      sprintDzis.ukonczony
        ? 'bg-[#001A0E] text-[#10B981]'
        : 'bg-[#091C28] text-[#22D4F0]'
    }`}>
      {sprintDzis.wykonano}/{sprintDzis.cel}
    </span>
  ) : null

  const focusBtn = sprintDzis ? (
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
        <NavLink to="/dzis" className={navCls}>
          <IconSun size={15} />
          <span className="flex-1">Dziś</span>
          {przypomnieniaBadge}
        </NavLink>

        <div className="flex items-center">
          <NavLink to="/sprint" style={{ flex: 1 }} className={navCls}>
            <IconPlayerPlay size={15} />
            <span className="flex-1">Sprint</span>
            {sprintBadge}
          </NavLink>
          {focusBtn}
        </div>

        <NavLink to="/kanban" className={navCls}>
          <IconLayoutKanban size={15} />
          <span>Kanban</span>
        </NavLink>

        <NavLink to="/lista" className={navCls}>
          <IconList size={15} />
          <span>Lista</span>
        </NavLink>

        <NavLink to="/statystyki" className={navCls}>
          <IconChartBar size={15} />
          <span>Statystyki</span>
        </NavLink>

        <NavLink to="/archiwum" className={navCls}>
          <IconArchive size={15} />
          <span>Archiwum</span>
        </NavLink>

        <NavLink to="/digest" className={navCls}>
          <IconCalendarWeek size={15} />
          <span>Digest</span>
        </NavLink>

        <div className="mt-auto pt-3 border-t border-[#1A2535] mx-[18px]" />

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
