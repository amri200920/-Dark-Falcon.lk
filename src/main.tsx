import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './client/contexts/ThemeContext';
import { AuthProvider } from './client/contexts/AuthContext';
import { SocketProvider } from './client/contexts/SocketContext';
import { CallProvider } from './client/contexts/CallContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <App />
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('🦅 Dark Falcon PWA Service Worker registered:', reg.scope))
      .catch((err) => console.warn('PWA Service Worker registration skipped:', err));
  });
}

