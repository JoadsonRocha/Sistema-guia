import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ScrollToTop } from './components/routing/ScrollToTop';
import App from './App.tsx';
import './index.css';
import { SupabaseProvider } from './lib/SupabaseProvider.tsx';
import { GlobalToastHost } from './components/GlobalToastHost';

// Global Error Catch for initialization
window.addEventListener('error', (event) => {
  console.warn('Startup warning or handled error caught:', event.message || event.error);
});

// Auto-reload quando um chunk JS (lazy load) não é encontrado após um novo deploy no servidor
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Deploy mismatch detected (chunk not found). Reloading page to fetch latest version...');
  window.location.reload();
});

window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  const reason = event.reason;
  if (
    reason?.code === 'auth/cancelled-popup-request' ||
    reason?.code === 'unavailable' ||
    reason?.message?.includes('failed to fetch')
  ) {
    console.warn('Background promise rejected (handled):', reason?.message || reason);
  } else {
    console.warn('Unhandled promise rejection captured safely:', reason?.message || reason);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <SupabaseProvider>
        <GlobalToastHost />
        <App />
      </SupabaseProvider>
    </BrowserRouter>
  </StrictMode>,
);
