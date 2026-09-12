import { UserButton } from '@clerk/react';
import { LayoutDashboard, PawPrint } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLockup } from './Header';

const navClass = (active: boolean) => `brand-focus rounded-md px-3 py-2 text-sm font-semibold transition-colors ${active ? 'bg-[var(--sage)]/25 text-[var(--forest)]' : 'text-[var(--text-muted)] hover:text-[var(--forest)]'}`;

export default function AppHeader() {
  const location = useLocation();
  return <header className="sticky top-0 z-30 border-b border-[var(--border-warm)]/70 bg-[var(--cream)]/95 backdrop-blur-md"><div className="mx-auto flex min-h-[68px] max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
    <Link to="/" className="brand-focus rounded-md" aria-label="Keep Them Home Homepage"><BrandLockup compact /></Link>
    <div className="flex items-center gap-2 sm:gap-4"><nav className="hidden items-center gap-1 sm:flex" aria-label="Application navigation"><Link to="/dashboard" aria-current={location.pathname === '/dashboard' ? 'page' : undefined} className={navClass(location.pathname === '/dashboard')}>Dashboard</Link><Link to="/my-pets" aria-current={location.pathname === '/my-pets' ? 'page' : undefined} className={navClass(location.pathname === '/my-pets')}>My Pets</Link></nav><UserButton><UserButton.MenuItems><UserButton.Link href="/dashboard" label="Dashboard" labelIcon={<LayoutDashboard className="h-4 w-4" />} /><UserButton.Link href="/my-pets" label="My Pets" labelIcon={<PawPrint className="h-4 w-4" />} /></UserButton.MenuItems></UserButton></div>
  </div></header>;
}
