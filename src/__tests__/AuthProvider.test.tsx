import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClerkAuthBridge, useAppAuth } from '@/auth/AuthProvider';
import { caseApi } from '@/lib/case-api';

const clerkState = vi.hoisted(() => ({
  isLoaded: true,
  isSignedIn: false,
  getToken: vi.fn(async () => 'session-token'),
  openSignIn: vi.fn(),
  signOut: vi.fn(async () => undefined),
}));

vi.mock('@clerk/react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ isLoaded: clerkState.isLoaded, isSignedIn: clerkState.isSignedIn, getToken: clerkState.getToken }),
  useClerk: () => ({ openSignIn: clerkState.openSignIn, signOut: clerkState.signOut }),
}));

const Probe = () => {
  const auth = useAppAuth();
  return <div><output aria-label="Auth status">{auth.status}</output><output aria-label="Signed in">{String(auth.signedIn)}</output>{auth.status === 'SIGNED_OUT' && <button onClick={auth.openSignIn}>Sign in</button>}{auth.status === 'AUTH_ERROR' && <button onClick={auth.retry}>Retry</button>}</div>;
};

describe('canonical application auth state', () => {
  beforeEach(() => {
    clerkState.isLoaded = true;
    clerkState.isSignedIn = false;
    vi.restoreAllMocks();
  });

  it('shows signed out only when Clerk says signed out', async () => {
    const getMe = vi.spyOn(caseApi, 'getMe');
    render(<ClerkAuthBridge><Probe /></ClerkAuthBridge>);
    expect(await screen.findByText('SIGNED_OUT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(getMe).not.toHaveBeenCalled();
  });

  it('becomes ready only after the server verifies the Clerk session', async () => {
    clerkState.isSignedIn = true;
    vi.spyOn(caseApi, 'getMe').mockResolvedValue({ user: { id: 'internal-1', clerkUserId: 'user_1', email: null, createdAt: '2026-09-12T00:00:00.000Z' } });
    render(<ClerkAuthBridge><Probe /></ClerkAuthBridge>);
    expect(await screen.findByText('SIGNED_IN_READY')).toBeInTheDocument();
    expect(screen.getByLabelText('Signed in')).toHaveTextContent('true');
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('keeps Clerk signed-in truth when the server check fails', async () => {
    clerkState.isSignedIn = true;
    vi.spyOn(caseApi, 'getMe').mockRejectedValue(new Error('Server unavailable'));
    render(<ClerkAuthBridge><Probe /></ClerkAuthBridge>);
    expect(await screen.findByText('AUTH_ERROR')).toBeInTheDocument();
    expect(screen.getByLabelText('Signed in')).toHaveTextContent('true');
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    await waitFor(() => expect(caseApi.getMe).toHaveBeenCalledOnce());
  });
});
