import React from 'react';
import { UserButton } from '@clerk/react';
import { ArrowLeft, ArrowRight, CircleDot, PawPrint } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppAuth } from '@/auth/AuthProvider';
import { useDemoMode } from '@/demo/DemoModeProvider';
import { factorLabel, urgencyLabel } from '@/lib/presentation';

interface HeaderProps {
  onCtaClick?: () => void;
  onStart?: () => void;
  variant?: 'marketing' | 'product';
  petName?: string;
  petType?: string;
  factors?: string[];
  urgency?: string;
  saved?: boolean;
}

const BrandLockup = ({ compact = false }: { compact?: boolean }) => (
  <span className="flex items-center gap-2.5">
    <span className={`${compact ? 'h-10 w-10' : 'h-[54px] w-[54px]'} relative shrink-0 overflow-hidden`} aria-hidden="true"><img src="/images/logo.png" alt="" className={`${compact ? 'w-[78px] -translate-x-[17px] -translate-y-[11px]' : 'w-[104px] -translate-x-[22px] -translate-y-[14px]'} absolute max-w-none mix-blend-multiply`} /></span>
    <span className="min-w-0 text-left"><span className={`${compact ? 'text-lg' : 'text-[24px] sm:text-[27px]'} block whitespace-nowrap font-serif font-semibold leading-none text-[var(--forest)]`}>Keep Them Home</span><span className={`${compact ? 'text-[6px]' : 'text-[7px] sm:text-[8px]'} mt-1 block whitespace-nowrap font-semibold uppercase tracking-[0.08em] text-[var(--forest)]/80`}>Solutions today. More tomorrows together.</span></span>
  </span>
);

const AccountMenu = () => <UserButton><UserButton.MenuItems><UserButton.Link href="/dashboard" label="Dashboard" labelIcon={<PawPrint className="h-4 w-4" />} /></UserButton.MenuItems></UserButton>;

