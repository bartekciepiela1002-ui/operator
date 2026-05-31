import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { migrateIfNeeded } from './utils/migrate'
import { resetTimerJesliNowyDzien } from './utils/storage'

migrateIfNeeded()
resetTimerJesliNowyDzien()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
