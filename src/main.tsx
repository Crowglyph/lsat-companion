import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

// Capture early errors before React mounts (e.g. import failures, syntax errors
// in the bundle). These would otherwise be silent on a phone.
window.addEventListener('error', (e) => {
  const root = document.getElementById('root')!
  if (!root.hasChildNodes()) {
    root.innerHTML = `
      <div style="padding:1.5rem;font-family:system-ui,sans-serif;color:#f4e8d2;background:#1c1410;height:100dvh;overflow-y:auto;font-size:13px">
        <h2>Early script error</h2>
        <pre style="white-space:pre-wrap;font-size:11px;background:rgba(0,0,0,0.4);padding:.75rem;border-radius:8px">${e.message}\n${e.filename}:${e.lineno}</pre>
      </div>
    `
  }
})

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (e) {
  document.getElementById('root')!.innerHTML = `
    <div style="padding:1.5rem;font-family:system-ui,sans-serif;color:#f4e8d2;background:#1c1410;height:100dvh;overflow-y:auto">
      <h2>createRoot failed</h2>
      <pre style="white-space:pre-wrap;font-size:11px;background:rgba(0,0,0,0.4);padding:.75rem;border-radius:8px">${e}</pre>
    </div>
  `
}
