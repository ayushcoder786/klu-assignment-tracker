import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Auto-register service worker for PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, reload to update.');
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
