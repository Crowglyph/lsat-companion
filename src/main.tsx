import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (e) {
  document.getElementById('root')!.innerHTML = `
    <div style="padding:2rem;font-family:sans-serif;color:#f4e8d2;background:#1c1410">
      <h2>Something went wrong</h2>
      <pre style="white-space:pre-wrap;font-size:12px">${e}</pre>
    </div>
  `
}
