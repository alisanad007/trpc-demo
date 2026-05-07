import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { createTrpcClient, trpc } from './trpc';
import { DEMO_TOKEN, clearToken, loadToken, saveToken } from './utils/auth';

import './index.css';

// Restore the token from localStorage so auth survives page refreshes.
const authToken = { current: loadToken() };

// QueryClient is shared between React Query and the tRPC provider.
const queryClient = new QueryClient();

// tRPC client is created once; the headers factory reads authToken.current on every request.
const trpcClient = createTrpcClient(() => authToken.current);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

function Root() {
  // Seed initial state from the persisted token so the button renders correctly on load.
  const [isAuthenticated, setIsAuthenticated] = useState(authToken.current !== null);

  function toggleAuth() {
    const next = !isAuthenticated;
    if (next) {
      // Persist and expose the demo token to the tRPC headers factory.
      saveToken();
      authToken.current = DEMO_TOKEN;
    } else {
      clearToken();
      authToken.current = null;
    }
    setIsAuthenticated(next);
    // Invalidate all cached queries so the UI reflects the new auth state immediately.
    void queryClient.invalidateQueries();
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App isAuthenticated={isAuthenticated} onToggleAuth={toggleAuth} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
