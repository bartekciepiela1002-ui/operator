import { createContext, useContext, useState, useCallback } from 'react'
import { wczytajKontakty } from '../utils/storage'

const KontaktyContext = createContext(null)

export function KontaktyProvider({ children }) {
  const [kontakty, setKontakty] = useState(() => wczytajKontakty())

  const odswierz = useCallback(() => {
    setKontakty(wczytajKontakty())
  }, [])

  return (
    <KontaktyContext.Provider value={{ kontakty, odswierz }}>
      {children}
    </KontaktyContext.Provider>
  )
}

export const useKontakty = () => useContext(KontaktyContext)
