import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        richColors
        closeButton
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'border border-border-soft shadow-token-md',
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
