import { useOperator } from './OperatorContext'

// Thin wrapper — existing views import useKontakty() without changes
export function KontaktyProvider({ children }) {
  return children
}

export const useKontakty = () => {
  const { kontakty, odswierzKontakty } = useOperator()
  return { kontakty, odswierz: odswierzKontakty }
}
