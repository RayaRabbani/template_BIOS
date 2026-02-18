'use client';

import { createContext, useContext, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { AxiosInstance } from 'axios';
import { createApiClient } from '@/lib/api';

type ApiContextType = {
  apiClient: AxiosInstance;
  isAuthenticated: boolean;
};

const ApiContext = createContext<ApiContextType | undefined>(undefined);

type Props = {
  children?: React.ReactNode;
};

export function ApiProvider({ children }: Props) {
  const { data: session } = useSession();

  const apiClient = useMemo(() => {
    const token = session?.idToken || session?.legacyIdToken;
    return createApiClient(token);
  }, [session?.idToken, session?.legacyIdToken]);

  const value = useMemo(
    () => ({
      apiClient,
      isAuthenticated: !!session,
    }),
    [apiClient, session]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
