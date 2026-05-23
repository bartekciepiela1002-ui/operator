import { STATUS_LABELS, STATUS_COLORS } from '../utils/helpers'
export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-medium uppercase tracking-[0.06em] ${STATUS_COLORS[status] || 'bg-[#0F1218] text-[#64748B] border-[#1A2535]'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
