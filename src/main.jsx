import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Hover effects switch on once a real mouse or trackpad moves (see the
// `hover` variant in index.css). Some touchscreen laptops tell the browser
// they have no mouse at all, so the (hover: hover) media query can't be used;
// phones never send mouse moves, so they don't get "stuck" hover looks.
function detectMouse(event) {
  if (event.pointerType !== 'mouse') return
  document.documentElement.classList.add('has-mouse')
  window.removeEventListener('pointermove', detectMouse)
}
window.addEventListener('pointermove', detectMouse, { passive: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
