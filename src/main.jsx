import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(26, 26, 62, 0.95)',
            backdropFilter: 'blur(20px)',
            color: '#EAEAFF',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
          },
          success: {
            iconTheme: { primary: '#00E676', secondary: '#0a0a1a' },
          },
          error: {
            iconTheme: { primary: '#FF5252', secondary: '#0a0a1a' },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
