import { useEffect } from 'react'
import { useOperator } from '../context/OperatorContext'
import { KATEGORIE_PRACA, KATEGORIE_NAUKA, KATEGORIE_INNE } from '../utils/rules'

// ─── Alarm ───────────────────────────────────────────────────────────────────

function grajAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.5)
  } catch {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ZADANIA_COUNTDOWN = [
  { key: 'poprawa_oferty',   label: 'Poprawa oferty',   limit: 45 },
  { key: 'montaz_filmu',     label: 'Montaż filmu',     limit: 60 },
  { key: 'opis_posta',       label: 'Opis posta',       limit: 30 },
  { key: 'sekcja_strony',    label: 'Sekcja strony',    limit: 90 },
  { key: 'analiza_kampanii', label: 'Analiza kampanii', limit: 30 },
]

const GRUPY = [
  { label: 'Praca właściwa', kategorie: KATEGORIE_PRACA },
  { label: 'Nauka (max 60 min)', kategorie: KATEGORIE_NAUKA },
  { label: 'Inne', kategorie: KATEGORIE_INNE },
]

function formatSeconds(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatMin(min) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m} min`
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WidokStoper() {
  const {
    timerState, elapsedSeconds,
    startKategoria, stopKategoria,
    startCountdown, stopCountdown,
  } = useOperator()

  const aktywna = timerState?.activeCategory
  const todayTimes = timerState?.todayTimes || {}
  const countdowns = timerState?.countdowns || {}

  // Sprawdzaj countdown co sekundę
  useEffect(() => {
    const now = Date.now()
    for (const [key, c] of Object.entries(countdowns)) {
      const elapsed = (now - c.startedAt) / 60000
      if (elapsed >= c.limitMin) {
        grajAlarm()
        stopCountdown(key)
      }
    }
  }, [elapsedSeconds])

  // Sumy czasu dla podsumowania
  let pracaMin = 0, naukaMin = 0, treningMin = 0
  for (const [cat, min] of Object.entries(todayTimes)) {
    if (KATEGORIE_PRACA.includes(cat)) pracaMin += min
    else if (KATEGORIE_NAUKA.includes(cat)) naukaMin += min
    else if (KATEGORIE_INNE.includes(cat)) treningMin += min
  }
  const pracaH = Math.round(pracaMin * 10) / 10

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      {/* ── Sekcja 1: Aktywna sesja ── */}
      <section className={`bg-[#0F1218] border rounded-xl p-6 text-center transition-all ${
        aktywna ? 'border-[#22D4F0]/40' : 'border-[#1A2535]'
      }`}>
        {aktywna ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22D4F0] animate-pulse" />
              <span className="text-[#64748B] text-sm uppercase tracking-[0.1em]">
                {aktywna.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="font-mono font-bold text-[#E2E8F0] mb-4" style={{ fontSize: 64, lineHeight: 1 }}>
              {formatSeconds(
                Math.floor((todayTimes[aktywna] || 0) * 60) + elapsedSeconds
              )}
            </div>
            <div className="text-[11px] text-[#64748B] mb-5">
              sesja: {formatSeconds(elapsedSeconds)} · łącznie dziś: {formatSeconds(Math.floor((todayTimes[aktywna] || 0) * 60) + elapsedSeconds)}
            </div>
            <button
              onClick={stopKategoria}
              className="px-8 py-2.5 rounded-lg border border-[#EF4444]/40 text-[#EF4444] text-sm font-medium hover:bg-[#EF4444]/10 transition-all"
            >
              ■ Stop
            </button>
          </>
        ) : (
          <div className="py-4">
            <div className="text-[#64748B] text-4xl mb-3 font-mono">--:--</div>
            <p className="text-[#64748B] text-sm">Wybierz kategorię poniżej, żeby wystartować</p>
          </div>
        )}
      </section>

      {/* ── Sekcja 2: Kategorie ── */}
      <section>
        {GRUPY.map(({ label, kategorie }) => (
          <div key={label} className="mb-4">
            <p className="section-label mb-2">{label.toUpperCase()}</p>
            <div className="flex flex-wrap gap-1.5">
              {kategorie.map(cat => {
                const czas = todayTimes[cat] || 0
                const isAktywna = aktywna === cat
                return (
                  <button
                    key={cat}
                    onClick={() => isAktywna ? stopKategoria() : startKategoria(cat)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all border ${
                      isAktywna
                        ? 'border-[#22D4F0] text-[#22D4F0] bg-[#091C28]'
                        : 'border-[#1A2535] text-[#64748B] hover:border-[#2A3B4C] hover:text-[#E2E8F0] bg-[#0C1520]'
                    }`}
                  >
                    {isAktywna && <span className="w-1.5 h-1.5 rounded-full bg-[#22D4F0] animate-pulse" />}
                    <span>{cat.replace(/_/g, ' ')}</span>
                    {czas > 0 && (
                      <span className="font-mono text-[10px] opacity-70">
                        {formatSeconds(Math.round(czas * 60))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ── Sekcja 3: Countdown dopieszczania ── */}
      <section>
        <p className="section-label mb-3">COUNTDOWN DOPIESZCZANIA</p>
        <div className="space-y-2">
          {ZADANIA_COUNTDOWN.map(({ key, label, limit }) => {
            const active = countdowns[key]
            const elapsed = active ? (Date.now() - active.startedAt) / 60000 : 0
            const remaining = active ? Math.max(active.limitMin - elapsed, 0) : limit
            const pct = active ? Math.min(elapsed / active.limitMin * 100, 100) : 0
            const przekroczony = active && elapsed >= active.limitMin

            return (
              <div
                key={key}
                className={`bg-[#0F1218] border rounded-lg p-3 transition-all ${
                  przekroczony ? 'border-[#EF4444]' : active ? 'border-[#22D4F0]/30' : 'border-[#1A2535]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#E2E8F0]">{label}</span>
                    <span className="text-[10px] text-[#64748B] font-mono">{limit} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {active && (
                      <span className={`font-mono text-sm font-bold ${
                        przekroczony ? 'text-[#EF4444]' : 'text-[#22D4F0]'
                      }`}>
                        {przekroczony ? 'Czas!' : formatSeconds(Math.ceil(remaining * 60))}
                      </span>
                    )}
                    {active ? (
                      <button
                        onClick={() => stopCountdown(key)}
                        className="text-xs text-[#64748B] hover:text-[#EF4444] transition-colors border border-[#1A2535] rounded px-2 py-0.5"
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => startCountdown(key)}
                        className="text-xs text-[#22D4F0] hover:brightness-110 border border-[#22D4F0]/20 rounded px-2 py-0.5 transition-all"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
                {active && (
                  <div className="h-1 bg-[#141921] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: przekroczony ? '#EF4444' : '#22D4F0',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Sekcja 4: Podsumowanie dnia ── */}
      <section>
        <p className="section-label mb-3">PODSUMOWANIE DNIA</p>
        <div className="bg-[#0F1218] border border-[#1A2535] rounded-xl p-4 space-y-3">

          {/* Praca właściwa */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#64748B]">Praca właściwa</span>
              <span className="text-[#E2E8F0] font-mono">
                {formatMin(pracaMin)}
                <span className="text-[#64748B] text-[10px] ml-1">/ 8h</span>
              </span>
            </div>
            <div className="h-1.5 bg-[#141921] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#22D4F0] rounded-full transition-all"
                style={{ width: `${Math.min(pracaMin / 480 * 100, 100)}%` }}
              />
            </div>
            {pracaMin >= 480 && (
              <p className="text-[10px] text-[#F59E0B] mt-1">Max 8h — nie dodawaj kolejnych zadań</p>
            )}
          </div>

          {/* Nauka */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#64748B]">Nauka</span>
              <span className={`font-mono ${naukaMin > 60 ? 'text-[#F59E0B]' : 'text-[#E2E8F0]'}`}>
                {formatMin(naukaMin)}
                <span className="text-[#64748B] text-[10px] ml-1">/ 60 min</span>
              </span>
            </div>
            <div className="h-1.5 bg-[#141921] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(naukaMin / 60 * 100, 100)}%`,
                  background: naukaMin > 60 ? '#F59E0B' : '#22D4F0',
                }}
              />
            </div>
          </div>

          {/* Trening */}
          {treningMin > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Trening</span>
              <span className="text-[#E2E8F0] font-mono">{formatMin(treningMin)}</span>
            </div>
          )}

          {/* Łącznie */}
          <div className="pt-2 border-t border-[#1A2535] flex justify-between text-[11px] text-[#64748B]">
            <span>Łącznie zarejestrowano</span>
            <span className="font-mono text-[#E2E8F0]">
              {formatMin(Object.values(todayTimes).reduce((s, v) => s + v, 0))}
            </span>
          </div>
        </div>
      </section>

    </div>
  )
}
