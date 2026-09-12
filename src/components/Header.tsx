import React from 'react';
import { UserButton } from '@clerk/react';
import { ArrowRight, CircleDot } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppAuth } from '@/auth/AuthProvider';
import { useDemoMode } from '@/demo/DemoModeProvider';

interface HeaderProps { onCtaClick?: () => void; onStart?: () => void; }

const BrandLockup = ({ compact = false }: { compact?: boolean }) => (
  <span className="flex items-center gap-2.5">
    <span className={`${compact ? 'h-10 w-10' : 'h-[54px] w-[54px]'} relative shrink-0 overflow-hidden`} aria-hidden="true"><img src="/images/logo.png" alt="" className={`${compact ? 'w-[78px] -translate-x-[17px] -translate-y-[11px]' : 'w-[104px] -translate-x-[22px] -translate-y-[14px]'} absolute max-w-none mix-blend-multiply`} /></span>
    <span className="min-w-0 text-left"><span className={`${compact ? 'text-lg' : 'text-[24px] sm:text-[27px]'} block whitespace-nowrap font-serif font-semibold leading-none text-[var(--forest)]`}>Keep Them Home</span><span className={`${compact ? 'text-[6px]' : 'text-[7px] sm:text-[8px]'} mt-1 block whitespace-nowrap font-semibold uppercase tracking-[0.08em] text-[var(--forest)]/80`}>Solutions today. More tomorrows together.</span></span>
  </span>
);

export const Header: React.FC<HeaderProps> = ({ onCtaClick, onStart }) => {
  const auth = useAppAuth();
  const demo = useDemoMode();
  const navigate = useNavigate();
  const handleDemo = () => { if (demo.active) demo.reset(); else demo.enable(); navigate('/'); };
  return <header className="sticky top-0 z-30 w-full border-b border-[var(--border-warm)]/60 bg-[var(--cream)]/95 backdrop-blur-md"><div className="mx-auto flex min-h-[76px] max-w-[1380px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
    <a href="/" onClick={(event) => { if (onCtaClick) { event.preventDefault(); onCtaClick(); } }} className="brand-focus rounded-md" aria-label="Keep Them Home Homepage"><BrandLockup /></a>
    <nav className="hidden items-center gap-7 text-[13px] font-medium text-[var(--charcoal)] lg:flex" aria-label="Primary navigation"><a href="/#how-it-works" className="landing-nav-link brand-focus rounded-sm">How it works</a><a href="/#what-we-help" className="landing-nav-link brand-focus rounded-sm">What we help</a><a href="/#our-promise" className="landing-nav-link brand-focus rounded-sm">Our promise</a><Link to="/my-pets" className="landing-nav-link brand-focus rounded-sm">My Pets</Link></nav>
    <div className="flex items-center gap-2 sm:gap-3">{auth.configured && auth.signedIn ? <UserButton /> : auth.configured ? <button type="button" onClick={auth.openSignIn} className="brand-focus hidden rounded-md px-2 py-2 text-xs font-semibold text-[var(--forest)] sm:block">Sign in</button> : null}<Link to="/my-pets" className="brand-focus rounded-md px-1.5 py-2 text-xs text-[var(--forest)] lg:hidden">My Pets</Link><button type="button" onClick={handleDemo} aria-label="Demo Mode" aria-pressed={demo.active} className={`brand-focus inline-flex min-h-10 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4 ${demo.active ? 'bg-[var(--sage)] text-[var(--forest)] ring-2 ring-[var(--forest)]/35' : 'bg-[var(--sage)]/20 text-[var(--forest)] hover:bg-[var(--sage)]/35'}`}><CircleDot className="h-3.5 w-3.5" aria-hidden="true" /><span className="hidden min-[420px]:inline">Demo Mode</span></button>{onStart ? <button type="button" onClick={onStart} className="landing-cta brand-focus hidden min-h-11 items-center rounded-full bg-[var(--forest)] px-5 text-sm font-semibold text-[var(--cream)] shadow-sm hover:bg-[var(--forest-deep)] sm:inline-flex">Find options <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></button> : null}</div>
  </div></header>;
};
export { BrandLockup };
export default Header;
