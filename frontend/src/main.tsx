import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Repare nas chavetas { } à volta do FormScreen!
import { FormScreen } from './views/FormScreen/FormScreen'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Fundo para centralizar e dar destaque ao painel */}
    <div style={{ 
      width: '100vw', 
      minHeight: '100vh', 
      backgroundColor: '#f4f6f8', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '2rem',
      boxSizing: 'border-box'
    }}>
      <FormScreen />
    </div>
  </StrictMode>,
)