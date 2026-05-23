import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKontakty } from '../context/KontaktyContext'
import { edytujKontakt } from '../utils/storage'
import { today, formatDate, daysDiff, STATUS_LABELS } from '../utils/helpers'

function getMonday(offsetWeeks = 0) {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff + offsetWeeks * 7)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function isoDate(d) {
  return d.toISOString().split('T')[0]
}

function getSprintsForRange(startStr, endStr) {
  let total = 0
  const start = new Date(startStr)
  const end = new Date(endStr)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = `crm_sprint_${isoDate(new Date(d))}`
    const data = localStorage.getItem(key)
    if (data) {
      try { total += JSON.parse(data).wykonano || 0 } catch { /* ignore */ }
    }
  }
  return total
}

function inRange(dateStr, startStr, endStr) {
  if (!dateStr) return false
  return dateStr >= startStr && dateStr <= endStr
}

function arrow(curr, prev) {
  if (prev === 0 && curr === 0) return null
  if (curr > prev) return <span className="text-[#10B981] font-mono text-[10px]"> ↑{curr - prev}</span>
  if (curr < prev) return <span className="text-[#EF4444] font-mono text-[10px]"> ↓{prev - curr}</span>
  return <span className="text-[#64748B] font-mono text-[10px]"> →</span>
}

function KPI({ label, val, prev }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-mono text-3xl font-bold text-[#22D4F0]">{val}{prev !== undefined && arrow(val, prev)}</div>
      <div className="text-xs text-[#64748B] mt-1">{label}</div>
    </div>
  )
}

