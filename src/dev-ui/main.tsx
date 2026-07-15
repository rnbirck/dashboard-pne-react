import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/public-sans/latin-400.css'
import '@fontsource/public-sans/latin-500.css'
import '@fontsource/public-sans/latin-600.css'
import '@fontsource/public-sans/latin-700.css'
import '@fontsource/source-serif-4/latin-600.css'
import '@fontsource/source-serif-4/latin-700.css'
import '../index.css'
import '../App.css'
import '../styles/chart-system.css'
import '../styles/pne-cycle-experience.css'
import '../styles/platform-ui.css'
import '../styles/financial-pages.css'
import '../styles/navigation-shell.css'
import '../styles/institutional-refresh.css'
import { ComponentCatalog } from './ComponentCatalog'
import './catalog.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Elemento raiz do catálogo visual não encontrado.')
}

createRoot(root).render(
  <StrictMode>
    <ComponentCatalog />
  </StrictMode>,
)
