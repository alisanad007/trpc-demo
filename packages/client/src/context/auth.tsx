import { createContext, useState } from 'react';
import { queryClient } from '../api/react-query';
import { authToken } from '../api/trpc';
import { DEMO_TOKEN, clearToken, saveToken } from '../utils/auth';

export type AuthContextValue = {
  isAuthenticated: boolean;
  toggleAuth: () => void;
};

export const AuthContext = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authToken.current !== null);

  function toggleAuth() {
    const next = !isAuthenticated;
    if (next) {
      saveToken();
      authToken.current = DEMO_TOKEN;
    } else {
      clearToken();
      authToken.current = null;
    }
    setIsAuthenticated(next);
    void queryClient.invalidateQueries();
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, toggleAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
