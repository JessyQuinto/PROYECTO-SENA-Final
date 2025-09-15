import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextValue {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key?: string) => boolean;
  isAnyLoading: () => boolean;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (!key) return Object.values(loadingStates).some(Boolean);
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  return (
    <LoadingContext.Provider value={{
      loadingStates,
      setLoading,
      isLoading,
      isAnyLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

// Hook especializado para operaciones de autenticación
export const useAuthLoading = () => {
  const { setLoading, isLoading } = useLoading();

  const setAuthLoading = useCallback((operation: string, loading: boolean) => {
    setLoading(`auth.${operation}`, loading);
  }, [setLoading]);

  const isAuthLoading = useCallback((operation?: string) => {
    if (!operation) return isLoading('auth');
    return isLoading(`auth.${operation}`);
  }, [isLoading]);

  return {
    setAuthLoading,
    isAuthLoading,
    // Operaciones específicas
    setLoginLoading: (loading: boolean) => setAuthLoading('login', loading),
    setLogoutLoading: (loading: boolean) => setAuthLoading('logout', loading),
    setRefreshLoading: (loading: boolean) => setAuthLoading('refresh', loading),
    isLoginLoading: () => isAuthLoading('login'),
    isLogoutLoading: () => isAuthLoading('logout'),
    isRefreshLoading: () => isAuthLoading('refresh')
  };
};