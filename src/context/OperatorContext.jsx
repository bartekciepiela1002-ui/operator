import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { today } from '../utils/helpers'
import {
  wczytajKontakty,
  wczytajDzien, zapiszDzien, nowyDayRecord,
  wczytajChallenge, zapiszChallenge,
  wczytajTimer, zapiszTimer,
} from '../utils/storage'
import {
  getLevelStatus,
  obliczPipeline,
  obliczSprzedaz,
  obliczWdrozenia,
} from '../utils/rules'

const OperatorCtx = createContext(null)

export function OperatorProvider({ children }) {
  const [kontakty, setKontakty] = useState(() => wczytajKontakty())
  const [dzisiejszyDzien, setDzisiejszyDzien] = useState(() => wczytajDzien(today()))
  const [challengeState, setChallengeState] = useState(() => wczytajChallenge())
  const [timerState, setTimerState] = useState(() => wczytajTimer())
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const t = wczytajTimer()
    if (t.activeCategory && t.activeStart) {
      return Math.floor((Date.now() - t.activeStart) / 1000)
    }
    return 0
  })
  const [focusModeOpen, setFocusModeOpen] = useState(false)
  const intervalRef = useRef(null)

  // Restore ticker if timer was active before page reload
  useEffect(() => {
    const t = wczytajTimer()
    if (t.activeCategory && t.activeStart) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1)
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [])

  // Computed on every render — never stored
  const pipeline = obliczPipeline(kontakty)
  const sprzedaz = obliczSprzedaz(kontakty)
  const wdrozenia = obliczWdrozenia(kontakty)
  const { aktualnyLevel } = getLevelStatus(kontakty)

  // ─── Contacts ──────────────────────────────────────────────────────────────

  const odswierzKontakty = useCallback(() => {
    setKontakty(wczytajKontakty())
  }, [])

  // ─── Day ───────────────────────────────────────────────────────────────────

  const odswierzDzien = useCallback(() => {
    setDzisiejszyDzien(wczytajDzien(today()))
  }, [])

  const inkrementujSprint = useCallback(() => {
    const dzis = today()
    const current = wczytajDzien(dzis) || nowyDayRecord(dzis)
    const updated = {
      ...current,
      sprintWykonano: (current.sprintWykonano || 0) + 1,
    }
    updated.sprintUkonczony =
      updated.sprintCel > 0 && updated.sprintWykonano >= updated.sprintCel
    zapiszDzien(updated)
    setDzisiejszyDzien(updated)
    return updated
  }, [])

  // ─── Challenge ─────────────────────────────────────────────────────────────

  const odswierzChallenge = useCallback(() => {
    setChallengeState(wczytajChallenge())
  }, [])

  // ─── Timer ─────────────────────────────────────────────────────────────────

  const startKategoria = useCallback((category) => {
    clearInterval(intervalRef.current)
    const now = Date.now()

    setTimerState(prev => {
      let base = { ...prev, todayTimes: { ...prev.todayTimes } }

      // Save elapsed time for previously active category
      if (prev.activeCategory && prev.activeStart) {
        const diffMin = (now - prev.activeStart) / 60000
        base.todayTimes[prev.activeCategory] =
          (base.todayTimes[prev.activeCategory] || 0) + diffMin
      }

      const newState = { ...base, activeCategory: category, activeStart: now }
      zapiszTimer(newState)
      return newState
    })

    setElapsedSeconds(0)
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1)
    }, 1000)
  }, [])

  const stopKategoria = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    const now = Date.now()

    setTimerState(prev => {
      if (!prev.activeCategory || !prev.activeStart) return prev
      const diffMin = (now - prev.activeStart) / 60000
      const newTimes = { ...prev.todayTimes }
      newTimes[prev.activeCategory] = (newTimes[prev.activeCategory] || 0) + diffMin
      const newState = { ...prev, activeCategory: null, activeStart: null, todayTimes: newTimes }
      zapiszTimer(newState)
      return newState
    })

    setElapsedSeconds(0)
  }, [])

  const startCountdown = useCallback((taskKey) => {
    const LIMITY = {
      poprawa_oferty: 45, montaz_filmu: 60, opis_posta: 30,
      sekcja_strony: 90, analiza_kampanii: 30,
    }
    const limitMin = LIMITY[taskKey]
    if (!limitMin) return

    setTimerState(prev => {
      const newState = {
        ...prev,
        countdowns: {
          ...prev.countdowns,
          [taskKey]: { limitMin, startedAt: Date.now() },
        },
      }
      zapiszTimer(newState)
      return newState
    })
  }, [])

  const stopCountdown = useCallback((taskKey) => {
    setTimerState(prev => {
      const newCountdowns = { ...prev.countdowns }
      delete newCountdowns[taskKey]
      const newState = { ...prev, countdowns: newCountdowns }
      zapiszTimer(newState)
      return newState
    })
  }, [])

  // ─── Context value ─────────────────────────────────────────────────────────

  const value = {
    // Contacts
    kontakty,
    odswierzKontakty,
    // Day
    dzisiejszyDzien,
    odswierzDzien,
    inkrementujSprint,
    // Challenge
    challengeState,
    odswierzChallenge,
    // Computed (live)
    pipeline,
    sprzedaz,
    wdrozenia,
    aktualnyLevel,
    // Focus
    focusModeOpen,
    setFocusModeOpen,
    // Timer
    timerState,
    elapsedSeconds,
    startKategoria,
    stopKategoria,
    startCountdown,
    stopCountdown,
  }

  return (
    <OperatorCtx.Provider value={value}>
      {children}
    </OperatorCtx.Provider>
  )
}

export const useOperator = () => useContext(OperatorCtx)
