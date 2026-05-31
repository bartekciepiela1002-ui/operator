import { useState, useMemo } from 'react'
import { useOperator } from '../context/OperatorContext'
import {
  wczytajWszystkieDni, wczytajDzien, zapiszDzien, nowyDayRecord,
  zapiszChallenge, wczytajTimer,
} from '../utils/storage'
import {
  evaluateDay, computeStreak, getLevelStatus,
  obliczWdrozeniaKwalifikowane, obliczSprzedaz, obliczPipeline,
  obliczCzasyZTimera,
} from '../utils/rules'
import { today, formatDate } from '../utils/helpers'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  zaliczony: '#10B981',
  mocno_zaliczony: '#22D4F0',
  urlopowy: '#94A3B8',
  niezaliczony: '#EF4444',
}
const STATUS_LABEL = {
  zaliczony: 'Zaliczony',
  mocno_zaliczony: 'Mocno zaliczony',
  urlopowy: 'Urlopowy',
  niezaliczony: 'Niezaliczony',
}
const STATUS_ICON = { zaliczony: '✓', mocno_zaliczony: '★', urlopowy: '○', niezaliczony: '✗' }

function getLevelProgress(kontakty, levelId) {
  const rozm = kontakty.filter(x =>
    ['w_kontakcie','prosi_o_maila','mail_wyslany','demo_umowione','po_demo','zamkniete_tak','zamkniete_nie']
    .includes(x.status)).length
  const oferty = kontakty.filter(x =>
    ['mail_wyslany','demo_umowione','po_demo','zamkniete_tak','zamkniete_nie']
    .includes(x.status)).length
  const kwal = obliczWdrozeniaKwalifikowane(kontakty)
  switch (levelId) {
    case 1: return { current: rozm, target: 10, label: `${rozm} / 10 rozmów` }
    case 2: return { current: oferty, target: 3, label: `${oferty} / 3 ofert` }
    case 3: return { current: kwal, target: 1, label: `${kwal} / 1 wdrożenie` }
    case 4: return { current: kwal, target: 3, label: `${kwal} / 3 wdrożenia` }
    case 5: return { current: obliczPipeline(kontakty), target: 50000, label: `${fmtPLN(obliczPipeline(kontakty))} / 50 000 zł`, currency: true }
    case 6: return { current: obliczSprzedaz(kontakty), target: 30000, label: `${fmtPLN(obliczSprzedaz(kontakty))} / 30 000 zł`, currency: true }
    default: return { current: 0, target: 1, label: '' }
  }
}

function fmtPLN(v) {
  return new Intl.NumberFormat('pl-PL').format(Math.round(v))
}

