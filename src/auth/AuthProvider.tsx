import { ClerkProvider, useAuth, useClerk } from '@clerk/react';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { configureAuthTokenProvider } from '@/lib/case-api';

interface AppAuth {
  configured: boolean;
  loaded: boolean;
  signedIn: boolean;
  openSignIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AppAuth>({
  configured: false, loaded: true, signedIn: false,
  openSignIn: () => undefined, signOut: async () => undefined,
});

const ClerkAuthBridge = ({ children }: { children: ReactNode }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const clerk = useClerk();
  useEffect(() => {
    configureAuthTokenProvider(() => getToken());
    return () => configureAuthTokenProvider(undefined);
  }, [getToken]);
  return (
    <AuthContext.Provider value={{
      configured: true,
      loaded: isLoaded,
      signedIn: Boolean(isSignedIn),
      openSignIn: () => clerk.openSignIn(),
      signOut: () => clerk.signOut(),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
  if (!publishableKey) return <AuthContext.Provider value={{ configured: false, loaded: true, signedIn: false, openSignIn: () => undefined, signOut: async () => undefined }}>{children}</AuthContext.Provider>;
  return <ClerkProvider publishableKey={publishableKey}><ClerkAuthBridge>{children}</ClerkAuthBridge></ClerkProvider>;
};

export const useAppAuth = () => useContext(AuthContext);
