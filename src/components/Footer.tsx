import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLockup } from '@/components/Header';

export const Footer: React.FC = () => <footer className="border-t border-[var(--border-warm)]/60 bg-[var(--cream)] py-7"><div className="mx-auto flex max-w-[1380px] flex-col items-center justify-between gap-7 px-5 text-center sm:px-8 lg:flex-row lg:text-left">
  <BrandLockup compact />
  <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-[var(--charcoal)]/80" aria-label="Footer navigation"><a href="/#how-it-works">How it works</a><a href="/#what-we-help">What we help</a><a href="/#our-promise">Our promise</a><Link to="/my-pets">My Pets</Link></nav>
  <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-[10px] text-[var(--charcoal)]/65"><span>Privacy Policy</span><span>Terms</span><span>Contact</span><span>© {new Date().getFullYear()} Keep Them Home</span></div>
</div></footer>;
export default Footer;
