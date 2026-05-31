export function migrateIfNeeded() {
  if (localStorage.getItem('operator_contacts')) return

  const stareKontakty = localStorage.getItem('crm_kontakty')
  if (stareKontakty) {
    localStorage.setItem('operator_contacts', stareKontakty)
  }

  const staryChallenge = localStorage.getItem('challenge_v1')
  if (staryChallenge) {
    try {
      const parsed = JSON.parse(staryChallenge)
      localStorage.setItem('operator_challenge', JSON.stringify({
        startDate: parsed.startDate || null,
        streakCurrent: 0,
        streakBest: 0,
      }))
    } catch {}
  }

  const staryTimer = localStorage.getItem('stoper_v1')
  if (staryTimer) {
    localStorage.setItem('operator_timer', staryTimer)
  }
}
