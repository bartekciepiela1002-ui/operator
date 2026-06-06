export const today = () => new Date().toISOString().split('T')[0]

export function getDzisiajLokalnie() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export const addMonths = (dateStr, months) => {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

export const daysDiff = (dateStr) => {
  if (!dateStr) return Infinity
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export const STATUS_LABELS = {
  do_zadzwonienia: 'Do zadzwonienia',
  proby_kontaktu: 'Próby kontaktu',
  w_kontakcie: 'W kontakcie',
  prosi_o_maila: 'Prosi o maila',
  mail_wyslany: 'Mail wysłany',
  demo_umowione: 'Demo umówione',
  po_demo: 'Po demo',
  zamkniete_tak: 'Zamknięte ✓',
  zamkniete_nie: 'Zamknięte ✗',
  odlozone: 'Odłożone',
  archiwum: 'Archiwum'
}

export const STATUS_COLORS = {
  do_zadzwonienia: 'bg-[#0C1520] text-[#64748B] border-[#1A2535]',
  proby_kontaktu:  'bg-[#1A1200] text-[#F59E0B] border-[#3D2800]',
  w_kontakcie:     'bg-[#001A28] text-[#22D4F0] border-[#003A56]',
  prosi_o_maila:   'bg-[#1A0028] text-[#A78BFA] border-[#3D0056]',
  mail_wyslany:    'bg-[#001428] text-[#60A5FA] border-[#002856]',
  demo_umowione:   'bg-[#1A0A00] text-[#FB923C] border-[#3D1A00]',
  po_demo:         'bg-[#1A1000] text-[#FBBF24] border-[#3D2800]',
  zamkniete_tak:   'bg-[#001A0E] text-[#10B981] border-[#003D1E]',
  zamkniete_nie:   'bg-[#1A0000] text-[#EF4444] border-[#3D0000]',
  odlozone:        'bg-[#0F1218] text-[#94A3B8] border-[#1A2535]',
  archiwum:        'bg-[#0B0D12] text-[#2A3B4C] border-[#1A2535]'
}

export const STATUS_COLUMN_COLORS = {
  do_zadzwonienia: 'border-t-[#2A3B4C]',
  proby_kontaktu:  'border-t-[#F59E0B]',
  w_kontakcie:     'border-t-[#22D4F0]',
  prosi_o_maila:   'border-t-[#A78BFA]',
  mail_wyslany:    'border-t-[#60A5FA]',
  demo_umowione:   'border-t-[#FB923C]',
  po_demo:         'border-t-[#FBBF24]',
  zamkniete_tak:   'border-t-[#10B981]',
  zamkniete_nie:   'border-t-[#EF4444]',
  odlozone:        'border-t-[#94A3B8]'
}

export const POWOD_LABELS = {
  za_drogo: 'Za drogo',
  zly_moment: 'Zły moment',
  ma_kogos: 'Ma kogoś',
  brak_decyzji: 'Brak decyzji',
  nie_zainteresowana: 'Nie zainteresowana',
  inne: 'Inne'
}

export const ZRODLO_LABELS = {
  google_maps: 'Google Maps',
  polecenie: 'Polecenie',
  inne: 'Inne'
}

export const PORA_LABELS = {
  rano: 'Rano',
  po17: 'Po 17:00'
}

export const BRANZA_LABELS = {
  fryzjerski:  'Fryzjerski',
  kosmetyczny: 'Kosmetyczny',
  paznokcie:   'Paznokcie',
  spa_masaz:   'SPA / Masaż',
  barber:      'Barber',
  medycyna_es: 'Medycyna estetyczna',
  inne:        'Inne',
}

export const KANBAN_STATUSY = [
  'do_zadzwonienia',
  'proby_kontaktu',
  'w_kontakcie',
  'prosi_o_maila',
  'mail_wyslany',
  'demo_umowione',
  'po_demo',
  'zamkniete_tak',
  'zamkniete_nie',
  'odlozone'
]

// Allowed next actions per status (not status transitions — action names)
export const DOSTEPNE_AKCJE = {
  do_zadzwonienia: ['nie_odbiera', 'rozmawial'],
  proby_kontaktu: ['nie_odbiera', 'outreach', 'rozmawial'],
  w_kontakcie: ['prosi_o_maila', 'demo_umowione', 'zamkniete_tak', 'zamkniete_nie', 'odlozone'],
  prosi_o_maila: ['mail_wyslany', 'demo_umowione', 'zamkniete_tak', 'zamkniete_nie', 'odlozone'],
  mail_wyslany: ['demo_umowione', 'zamkniete_tak', 'zamkniete_nie', 'odlozone'],
  demo_umowione: ['po_demo', 'zamkniete_tak', 'zamkniete_nie', 'odlozone'],
  po_demo: ['zamkniete_tak', 'zamkniete_nie', 'odlozone'],
  zamkniete_tak: [],
  zamkniete_nie: [],
  odlozone: ['rozmawial', 'nie_odbiera'],
  archiwum: []
}
