import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { queryClient } from './api/react-query';
import { AuthProvider } from './context/auth';

import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

function Root() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