function getChallengeDates(startDate) {
  if (!startDate) return []
  const dates = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function getWeekRange(daysAgo) {
  const end = new Date(); end.setDate(end.getDate() - daysAgo)
  const start = new Date(end); start.setDate(end.getDate() - 6)
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WidokChallenge() {
  const {
    kontakty, dzisiejszyDzien, odswierzDzien,
    challengeState, odswierzChallenge, aktualnyLevel, timerState,
  } = useOperator()

  const wszystkieDni = useMemo(() => wczytajWszystkieDni(), [dzisiejszyDzien, challengeState])
  const dniMap = useMemo(() => {
    const m = {}; wszystkieDni.forEach(d => { m[d.date] = d }); return m
  }, [wszystkieDni])

  const streak = useMemo(() => computeStreak(wszystkieDni, challengeState), [wszystkieDni, challengeState])
  const { levele } = getLevelStatus(kontakty)
  const kwal = obliczWdrozeniaKwalifikowane(kontakty)
  const pipeline = obliczPipeline(kontakty)
  const sprzedaz = obliczSprzedaz(kontakty)

  const [selectedDate, setSelectedDate] = useState(null)
  const [zamkniety, setZamkniety] = useState(null) // { status, errors }

  // Form state
  const [formData, setFormData] = useState(() => {
    const dzien = wczytajDzien(today())
    const timer = wczytajTimer()
    const td = obliczCzasyZTimera(timer.todayTimes)
    return {
      sen: dzien?.sen ?? '',
      aktywnosc: dzien?.aktywnosc ?? false,
      aktywnoscMin: dzien?.aktywnoscMin ?? 0,
      prysznic: dzien?.prysznic ?? false,
      videoUpdate: dzien?.videoUpdate ?? false,
      tryb: dzien?.tryb ?? 'normalny',
      domknieteRzeczy: dzien?.domknieteRzeczy?.some(r => r.trim()) ? dzien.domknieteRzeczy : [''],
      strzalNaWynik: dzien?.strzalNaWynik ?? '',
      pracaWlasciwaMin: dzien?.pracaWlasciwaMin || td.pracaWlasciwaMin || 0,
      naukaMin: dzien?.naukaMin || td.naukaMin || 0,
      coZadzialalo: dzien?.coZadzialalo ?? '',
      coNieZadzialalo: dzien?.coNieZadzialalo ?? '',
      planNaJutro: dzien?.planNaJutro ?? '',
    }
  })

  const set = (key) => (val) => setFormData(p => ({ ...p, [key]: val }))

  const handleZamknijDzien = () => {
    const dzis = today()
    const current = wczytajDzien(dzis) || nowyDayRecord(dzis)
    const updated = {
      ...current,
      sen: parseFloat(formData.sen) || null,
      aktywnosc: formData.aktywnosc,
      aktywnoscMin: parseInt(formData.aktywnoscMin) || 0,
      prysznic: formData.prysznic,
      videoUpdate: formData.videoUpdate,
      tryb: formData.tryb,
      domknieteRzeczy: formData.domknieteRzeczy.filter(r => r.trim()),
      strzalNaWynik: formData.strzalNaWynik,
      pracaWlasciwaMin: parseInt(formData.pracaWlasciwaMin) || 0,
      naukaMin: parseInt(formData.naukaMin) || 0,
      coZadzialalo: formData.coZadzialalo,
      coNieZadzialalo: formData.coNieZadzialalo,
      planNaJutro: formData.planNaJutro,
    }
    const { status, errors } = evaluateDay(updated, kontakty)
    updated.status = status
    updated.errors = errors
    zapiszDzien(updated)

    const noweDni = wczytajWszystkieDni()
    const nowyStreak = computeStreak(noweDni, challengeState)
    zapiszChallenge({
      ...challengeState,
      streakCurrent: nowyStreak.current,
      streakBest: Math.max(challengeState.streakBest || 0, nowyStreak.best),
    })

    odswierzDzien()
    odswierzChallenge()
    setZamkniety({ status, errors })
  }

  // Dane tygodniowe
  const week0 = getWeekRange(0)
  const week1 = getWeekRange(7)
  const pipelineTen = kontakty
    .filter(k => k.dataOstatniegoKontaktu >= week0.start && k.dataOstatniegoKontaktu <= week0.end
      && ['proby_kontaktu','w_kontakcie','prosi_o_maila','mail_wyslany','demo_umowione','po_demo'].includes(k.status))
    .reduce((s, k) => s + (k.wartoscKontraktu || 0), 0)
  const pipelinePop = kontakty
    .filter(k => k.dataOstatniegoKontaktu >= week1.start && k.dataOstatniegoKontaktu <= week1.end
      && ['proby_kontaktu','w_kontakcie','prosi_o_maila','mail_wyslany','demo_umowione','po_demo'].includes(k.status))
    .reduce((s, k) => s + (k.wartoscKontraktu || 0), 0)
  const sprzedazTen = kontakty
    .filter(k => k.dataOstatniegoKontaktu >= week0.start && k.dataOstatniegoKontaktu <= week0.end && k.status === 'zamkniete_tak')
    .reduce((s, k) => s + (k.wartoscKontraktu || 0), 0)
  const sprzedazPop = kontakty
    .filter(k => k.dataOstatniegoKontaktu >= week1.start && k.dataOstatniegoKontaktu <= week1.end && k.status === 'zamkniete_tak')
    .reduce((s, k) => s + (k.wartoscKontraktu || 0), 0)

  // Procent dni zaliczonych
  const challengeDates = getChallengeDates(challengeState?.startDate)
  const dzis = today()
  const dniDoTej = challengeDates.filter(d => d <= dzis)
  const zaliczoneDni = dniDoTej.filter(d => {
    const s = dniMap[d]?.status
    return s === 'zaliczony' || s === 'mocno_zaliczony' || s === 'urlopowy'
  }).length
  const procentZaliczonych = dniDoTej.length > 0 ? Math.round(zaliczoneDni / dniDoTej.length * 100) : 0

  // Day number
  const dayNumber = challengeState?.startDate
    ? Math.floor((Date.now() - new Date(challengeState.startDate).getTime()) / 86400000) + 1
    : null

  const pokazFormularz = !dzisiejszyDzien?.status && !zamkniety

  if (!(challengeState?.aktywny ?? true)) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <div className="text-4xl mb-4 opacity-30">🏆</div>
        <h2 className="text-[#64748B] text-lg font-medium mb-2">Challenge jest wyłączony</h2>
        <p className="text-[#64748B] text-sm mb-6">
          Dane i historia dni są zachowane. Włącz challenge w Ustawieniach żeby wrócić do śledzenia.
        </p>
        <a href="/ustawienia" className="btn-ghost px-6 py-2.5 inline-block">Przejdź do Ustawień →</a>
      </div>
    )
  }

  if (!challengeState?.startDate) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-[#E2E8F0] text-xl font-semibold mb-2">Challenge nie wystartowany</h2>
        <p className="text-[#64748B] text-sm mb-6">Ustaw datę startu w Ustawieniach, aby zacząć śledzić streak i dni.</p>
        <a href="/ustawienia" className="btn-primary px-6 py-2.5 inline-block">Przejdź do Ustawień →</a>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">

      {/* ── Sekcja 1: Nagłówek ── */}
      <section>
        <div className="flex items-end gap-6 flex-wrap mb-4">
          <div>
            <div className="text-[11px] text-[#64748B] uppercase tracking-[0.12em] mb-0.5">Challenge</div>
            <div className="font-mono font-bold" style={{ fontSize: 48, lineHeight: 1, color: '#E2E8F0' }}>
              {Math.min(dayNumber, 30)}<span className="text-[#1A2535] text-2xl">/30</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="text-[#64748B] text-sm">Streak</span>
              <span className="font-mono font-bold text-[#22D4F0] text-2xl">🔥 {streak.current}</span>
              <span className="text-[#64748B] text-xs">rekord: {streak.best}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#091C28] border border-[#22D4F0]/20 text-[#22D4F0] rounded px-2 py-0.5 font-mono">
                Level {aktualnyLevel}/6
              </span>
              {levele[aktualnyLevel] && (
                <span className="text-[#64748B] text-xs">{levele[aktualnyLevel].nazwa}</span>
              )}
            </div>
          </div>
        </div>

        {/* Pasek do następnego levelu */}
        {aktualnyLevel < 6 && (() => {
          const nextLevel = aktualnyLevel + 1
          const prog = getLevelProgress(kontakty, nextLevel)
          const pct = Math.min(prog.current / prog.target * 100, 100)
          return (
            <div>
              <div className="flex justify-between text-[10px] text-[#64748B] mb-1">
                <span>Do Level {nextLevel}: {levele[nextLevel - 1]?.nazwa}</span>
                <span>{prog.label}</span>
              </div>
              <div className="h-1.5 bg-[#141921] rounded-full overflow-hidden">
                <div className="h-full bg-[#22D4F0] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })()}
      </section>

      {/* ── Sekcja 2: Kafelki ── */}
      <section className="grid grid-cols-4 gap-3">
        <Kafelek label="Wdrożenia" value={`${kwal}`} sub="/ 3 cel" highlight={kwal >= 3} />
        <Kafelek label="Sprzedaż" value={`${fmtPLN(sprzedaz)} zł`} sub="/ 15 000 zł cel" highlight={sprzedaz >= 15000} />
        <Kafelek label="Pipeline" value={`${fmtPLN(pipeline)} zł`} sub="aktywne" />
        <Kafelek label="Dni %" value={`${procentZaliczonych}%`} sub={`${zaliczoneDni}/${dniDoTej.length} dni`} highlight={procentZaliczonych >= 80} />
      </section>

      {/* ── Sekcja 3: Dane tygodniowe ── */}
      <section>
        <p className="section-label mb-3">TEN TYDZIEŃ vs POPRZEDNI</p>
        <div className="grid grid-cols-2 gap-3">
          <TygodniowaKarta label="Pipeline (aktywność)" ten={pipelineTen} pop={pipelinePop} currency />
          <TygodniowaKarta label="Sprzedaż" ten={sprzedazTen} pop={sprzedazPop} currency />
        </div>
      </section>

      {/* ── Sekcja 4: Oś czasu ── */}
      <section>
        <p className="section-label mb-3">OŚ CZASU — 30 DNI</p>
        <div className="flex flex-wrap gap-1.5">
          {challengeDates.map(date => {
            const dzien = dniMap[date]
            const status = dzien?.status ?? null
            const jestDzis = date === dzis
            const przyszlosc = date > dzis
            const bg = przyszlosc ? '#0A0D12' :
              status === 'zaliczony' ? '#003D1E' :
              status === 'mocno_zaliczony' ? '#003A56' :
              status === 'urlopowy' ? '#1A1E28' :
              status === 'niezaliczony' ? '#3D0000' :
              '#141921'
            const border = przyszlosc ? '#1A2535' :
              status ? STATUS_COLOR[status] :
              jestDzis ? '#22D4F0' : '#1A2535'
            const isSelected = selectedDate === date

            return (
              <button
                key={date}
                onClick={() => !przyszlosc && setSelectedDate(selectedDate === date ? null : date)}
                title={`${formatDate(date)}${status ? ` · ${STATUS_LABEL[status]}` : ''}`}
                style={{
                  width: 28, height: 28, borderRadius: 4,
                  background: bg, border: `1px solid ${isSelected ? '#22D4F0' : border}`,
                  cursor: przyszlosc ? 'default' : 'pointer',
                  fontSize: 10,
                  color: status ? STATUS_COLOR[status] : '#2A3B4C',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? '0 0 0 2px rgba(34,212,240,0.3)' : 'none',
                }}
              >
                {status ? STATUS_ICON[status] : jestDzis ? '·' : ''}
              </button>
            )
          })}
        </div>

        {/* Inline szczegóły */}
        {selectedDate && dniMap[selectedDate] && (
          <div className="mt-4 bg-[#0F1218] border border-[#1A2535] rounded-lg p-4 animate-entry">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-[#E2E8F0] text-sm font-medium">{formatDate(selectedDate)}</span>
                {dniMap[selectedDate].status && (
                  <span style={{ color: STATUS_COLOR[dniMap[selectedDate].status] }} className="text-sm">
                    {STATUS_ICON[dniMap[selectedDate].status]} {STATUS_LABEL[dniMap[selectedDate].status]}
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-[#64748B] hover:text-[#E2E8F0] text-xs">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-[11px]">
              <div className="text-[#64748B]">Sprint: <span className="text-[#E2E8F0] font-mono">{dniMap[selectedDate].sprintWykonano}/{dniMap[selectedDate].sprintCel}</span></div>
              <div className="text-[#64748B]">Praca: <span className="text-[#E2E8F0] font-mono">{Math.round(dniMap[selectedDate].pracaWlasciwaMin / 6) / 10}h</span></div>
              <div className="text-[#64748B]">Sen: <span className="text-[#E2E8F0] font-mono">{dniMap[selectedDate].sen ?? '—'}h</span></div>
            </div>
            {dniMap[selectedDate].domknieteRzeczy?.some(r => r.trim()) && (
              <div className="mt-2 text-[11px] text-[#64748B]">
                Domknięte: <span className="text-[#E2E8F0]">{dniMap[selectedDate].domknieteRzeczy.filter(r => r.trim()).join(', ')}</span>
              </div>
            )}
            {dniMap[selectedDate].errors?.length > 0 && (
              <div className="mt-2 text-[10px] text-[#EF4444] opacity-70">{dniMap[selectedDate].errors.filter(e => e !== 'nauka_przekracza_limit').join(' · ')}</div>
            )}
          </div>
        )}
      </section>

      {/* ── Sekcja 5: Levele ── */}
      <section>
        <p className="section-label mb-3">LEVELE</p>
        <div className="space-y-2">
          {levele.map(level => {
            const prog = getLevelProgress(kontakty, level.id)
            const pct = Math.min(prog.current / prog.target * 100, 100)
            const aktywny = level.id === aktualnyLevel + 1
            const osiagniety = level.osiagniety
            const zablokowany = !osiagniety && !aktywny && level.id > aktualnyLevel + 1

            return (
              <div key={level.id} className={`rounded-lg p-3 border transition-all ${
                osiagniety ? 'border-[#10B981]/30 bg-[#001A0E]' :
                aktywny ? 'border-[#22D4F0]/40 bg-[#091C28]' :
                'border-[#1A2535] bg-[#0C1520] opacity-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono font-bold ${
                      osiagniety ? 'text-[#10B981]' : aktywny ? 'text-[#22D4F0]' : 'text-[#64748B]'
                    }`}>
                      {osiagniety ? '✓' : aktywny ? '▶' : String(level.id)}
                    </span>
                    <span className={`text-sm font-medium ${
                      osiagniety ? 'text-[#10B981]' : aktywny ? 'text-[#E2E8F0]' : 'text-[#64748B]'
                    }`}>
                      {level.nazwa}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono">{prog.label}</span>
                </div>
                {!zablokowany && (
                  <div className="h-1 bg-[#141921] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: osiagniety ? '#10B981' : '#22D4F0',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Wynik zamknięcia ── */}
      {zamkniety && (
        <section className="bg-[#0F1218] border rounded-xl p-6 text-center animate-entry" style={{
          borderColor: STATUS_COLOR[zamkniety.status],
        }}>
          <div className="text-4xl mb-2" style={{ color: STATUS_COLOR[zamkniety.status] }}>
            {STATUS_ICON[zamkniety.status]}
          </div>
          <div className="text-xl font-semibold mb-1" style={{ color: STATUS_COLOR[zamkniety.status] }}>
            {STATUS_LABEL[zamkniety.status]}
          </div>
          {zamkniety.errors.filter(e => e !== 'nauka_przekracza_limit').length > 0 && (
            <div className="mt-3 text-xs text-[#EF4444] space-y-1">
              {zamkniety.errors.filter(e => e !== 'nauka_przekracza_limit').map(e => (
                <div key={e}>{e.replace(/_/g, ' ')}</div>
              ))}
            </div>
          )}
          {zamkniety.errors.includes('nauka_przekracza_limit') && (
            <div className="mt-2 text-xs text-[#F59E0B]">⚠ Nauka przekroczyła 60 min (limit antyoszukiwania)</div>
          )}
        </section>
      )}

      {/* ── Sekcja 6: Formularz zamknięcia dnia ── */}
      {pokazFormularz && (
        <section className="bg-[#0F1218] border border-[#1A2535] rounded-xl p-6">
          <p className="section-label mb-6">ZAMKNIJ DZIEŃ — {formatDate(dzis)}</p>

          <div className="space-y-5">

            {/* Sen */}
            <div>
              <label className="label">Sen (godziny) <span className="text-[#EF4444]">*</span></label>
              <input
                type="number"
                min={0} max={12} step={0.5}
                value={formData.sen}
                onChange={e => set('sen')(e.target.value)}
                className="input w-28 font-mono"
                placeholder="7.5"
              />
              {formData.sen !== '' && (parseFloat(formData.sen) < 6 || parseFloat(formData.sen) > 8) && (
                <p className="text-[10px] text-[#EF4444] mt-1">
                  {parseFloat(formData.sen) < 6 ? 'Za mało snu (min. 6h)' : 'Za dużo snu (max. 8h)'}
                </p>
              )}
            </div>

            {/* Aktywność */}
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Toggle value={formData.aktywnosc} onChange={set('aktywnosc')} />
                <span className="text-sm text-[#E2E8F0]">Aktywność fizyczna (min. 30 min)</span>
              </div>
              {formData.aktywnosc && (
                <div className="flex items-center gap-2 ml-12">
                  <input
                    type="number" min={0} value={formData.aktywnoscMin}
                    onChange={e => set('aktywnoscMin')(e.target.value)}
                    className="input w-20 text-sm"
                    placeholder="30"
                  />
                  <span className="text-[#64748B] text-sm">min</span>
                </div>
              )}
            </div>

            {/* Prysznic */}
            <div className="flex items-center gap-4">
              <Toggle value={formData.prysznic} onChange={set('prysznic')} />
              <span className="text-sm text-[#E2E8F0]">Zimny prysznic</span>
            </div>

            {/* Video update */}
            <div className="flex items-center gap-4">
              <Toggle value={formData.videoUpdate} onChange={set('videoUpdate')} />
              <span className="text-sm text-[#E2E8F0]">Update wideo</span>
            </div>

            {/* Tryb dnia */}
            <div>
              <label className="label">Tryb dnia</label>
              <div className="flex gap-3">
                {['normalny', 'urlopowy'].map(t => (
                  <button
                    key={t}
                    onClick={() => set('tryb')(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm border transition-all ${
                      formData.tryb === t
                        ? 'border-[#22D4F0] text-[#22D4F0] bg-[#091C28]'
                        : 'border-[#1A2535] text-[#64748B] hover:border-[#2A3B4C]'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Domknięte rzeczy */}
            <div>
              <label className="label">
                Domknięte rzeczy <span className="text-[#EF4444]">*</span>
                <span className="text-[#64748B] font-normal ml-2">(konkretne efekty, nie "pracowałem nad")</span>
              </label>
              <div className="space-y-2">
                {formData.domknieteRzeczy.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={r}
                      onChange={e => {
                        const next = [...formData.domknieteRzeczy]
                        next[i] = e.target.value
                        set('domknieteRzeczy')(next)
                      }}
                      className="input flex-1 text-sm"
                      placeholder={`np. Wysłałem ofertę do firmy X`}
                    />
                    {formData.domknieteRzeczy.length > 1 && (
                      <button
                        onClick={() => set('domknieteRzeczy')(formData.domknieteRzeczy.filter((_, j) => j !== i))}
                        className="text-[#64748B] hover:text-[#EF4444] transition-colors px-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => set('domknieteRzeczy')([...formData.domknieteRzeczy, ''])}
                  className="text-xs text-[#22D4F0] hover:brightness-110 transition-all"
                >
                  + Dodaj
                </button>
              </div>
            </div>

            {/* Strzał na wynik */}
            <div>
              <label className="label">Strzał na wynik <span className="text-[#64748B] font-normal">(jedna konkretna akcja)</span></label>
              <input
                value={formData.strzalNaWynik}
                onChange={e => set('strzalNaWynik')(e.target.value)}
                className="input text-sm"
                placeholder="np. Zadzwonię do firmy Y o 10:00"
              />
            </div>

            {/* Czas pracy */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Praca właściwa
                  <span className="text-[#64748B] font-normal ml-1 text-[10px]">(z timera)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} value={formData.pracaWlasciwaMin}
                    onChange={e => set('pracaWlasciwaMin')(e.target.value)}
                    className="input w-24 font-mono"
                  />
                  <span className="text-[#64748B] text-sm">min</span>
                  <span className="text-[11px] text-[#64748B]">
                    ({Math.round(formData.pracaWlasciwaMin / 6) / 10}h)
                  </span>
                </div>
                {formData.tryb === 'normalny' && formData.pracaWlasciwaMin < 240 && (
                  <p className="text-[10px] text-[#EF4444] mt-1">Min. 4h (240 min)</p>
                )}
              </div>
              <div>
                <label className="label">
                  Nauka
                  <span className="text-[#64748B] font-normal ml-1 text-[10px]">(max 60 min)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={60} value={formData.naukaMin}
                    onChange={e => set('naukaMin')(e.target.value)}
                    className="input w-24 font-mono"
                  />
                  <span className="text-[#64748B] text-sm">min</span>
                </div>
                {formData.naukaMin > 60 && (
                  <p className="text-[10px] text-[#F59E0B] mt-1">Przekracza limit 60 min</p>
                )}
              </div>
            </div>

            {/* Refleksja */}
            <div className="border-t border-[#1A2535] pt-5 space-y-4">
              <p className="text-[11px] text-[#64748B] uppercase tracking-[0.1em]">Refleksja (opcjonalna)</p>
              <div>
                <label className="label">Co zadziałało?</label>
                <textarea rows={2} value={formData.coZadzialalo}
                  onChange={e => set('coZadzialalo')(e.target.value)}
                  className="input resize-none text-sm" />
              </div>
              <div>
                <label className="label">Co nie zadziałało?</label>
                <textarea rows={2} value={formData.coNieZadzialalo}
                  onChange={e => set('coNieZadzialalo')(e.target.value)}
                  className="input resize-none text-sm" />
              </div>
              <div>
                <label className="label">Plan na jutro</label>
                <textarea rows={2} value={formData.planNaJutro}
                  onChange={e => set('planNaJutro')(e.target.value)}
                  className="input resize-none text-sm" />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleZamknijDzien}
              className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-[0.08em] transition-all hover:brightness-110"
              style={{ background: '#22D4F0', color: '#050810' }}
            >
              Zamknij dzień
            </button>
          </div>
        </section>
      )}

    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Kafelek({ label, value, sub, highlight }) {
  return (
    <div className={`bg-[#0F1218] border rounded-lg p-4 ${highlight ? 'border-[#10B981]/30' : 'border-[#1A2535]'}`}>
      <div className="text-[10px] text-[#64748B] uppercase tracking-[0.1em] mb-1">{label}</div>
      <div className={`font-mono font-bold text-lg leading-tight ${highlight ? 'text-[#10B981]' : 'text-[#E2E8F0]'}`}>
        {value}
      </div>
      <div className="text-[10px] text-[#64748B] mt-0.5">{sub}</div>
    </div>
  )
}

function TygodniowaKarta({ label, ten, pop, currency }) {
  const delta = ten - pop
  const sign = delta > 0 ? '+' : ''
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '='
  const color = delta > 0 ? '#10B981' : delta < 0 ? '#EF4444' : '#64748B'
  const fmt = (v) => currency ? `${fmtPLN(v)} zł` : String(v)

  return (
    <div className="bg-[#0F1218] border border-[#1A2535] rounded-lg p-4">
      <div className="text-[10px] text-[#64748B] uppercase tracking-[0.1em] mb-2">{label}</div>
      <div className="font-mono font-bold text-lg text-[#E2E8F0]">{fmt(ten)}</div>
      <div className="flex items-center gap-1 mt-1" style={{ color }}>
        <span className="text-sm">{arrow}</span>
        <span className="text-[11px] font-mono">{sign}{fmt(Math.abs(delta))} vs poprzedni</span>
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-6 rounded-full border transition-all flex items-center px-0.5 ${
        value ? 'bg-[#22D4F0] border-[#22D4F0]' : 'bg-[#141921] border-[#1A2535]'
      }`}
    >
      <div className={`w-5 h-5 rounded-full transition-all ${
        value ? 'translate-x-4 bg-[#050810]' : 'translate-x-0 bg-[#64748B]'
      }`} />
    </button>
  )
}
