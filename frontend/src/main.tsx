import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FormScreen from './views/FormScreen/FormScreen'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FormScreen />
  </StrictMode>,
)
