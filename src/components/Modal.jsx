import { useEffect } from 'react'
export default function Modal({ title, children, onClose, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(5,8,16,0.88)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`bg-[#0F1218] border border-[#1A2535] rounded-xl shadow-2xl w-full ${widths[size]} max-h-[90vh] flex flex-col animate-entry`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2535] shrink-0">
          <span className="section-label">{title}</span>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#E2E8F0] text-xl leading-none w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-[#141921]">×</button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
