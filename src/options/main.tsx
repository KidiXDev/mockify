import { AlertProvider } from '@/components/providers/alert-provider';
import '@/index.css';
import App from '@/options/App';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AlertProvider>
      <App />
    </AlertProvider>
  </StrictMode>
);
