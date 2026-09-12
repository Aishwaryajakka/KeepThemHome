import { ClerkProvider, useAuth, useClerk } from '@clerk/react';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { configureAuthTokenProvider } from '@/lib/case-api';
import { clearClientSessionState } from '@/lib/client-session';

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
  const [tokenProviderReady, setTokenProviderReady] = useState(false);
  const wasSignedIn = useRef(false);
  useEffect(() => {
    configureAuthTokenProvider(() => getToken());
    setTokenProviderReady(true);
    return () => {
      setTokenProviderReady(false);
      configureAuthTokenProvider(undefined);
    };
  }, [getToken]);
  useEffect(() => {
    if (isLoaded && wasSignedIn.current && !isSignedIn) {
      clearClientSessionState();
      window.location.replace('/');
    }
    if (isLoaded) wasSignedIn.current = Boolean(isSignedIn);
  }, [isLoaded, isSignedIn]);
  const signOut = async () => {
    await clerk.signOut();
    clearClientSessionState();
    window.location.replace('/');
  };
  return (
    <AuthContext.Provider value={{
      configured: true,
      loaded: isLoaded && tokenProviderReady,
      signedIn: Boolean(isSignedIn),
      openSignIn: () => clerk.openSignIn(),
      signOut,
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
