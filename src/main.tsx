import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { SupabaseProvider } from './lib/SupabaseProvider.tsx';
import { GlobalToastHost } from './components/GlobalToastHost';

// Global Error Catch for initialization
window.addEventListener('error', (event) => {
  console.warn('Startup warning or handled error caught:', event.message || event.error);
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
      <SupabaseProvider>
        <GlobalToastHost />
        <App />
      </SupabaseProvider>
    </BrowserRouter>
  </StrictMode>,
);
