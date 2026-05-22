import { STATUS_LABELS, STATUS_COLORS } from '../utils/helpers'

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
