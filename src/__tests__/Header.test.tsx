import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Header from '@/components/Header';

const signOut = vi.fn();
vi.mock('@/auth/AuthProvider', () => ({
  useAppAuth: () => ({ configured: true, loaded: true, signedIn: true, serverReady: true, status: 'SIGNED_IN_READY', error: null, signingOut: false, openSignIn: vi.fn(), signOut, retry: vi.fn() }),
}));
vi.mock('@/demo/DemoModeProvider', () => ({
  useDemoMode: () => ({ active: false, enable: vi.fn(), reset: vi.fn() }),
}));
vi.mock('@clerk/react', () => {
  const UserButton = ({ children }: { children?: ReactNode }) => <div data-testid="account-menu">{children}</div>;
  UserButton.MenuItems = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  UserButton.Link = ({ href, label }: { href: string; label: string }) => <a href={href}>{label}</a>;
  return { UserButton };
});

describe('product header account and exit behavior', () => {
  it('keeps Dashboard in the account menu and removes primary Sign out', () => {
    render(<MemoryRouter><Header variant="product" onCtaClick={vi.fn()} petName="Luna" petType="dog" factors={['housing']} /></MemoryRouter>);
    expect(screen.getByTestId('account-menu')).toContainElement(screen.getAllByRole('link', { name: 'Dashboard' }).find((link) => link.closest('[data-testid="account-menu"]'))!);
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('Exit leaves the assessment without signing the account out', async () => {
    const onExit = vi.fn();
    const user = userEvent.setup();
    render(<MemoryRouter><Header variant="product" onCtaClick={onExit} /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Back to Dashboard' }));
    expect(onExit).toHaveBeenCalledOnce();
    expect(signOut).not.toHaveBeenCalled();
  });
});
