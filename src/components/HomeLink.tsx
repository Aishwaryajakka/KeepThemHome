import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function HomeLink({ children, onNavigate }: { children: ReactNode; onNavigate?: () => void }) {
  return <Link to="/" onClick={onNavigate} className="brand-focus inline-flex min-h-11 cursor-pointer items-center rounded-md" aria-label="Keep Them Home Homepage">{children}</Link>;
}
