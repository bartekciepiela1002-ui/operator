import { createContext, useContext, useState, useCallback } from 'react'
import { getTodaySprint, incrementSprintStorage } from '../utils/sprint'

const SprintCtx = createContext(null)

export function SprintProvider({ children }) {
  const [sprintDzis, setSprintDzis] = useState(() => getTodaySprint())
  const [focusModeOpen, setFocusModeOpen] = useState(false)

  const odswierzSprint = useCallback(() => {
    setSprintDzis(getTodaySprint())
  }, [])

  const inkrementuj = useCallback(() => {
    const updated = incrementSprintStorage()
    if (updated) setSprintDzis(updated)
    return updated
  }, [])

  return (
    <SprintCtx.Provider value={{ sprintDzis, odswierzSprint, inkrementuj, focusModeOpen, setFocusModeOpen }}>
      {children}
    </SprintCtx.Provider>
  )
}

export const useSprint = () => useContext(SprintCtx)
