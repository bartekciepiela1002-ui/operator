import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { KontaktyProvider } from './context/KontaktyContext'
import Sidebar from './components/Sidebar'
import WidokDzis from './views/WidokDzis'
import WidokKanban from './views/WidokKanban'
import WidokLista from './views/WidokLista'
import WidokKontakt from './views/WidokKontakt'
import WidokStatystyki from './views/WidokStatystyki'
import WidokArchiwum from './views/WidokArchiwum'
import ModalDodajKontakt from './components/modals/ModalDodajKontakt'
import ModalImportCSV from './components/modals/ModalImportCSV'

export default function App() {
  const [modalDodaj, setModalDodaj] = useState(false)
  const [modalImport, setModalImport] = useState(false)

  return (
    <KontaktyProvider>
      <BrowserRouter>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar
            onDodaj={() => setModalDodaj(true)}
            onImport={() => setModalImport(true)}
          />
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dzis" replace />} />
              <Route path="/dzis" element={<WidokDzis />} />
              <Route path="/kanban" element={<WidokKanban />} />
              <Route path="/lista" element={<WidokLista />} />
              <Route path="/kontakt/:id" element={<WidokKontakt />} />
              <Route path="/statystyki" element={<WidokStatystyki />} />
              <Route path="/archiwum" element={<WidokArchiwum />} />
            </Routes>
          </main>
        </div>

        {modalDodaj && (
          <ModalDodajKontakt onClose={() => setModalDodaj(false)} />
        )}
        {modalImport && (
          <ModalImportCSV onClose={() => setModalImport(false)} />
        )}
      </BrowserRouter>
    </KontaktyProvider>
  )
}
