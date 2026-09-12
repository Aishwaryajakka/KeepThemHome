import { ClerkProvider, useAuth, useClerk } from '@clerk/react';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { caseApi, configureAuthTokenProvider } from '@/lib/case-api';
import { clearClientSessionState } from '@/lib/client-session';

export type AppAuthStatus = 'AUTH_LOADING' | 'SIGNED_OUT' | 'SIGNED_IN_SERVER_CHECKING' | 'SIGNED_IN_READY' | 'AUTH_ERROR';

interface AppAuth {
  configured: boolean;
  loaded: boolean;
  signedIn: boolean;
  serverReady: boolean;
  status: AppAuthStatus;
  error: string | null;
  signingOut: boolean;
  openSignIn: () => void;
  signOut: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AppAuth>({
  configured: false, loaded: true, signedIn: false, serverReady: false, status: 'SIGNED_OUT', error: null, signingOut: false,
  openSignIn: () => undefined, signOut: async () => undefined, retry: () => undefined,
});

export const ClerkAuthBridge = ({ children }: { children: ReactNode }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const clerk = useClerk();
  const [tokenProviderReady, setTokenProviderReady] = useState(false);
  const [serverAuth, setServerAuth] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');
  const [retryKey, setRetryKey] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
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
    if (!isLoaded || !tokenProviderReady) return;
    if (!isSignedIn) { setServerAuth('idle'); return; }
    let active = true;
    setServerAuth('checking');
    console.info('[auth] /api/me session', {
      clerk_loaded: Boolean(isLoaded),
      signed_in: Boolean(isSignedIn),
    });
    void caseApi.getMe().then(() => { if (active) setServerAuth('verified'); })
      .catch(() => { if (active) setServerAuth('failed'); });
    return () => { active = false; };
  }, [isLoaded, isSignedIn, retryKey, tokenProviderReady]);
  useEffect(() => {
    if (isLoaded && wasSignedIn.current && !isSignedIn) {
      clearClientSessionState();
      window.location.replace('/');
    }
    if (isLoaded) wasSignedIn.current = Boolean(isSignedIn);
  }, [isLoaded, isSignedIn]);
  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await clerk.signOut();
      clearClientSessionState();
      window.location.replace('/');
    } catch {
      setSignOutError('We couldn’t sign you out. Try again.');
      setSigningOut(false);
    }
  };
  const status: AppAuthStatus = !isLoaded || !tokenProviderReady ? 'AUTH_LOADING'
    : !isSignedIn ? 'SIGNED_OUT'
      : serverAuth === 'verified' ? 'SIGNED_IN_READY'
        : serverAuth === 'failed' ? 'AUTH_ERROR' : 'SIGNED_IN_SERVER_CHECKING';
  return (
    <AuthContext.Provider value={{
      configured: true,
      loaded: status !== 'AUTH_LOADING' && status !== 'SIGNED_IN_SERVER_CHECKING',
      signedIn: Boolean(isSignedIn),
      serverReady: status === 'SIGNED_IN_READY',
      status,
      error: signOutError ?? (status === 'AUTH_ERROR' ? 'We’re signed in, but couldn’t connect your account.' : null),
      signingOut,
      openSignIn: () => { if (isSignedIn) window.location.assign('/dashboard'); else clerk.openSignIn(); },
      signOut,
      retry: () => setRetryKey((value) => value + 1),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
  if (!publishableKey) return <AuthContext.Provider value={{ configured: false, loaded: true, signedIn: false, serverReady: false, status: 'SIGNED_OUT', error: null, signingOut: false, openSignIn: () => undefined, signOut: async () => undefined, retry: () => undefined }}>{children}</AuthContext.Provider>;
  return <ClerkProvider publishableKey={publishableKey}><ClerkAuthBridge>{children}</ClerkAuthBridge></ClerkProvider>;
};

export const useAppAuth = () => useContext(AuthContext);
