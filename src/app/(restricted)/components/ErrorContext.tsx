'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface ErrorContextValue {
  error: string | null;
  setError: (msg: string | null) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function useErrorContext() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error('useErrorContext must be inside ErrorContextProvider');
  return ctx;
}

export default function ErrorContextProvider({ children }: { children: React.ReactNode }) {
  const [error, setErrorState] = useState<string | null>(null);
  const setError = useCallback((msg: string | null) => setErrorState(msg), []);
  const clearError = useCallback(() => setErrorState(null), []);

  return (
    <ErrorContext.Provider value={{ error, setError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
}
