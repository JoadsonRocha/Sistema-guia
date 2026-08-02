import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './lib/FirebaseProvider.tsx';

// Global Error Catch for initialization
window.addEventListener('error', (event) => {
  console.warn('Startup warning or handled error caught:', event.message || event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  const reason = event.reason;
  // Ignore harmless background rejections like popup cancellation or firestore network offline
  if (
    reason?.code === 'auth/cancelled-popup-request' ||
    reason?.code === 'unavailable' ||
    reason?.message?.includes('Could not reach Cloud Firestore backend') ||
    reason?.message?.includes('failed to fetch')
  ) {
    console.warn('Background promise rejected (handled):', reason?.message || reason);
  } else {
    console.warn('Unhandled promise rejection captured safely:', reason?.message || reason);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </StrictMode>,
);
