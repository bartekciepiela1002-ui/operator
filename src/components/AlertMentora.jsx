import { useNavigate } from 'react-router-dom'

export default function AlertMentora() {
  const navigate = useNavigate()
  const maKlucz = Boolean(localStorage.getItem('crm_anthropic_key'))

  if (maKlucz) return null

  return (
    <div
      className="flex items-center justify-between gap-4 mb-5 text-xs"
      style={{
        background: '#1F1800',
        border: '1px solid #F59E0B',
        borderRadius: 8,
        padding: '10px 16px',
        color: '#F59E0B'
      }}
    >
      <span>
        AI Mentor nieaktywny — dodaj klucz API w Ustawieniach aby odblokować inteligentne briefy, alerty i misje.
      </span>
      <button
        onClick={() => navigate('/ustawienia')}
        className="shrink-0 font-medium hover:brightness-125 transition-all"
        style={{ color: '#F59E0B' }}
      >
        Przejdź do Ustawień →
      </button>
    </div>
  )
}