export default function WidokDigest() {
  const { kontakty, odswierz } = useKontakty()
  const navigate = useNavigate()

  const data = useMemo(() => {
    const thisMon = getMonday(0)
    const thisSun = new Date(thisMon); thisSun.setDate(thisMon.getDate() + 6); thisSun.setHours(23,59,59,999)
    const prevMon = getMonday(-1)
    const prevSun = new Date(prevMon); prevSun.setDate(prevMon.getDate() + 6); prevSun.setHours(23,59,59,999)
    const prevPrevMon = getMonday(-2)
    const prevPrevSun = new Date(prevPrevMon); prevPrevSun.setDate(prevPrevMon.getDate() + 6); prevPrevSun.setHours(23,59,59,999)

    const thisMonStr = isoDate(thisMon)
    const thisSunStr = isoDate(thisSun)
    const prevMonStr = isoDate(prevMon)
    const prevSunStr = isoDate(prevSun)
    const prevPrevMonStr = isoDate(prevPrevMon)
    const prevPrevSunStr = isoDate(prevPrevSun)

    // Telefony ze sprintów
    const telPrev = getSprintsForRange(prevMonStr, prevSunStr)
    const telPrevPrev = getSprintsForRange(prevPrevMonStr, prevPrevSunStr)

    // Rozmowy = kontakty z tor='rozmawial' aktywne w ubiegłym tygodniu
    const rozmPrev = kontakty.filter(k => k.tor === 'rozmawial' && inRange(k.dataOstatniegoKontaktu, prevMonStr, prevSunStr)).length
    const rozmPrevPrev = kontakty.filter(k => k.tor === 'rozmawial' && inRange(k.dataOstatniegoKontaktu, prevPrevMonStr, prevPrevSunStr)).length

    // Demo umówione w ubiegłym tygodniu
    const demoPrev = kontakty.filter(k => k.status === 'demo_umowione' && inRange(k.dataOstatniegoKontaktu, prevMonStr, prevSunStr)).length
    const demoPrevPrev = kontakty.filter(k => k.status === 'demo_umowione' && inRange(k.dataOstatniegoKontaktu, prevPrevMonStr, prevPrevSunStr)).length

    // Zamknięte ✓ w ubiegłym tygodniu
    const zamkPrev = kontakty.filter(k => k.status === 'zamkniete_tak' && inRange(k.dataOstatniegoKontaktu, prevMonStr, prevSunStr)).length
    const zamkPrevPrev = kontakty.filter(k => k.status === 'zamkniete_tak' && inRange(k.dataOstatniegoKontaktu, prevPrevMonStr, prevPrevSunStr)).length

    // Utknięte w pipeline
    const utkniety = kontakty.filter(k => {
      if (k.status === 'archiwum') return false
      const dni = daysDiff(k.dataOstatniegoKontaktu)
      if (['demo_umowione', 'po_demo'].includes(k.status) && dni > 7) return true
      if (['prosi_o_maila', 'mail_wyslany'].includes(k.status) && dni > 5) return true
      if (k.status === 'w_kontakcie' && dni > 10) return true
      return false
    }).sort((a, b) => daysDiff(a.dataOstatniegoKontaktu) - daysDiff(b.dataOstatniegoKontaktu))

    // Powracające z nurturingu w tym tygodniu
    const powracajace = kontakty.filter(k =>
      k.dataNurturingu && inRange(k.dataNurturingu, thisMonStr, thisSunStr)
    )

    // Przypomnienia w tym tygodniu
    const przypomnienia = kontakty.filter(k =>
      k.dataPrzypomnienia &&
      inRange(k.dataPrzypomnienia, thisMonStr, thisSunStr) &&
      k.status !== 'archiwum'
    ).sort((a, b) => a.dataPrzypomnienia.localeCompare(b.dataPrzypomnienia))

    // Dni robocze pozostałe w tygodniu
    const dzis = new Date()
    const dayOfWeek = dzis.getDay()
    const dniBiznTitle = dayOfWeek === 0 ? 0 : Math.max(5 - dayOfWeek, 0)

    return {
      thisMon, thisSun,
      prevMon, prevSun,
      telPrev, telPrevPrev,
      rozmPrev, rozmPrevPrev,
      demoPrev, demoPrevPrev,
      zamkPrev, zamkPrevPrev,
      utkniety, powracajace, przypomnienia,
      dniBiznTitle, thisMonStr, thisSunStr
    }
  }, [kontakty])

  const handleReaktywuj = (k) => {
    edytujKontakt(k.id, {
      status: 'do_zadzwonienia',
      licznikTel: 0,
      licznikOutreach: 0,
      tor: null,
      dataArchiwizacji: null,
      dataNurturingu: null
    })
    odswierz()
  }

  const teraz = new Date().toLocaleString('pl-PL')

  return (
    <div className="max-w-3xl mx-auto">
      {/* Nagłówek */}
      <div className="mb-7">
        <h1 className="text-[#E2E8F0] font-medium text-xl mb-1">Tygodniowy Digest</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[10px] text-[#64748B]">
            {formatDate(isoDate(data.thisMon))} — {formatDate(isoDate(data.thisSun))}
          </span>
          <span className="text-[#64748B] text-[10px]">·</span>
          <span className="font-mono text-[10px] text-[#64748B]">Wygenerowano: {teraz}</span>
        </div>
      </div>

      {/* 1. Poprzedni tydzień — liczby */}
      <section className="mb-8">
        <p className="section-label mb-4">
          Poprzedni tydzień · {formatDate(isoDate(data.prevMon))} — {formatDate(isoDate(data.prevSun))}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI label="Telefony" val={data.telPrev} prev={data.telPrevPrev} />
          <KPI label="Rozmowy" val={data.rozmPrev} prev={data.rozmPrevPrev} />
          <KPI label="Demo umówione" val={data.demoPrev} prev={data.demoPrevPrev} />
          <KPI label="Zamknięte ✓" val={data.zamkPrev} prev={data.zamkPrevPrev} />
        </div>
      </section>

      {/* 2. Utknięte w pipeline */}
      <section className="mb-8">
        <p className="section-label mb-4">Utknięte w pipeline</p>
        {data.utkniety.length === 0 ? (
          <div className="card p-5 text-center text-[#10B981] text-sm">
            Wszystko gra. Pipeline czysty.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {data.utkniety.map((k, i) => (
              <div
                key={k.id}
                className={`flex items-center justify-between gap-4 px-4 py-3 ${i > 0 ? 'border-t border-[#1A2535]' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#E2E8F0] text-sm font-medium truncate">{k.imie || k.nazwaSlonu}</span>
                    {k.imie && <span className="text-[#64748B] text-xs truncate">{k.nazwaSlonu}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[#64748B] text-[10px]">{STATUS_LABELS[k.status]}</span>
                    <span className="text-[#F59E0B] font-mono text-[10px]">{daysDiff(k.dataOstatniegoKontaktu)}d bez ruchu</span>
                  </div>
                </div>
                <button onClick={() => navigate(`/kontakt/${k.id}`)} className="btn-ghost text-xs shrink-0">
                  Otwórz →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Powracające z archiwum */}
      <section className="mb-8">
        <p className="section-label mb-4">Powracające z nurturingu w tym tygodniu</p>
        {data.powracajace.length === 0 ? (
          <div className="card p-5 text-center text-[#64748B] text-xs">
            Brak kontaktów powracających w tym tygodniu
          </div>
        ) : (
          <div className="card overflow-hidden">
            {data.powracajace.map((k, i) => (
              <div
                key={k.id}
                className={`px-4 py-3 ${i > 0 ? 'border-t border-[#1A2535]' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#E2E8F0] text-sm font-medium">{k.imie || k.nazwaSlonu}</span>
                      {k.imie && <span className="text-[#64748B] text-xs">{k.nazwaSlonu}</span>}
                      {k.miasto && <span className="text-[#64748B] text-xs">· {k.miasto}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-mono text-[10px] text-[#64748B]">ostatni kontakt: {formatDate(k.dataOstatniegoKontaktu)}</span>
                      {k.powodOdmowy && (
                        <span className="text-[10px] font-mono bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 rounded px-1.5 py-0.5">
                          {k.powodOdmowy}
                        </span>
                      )}
                      {k.tor === 'nie_odbiera' && !k.powodOdmowy && (
                        <span className="text-[10px] text-[#64748B]">nie odbierała</span>
                      )}
                    </div>
                    {k.notatki?.[0] && (
                      <p className="text-[#64748B] text-xs mt-1.5 truncate" style={{ maxWidth: '36ch' }}>
                        "{k.notatki[0].tresc.slice(0, 80)}{k.notatki[0].tresc.length > 80 ? '…' : ''}"
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleReaktywuj(k)}
                    className="btn-blue text-xs shrink-0"
                  >
                    Reaktywuj
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Ten tydzień — plan */}
      <section className="mb-8">
        <p className="section-label mb-4">Ten tydzień — plan</p>
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-[#22D4F0]">{data.dniBiznTitle}</span>
            <span className="text-[#64748B] text-sm">dni roboczych pozostało w tygodniu</span>
          </div>

          {data.przypomnienia.length > 0 && (
            <div>
              <p className="section-label mb-2">Przypomnienia w tym tygodniu</p>
              <div className="flex flex-col gap-2">
                {data.przypomnienia.map(k => (
                  <div
                    key={k.id}
                    onClick={() => navigate(`/kontakt/${k.id}`)}
                    className="flex items-center justify-between gap-3 bg-[#141921] rounded-lg px-3 py-2 cursor-pointer hover:bg-[#0C1520] transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-[#22D4F0]">{formatDate(k.dataPrzypomnienia)}</span>
                      <span className="text-[#E2E8F0] text-xs">{k.imie || k.nazwaSlonu}</span>
                      {k.nastepnyKrok && <span className="text-[#64748B] text-[10px] truncate">{k.nastepnyKrok}</span>}
                    </div>
                    <span className="text-[10px] text-[#64748B]">→</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.przypomnienia.length === 0 && (
            <p className="text-[#64748B] text-xs">Brak przypomnień zaplanowanych na ten tydzień</p>
          )}
        </div>
      </section>
    </div>
  )
}
