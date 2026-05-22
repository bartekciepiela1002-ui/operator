export const today = () => new Date().toISOString().split('T')[0]

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
  do_zadzwonienia: 'bg-gray-100 text-gray-700 border-gray-200',
  proby_kontaktu: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  w_kontakcie: 'bg-blue-100 text-blue-800 border-blue-200',
  prosi_o_maila: 'bg-purple-100 text-purple-800 border-purple-200',
  mail_wyslany: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  demo_umowione: 'bg-orange-100 text-orange-800 border-orange-200',
  po_demo: 'bg-amber-100 text-amber-800 border-amber-200',
  zamkniete_tak: 'bg-green-100 text-green-800 border-green-200',
  zamkniete_nie: 'bg-red-100 text-red-800 border-red-200',
  odlozone: 'bg-stone-100 text-stone-700 border-stone-200',
  archiwum: 'bg-gray-200 text-gray-600 border-gray-300'
}

export const STATUS_COLUMN_COLORS = {
  do_zadzwonienia: 'border-t-gray-400',
  proby_kontaktu: 'border-t-yellow-400',
  w_kontakcie: 'border-t-blue-500',
  prosi_o_maila: 'border-t-purple-500',
  mail_wyslany: 'border-t-indigo-500',
  demo_umowione: 'border-t-orange-500',
  po_demo: 'border-t-amber-500',
  zamkniete_tak: 'border-t-green-500',
  zamkniete_nie: 'border-t-red-500',
  odlozone: 'border-t-stone-400'
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
