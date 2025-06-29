import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedApi } from '@/lib/api';
import { useMemo } from 'react';

/**
 * Custom hook for getting an authenticated API instance
 * Uses Clerk's getToken to automatically add JWT to requests
 */
export const useAuthenticatedApi = () => {
  const { getToken, isSignedIn } = useAuth();

  const api = useMemo(() => {
    if (!isSignedIn || !getToken) {
      return null;
    }
    return createAuthenticatedApi(getToken);
  }, [getToken, isSignedIn]);

  return {
    api,
    isAuthenticated: isSignedIn && !!getToken,
  };
}; 