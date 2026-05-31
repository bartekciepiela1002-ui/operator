import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { OperatorProvider, useOperator } from './context/OperatorContext'
import Sidebar from './components/Sidebar'
import DayStatusBar from './components/DayStatusBar'
import TimerBubble from './components/TimerBubble'
import FocusMode from './components/FocusMode'
import WidokDzis from './views/WidokDzis'
import WidokSprint from './views/WidokSprint'
import WidokKanban from './views/WidokKanban'
import WidokLista from './views/WidokLista'
import WidokKontakt from './views/WidokKontakt'
import WidokStatystyki from './views/WidokStatystyki'
import WidokArchiwum from './views/WidokArchiwum'
import WidokDigest from './views/WidokDigest'
import WidokUstawienia from './views/WidokUstawienia'
import WidokChallenge from './views/WidokChallenge'
import WidokStoper from './views/WidokStoper'
import ModalDodajKontakt from './components/modals/ModalDodajKontakt'
import ModalImportCSV from './components/modals/ModalImportCSV'

function AppContent() {
  const [modalDodaj, setModalDodaj] = useState(false)
  const [modalImport, setModalImport] = useState(false)
  const { focusModeOpen, setFocusModeOpen } = useOperator()

  return (
    <div className="flex flex-col h-screen bg-crm-base overflow-hidden">
      <DayStatusBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onDodaj={() => setModalDodaj(true)}
          onImport={() => setModalImport(true)}
        />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route index element={<Navigate to="/dzis" replace />} />
            <Route path="/" element={<Navigate to="/dzis" replace />} />
            <Route path="/dzis" element={<WidokDzis />} />
            <Route path="/challenge" element={<WidokChallenge />} />
            <Route path="/sprint" element={<WidokSprint />} />
            <Route path="/kanban" element={<WidokKanban />} />
            <Route path="/lista" element={<WidokLista />} />
            <Route path="/kontakt/:id" element={<WidokKontakt />} />
            <Route path="/statystyki" element={<WidokStatystyki />} />
            <Route path="/archiwum" element={<WidokArchiwum />} />
            <Route path="/digest" element={<WidokDigest />} />
            <Route path="/stoper" element={<WidokStoper />} />
            <Route path="/ustawienia" element={<WidokUstawienia />} />
          </Routes>
        </main>
      </div>
      <TimerBubble />
      {focusModeOpen && <FocusMode onClose={() => setFocusModeOpen(false)} />}
      {modalDodaj && <ModalDodajKontakt onClose={() => setModalDodaj(false)} />}
      {modalImport && <ModalImportCSV onClose={() => setModalImport(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <OperatorProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </OperatorProvider>
  )
}
