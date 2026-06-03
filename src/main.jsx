import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { CreditProvider } from './contexts/CreditContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CreditProvider>
          <App />
        </CreditProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
