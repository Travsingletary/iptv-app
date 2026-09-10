import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useIptvStore } from './store/useIptvStore'

// E2E / debug bridge — same module instance React uses (avoids Vite dual-import drift).
;(window as unknown as { __AETHER_STORE__?: typeof useIptvStore }).__AETHER_STORE__ =
  useIptvStore

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