export const Header: React.FC<HeaderProps> = ({
  onCtaClick, onStart, variant = 'marketing', petName, petType, factors = [], urgency, saved = false,
}) => {
  const auth = useAppAuth();
  const demo = useDemoMode();
  const navigate = useNavigate();
  const handleDemo = () => { if (demo.active) demo.reset(); else demo.enable(); navigate('/'); };
  if (variant === 'product') return <header className="sticky top-0 z-30 w-full border-b border-[var(--border-warm)]/70 bg-[var(--cream)]/95 backdrop-blur-md">
    <div className="mx-auto flex min-h-[68px] max-w-[1360px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <Link to={auth.signedIn ? '/dashboard' : '/'} onClick={(event) => { if (onCtaClick) { event.preventDefault(); onCtaClick(); } }} className="brand-focus rounded-md" aria-label={auth.signedIn ? 'Keep Them Home dashboard' : 'Keep Them Home Homepage'}><BrandLockup compact /></Link>
      {(petName || factors.length > 0) && <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 md:flex" aria-label="Active case context"><div className="min-w-0 text-right"><p className="truncate font-serif text-lg text-[var(--forest)]">{petName || 'Your pet'}</p>{petType && <p className="text-xs capitalize text-[var(--text-muted)]">{petType}</p>}</div>{factors.length > 0 && <><span className="h-8 w-px bg-[var(--border-warm)]" aria-hidden="true" /><div className="flex flex-wrap items-center gap-1.5">{factors.slice(0, 3).map((factor) => <span key={factor} className="rounded-full bg-[var(--sage)]/18 px-2.5 py-1 text-[11px] font-semibold text-[var(--forest)]">{factorLabel(factor)}</span>)}{factors.length > 3 && <span className="text-[11px] font-semibold text-[var(--text-muted)]">+{factors.length - 3} more</span>}{urgencyLabel(urgency) && <span className="ml-1 text-[11px] text-[var(--text-muted)]">{urgencyLabel(urgency)}</span>}</div></>}</div>}
      {auth.signedIn && <nav className="hidden items-center gap-5 text-sm font-semibold text-[var(--forest)] lg:flex" aria-label="Product navigation"><Link to="/dashboard" className="brand-focus rounded px-2 py-2">Dashboard</Link><Link to="/dashboard#pets" className="brand-focus rounded px-2 py-2">My Pets</Link></nav>}<div className="flex items-center gap-2">{demo.active && <span className="rounded-full bg-[var(--status-conditional-bg)] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[var(--status-conditional-text)] sm:text-xs">LUNA DEMO</span>}{saved && <span className="hidden rounded-full bg-[var(--status-feasible-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--status-feasible-text)] sm:inline">✓ Saved</span>}{auth.configured && auth.signedIn ? <AccountMenu /> : auth.configured && auth.status === 'SIGNED_OUT' ? <button type="button" onClick={auth.openSignIn} className="brand-focus hidden rounded-md px-2 py-2 text-xs font-semibold text-[var(--forest)] sm:block">Sign in</button> : null}{onCtaClick && <button type="button" onClick={onCtaClick} className="brand-focus inline-flex min-h-10 items-center rounded-md px-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--forest)]"><ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />{auth.signedIn ? 'Back to Dashboard' : 'Exit case'}</button>}</div>
    </div>
    {auth.status === 'AUTH_ERROR' && <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-900" role="alert">We’re signed in, but couldn’t connect your account. <button type="button" onClick={auth.retry} className="brand-focus ml-2 rounded font-bold underline">Retry</button></div>}{demo.active && <div aria-label="Demo scenario" className="border-t border-[var(--border-warm)]/60 bg-[var(--status-conditional-bg)]/55 px-4 py-1.5 text-center text-[11px] text-[var(--status-conditional-text)] sm:text-xs">Temporary demo — nothing is saved unless you choose to save it. <button type="button" onClick={demo.reset} className="brand-focus ml-2 rounded font-bold underline underline-offset-2">Reset demo</button></div>}
  </header>;
  return <header className="sticky top-0 z-30 w-full border-b border-[var(--border-warm)]/60 bg-[var(--cream)]/95 backdrop-blur-md"><div className="mx-auto flex min-h-[76px] max-w-[1380px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
    <a href="/" onClick={(event) => { if (onCtaClick) { event.preventDefault(); onCtaClick(); } }} className="brand-focus rounded-md" aria-label="Keep Them Home Homepage"><BrandLockup /></a>
    <nav className="hidden items-center gap-7 text-[13px] font-medium text-[var(--charcoal)] lg:flex" aria-label="Primary navigation">{auth.signedIn ? <><Link to="/dashboard" className="landing-nav-link brand-focus rounded-sm">Dashboard</Link><Link to="/dashboard#pets" className="landing-nav-link brand-focus rounded-sm">My Pets</Link></> : <><a href="/#how-it-works" className="landing-nav-link brand-focus rounded-sm">How it works</a><a href="/#what-we-help" className="landing-nav-link brand-focus rounded-sm">What we help</a><a href="/#our-promise" className="landing-nav-link brand-focus rounded-sm">Our promise</a></>}</nav>
    <div className="flex items-center gap-2 sm:gap-3">{auth.configured && auth.signedIn ? <AccountMenu /> : auth.configured ? <button type="button" onClick={auth.openSignIn} className="brand-focus hidden rounded-md px-2 py-2 text-xs font-semibold text-[var(--forest)] sm:block">Sign in</button> : null}<Link to="/my-pets" className="brand-focus rounded-md px-1.5 py-2 text-xs text-[var(--forest)] lg:hidden">My Pets</Link><button type="button" onClick={handleDemo} aria-label="Demo Mode" aria-pressed={demo.active} className={`brand-focus inline-flex min-h-10 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4 ${demo.active ? 'bg-[var(--sage)] text-[var(--forest)] ring-2 ring-[var(--forest)]/35' : 'bg-[var(--sage)]/20 text-[var(--forest)] hover:bg-[var(--sage)]/35'}`}><CircleDot className="h-3.5 w-3.5" aria-hidden="true" /><span className="hidden min-[420px]:inline">Demo Mode</span></button>{onStart ? <button type="button" onClick={onStart} className="landing-cta brand-focus hidden min-h-11 items-center rounded-full bg-[var(--forest)] px-5 text-sm font-semibold text-[var(--cream)] shadow-sm hover:bg-[var(--forest-deep)] sm:inline-flex">Find options <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></button> : null}</div>
  </div></header>;
};
export { BrandLockup };
export default Header;
