import { useKontakty } from '../context/KontaktyContext'

const CEL = 10000
const DEFAULT_WARTOSC = 4000
const WAGI = { demo_umowione: 0.30, po_demo: 0.60, zamkniete_tak: 1.00 }

export default function ProgressBar() {
  const { kontakty } = useKontakty()

  const wartosc = kontakty.reduce((sum, k) => {
    const waga = WAGI[k.status]
    if (!waga) return sum
    return sum + (k.wartoscKontraktu || DEFAULT_WARTOSC) * waga
  }, 0)

  const procent = Math.min((wartosc / CEL) * 100, 100)
  const osiagniety = wartosc >= CEL
  const brakuje = Math.max(CEL - wartosc, 0)

  return (
    <div className="bg-[#080B10] border-b border-[#1A2535] px-5 flex items-center gap-4 shrink-0 h-10">
      <span className="section-label shrink-0">CEL 10K PLN</span>

      <div className="flex-1 h-[3px] bg-[#141921] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${osiagniety ? 'bg-[#10B981]' : 'bg-[#22D4F0]'}`}
          style={{
            '--fill-w': `${procent}%`,
            width: 0,
            animation: 'fillBar 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s forwards',
            boxShadow: osiagniety
              ? '0 0 6px rgba(16,185,129,0.6)'
              : '0 0 6px rgba(34,212,240,0.6)'
          }}
        />
      </div>

      <span
        className="font-mono text-[12px] shrink-0"
        style={{
          color: osiagniety ? '#10B981' : '#22D4F0',
          textShadow: osiagniety
            ? '0 0 8px rgba(16,185,129,0.5)'
            : '0 0 8px rgba(34,212,240,0.5)'
        }}
      >
        {Math.round(wartosc).toLocaleString('pl-PL')} PLN
      </span>

      <span className="text-[10px] font-mono shrink-0" style={{ color: '#64748B' }}>
        {osiagniety
          ? '// CEL OSIAGNIETY'
          : `// -${Math.round(brakuje).toLocaleString('pl-PL')}`}
      </span>
    </div>
  )
}
