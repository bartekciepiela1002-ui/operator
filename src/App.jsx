import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { KontaktyProvider } from './context/KontaktyContext'
import { SprintProvider, useSprint } from './context/SprintContext'
import Sidebar from './components/Sidebar'
import ProgressBar from './components/ProgressBar'
import FocusMode from './components/FocusMode'
import WidokDzis from './views/WidokDzis'
import WidokSprint from './views/WidokSprint'
import WidokKanban from './views/WidokKanban'
import WidokLista from './views/WidokLista'
import WidokKontakt from './views/WidokKontakt'
import WidokStatystyki from './views/WidokStatystyki'
import WidokArchiwum from './views/WidokArchiwum'
import ModalDodajKontakt from './components/modals/ModalDodajKontakt'
import ModalImportCSV from './components/modals/ModalImportCSV'
import WidokUstawienia from './views/WidokUstawienia'
import WidokDigest from './views/WidokDigest'

function AppContent() {
  const [modalDodaj, setModalDodaj] = useState(false)
  const [modalImport, setModalImport] = useState(false)
  const { focusModeOpen, setFocusModeOpen } = useSprint()

  return (
    <div className="flex flex-col h-screen bg-crm-base overflow-hidden">
      <ProgressBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onDodaj={() => setModalDodaj(true)}
          onImport={() => setModalImport(true)}
        />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route index element={<Navigate to="/dzis" replace />} />
            <Route path="/" element={<Navigate to="/dzis" replace />} />
            <Route path="/sprint" element={<WidokSprint />} />
            <Route path="/dzis" element={<WidokDzis />} />
            <Route path="/kanban" element={<WidokKanban />} />
            <Route path="/lista" element={<WidokLista />} />
            <Route path="/kontakt/:id" element={<WidokKontakt />} />
            <Route path="/statystyki" element={<WidokStatystyki />} />
            <Route path="/archiwum" element={<WidokArchiwum />} />
            <Route path="/digest" element={<WidokDigest />} />
            <Route path="/ustawienia" element={<WidokUstawienia />} />
          </Routes>
        </main>
      </div>
      {focusModeOpen && <FocusMode onClose={() => setFocusModeOpen(false)} />}
      {modalDodaj && <ModalDodajKontakt onClose={() => setModalDodaj(false)} />}
      {modalImport && <ModalImportCSV onClose={() => setModalImport(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <KontaktyProvider>
      <SprintProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SprintProvider>
    </KontaktyProvider>
  )
}
