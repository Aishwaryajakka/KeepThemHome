import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppHeader from '@/components/AppHeader';

const resetDemo = vi.fn();
vi.mock('@/demo/DemoModeProvider', () => ({ DEMO_MODE_KEY: 'keep-them-home:demo-mode', useDemoMode: () => ({ active: true, reset: resetDemo, enable: vi.fn() }) }));

vi.mock('@clerk/react', () => {
  const UserButton = ({ children }: { children?: ReactNode }) => <div data-testid="account-menu">{children}</div>;
  UserButton.MenuItems = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  UserButton.Link = ({ href, label }: { href: string; label: string }) => <a href={href}>{label}</a>;
  return { UserButton };
});

describe('authenticated application header', () => {
  it('contains only product navigation and the Clerk account control', () => {
    render(<MemoryRouter initialEntries={['/my-pets']}><AppHeader /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Keep Them Home Homepage' })).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('link', { name: 'Dashboard' })[0]).toHaveAttribute('href', '/dashboard');
    expect(screen.getAllByRole('link', { name: 'My Pets' })[0]).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('account-menu')).toBeInTheDocument();
    expect(screen.queryByText('How it works')).not.toBeInTheDocument();
    expect(screen.queryByText('Demo Mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Find options')).not.toBeInTheDocument();
    expect(resetDemo).toHaveBeenCalled();
  });
});
