import { NavLink } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import { today } from '../utils/helpers'

export default function Sidebar({ onDodaj, onImport }) {
  const { kontakty } = useKontakty()
  const dzis = today()
  const przypomnienia = kontakty.filter(
    k => k.dataPrzypomnienia === dzis && k.status !== 'archiwum'
  ).length

  const navItem = (to, label, badge) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <span>{label}</span>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </NavLink>
  )

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full py-5 px-3 shrink-0">
      <div className="flex items-center gap-2 px-1 mb-6">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">C</div>
        <span className="font-bold text-gray-900">CRM Salony</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItem('/dzis', 'Dziś', przypomnienia)}
        {navItem('/kanban', 'Kanban')}
        {navItem('/lista', 'Lista')}
        {navItem('/statystyki', 'Statystyki')}
        {navItem('/archiwum', 'Archiwum')}
      </nav>

      <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 mt-4">
        <button
          onClick={onDodaj}
          className="w-full bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors text-left"
        >
          + Dodaj kontakt
        </button>
        <button
          onClick={onImport}
          className="w-full bg-white text-gray-600 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors text-left"
        >
          Importuj CSV
        </button>
      </div>
    </aside>
  )
}
