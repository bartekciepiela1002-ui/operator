import { useOperator } from './OperatorContext'

// Thin wrapper — existing views import useSprint() without changes
export function SprintProvider({ children }) {
  return children
}

export const useSprint = () => {
  const {
    dzisiejszyDzien,
    odswierzDzien,
    inkrementujSprint,
    focusModeOpen,
    setFocusModeOpen,
  } = useOperator()

  return {
    sprintDzis: dzisiejszyDzien,
    odswierzSprint: odswierzDzien,
    inkrementuj: inkrementujSprint,
    focusModeOpen,
    setFocusModeOpen,
  }
}
