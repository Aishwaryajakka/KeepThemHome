import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import AuthenticatedHome from '@/components/AuthenticatedHome';
import Footer from '@/components/Footer';

export default function DashboardPage() {
  const navigate = useNavigate();
  return <div className="flex min-h-screen flex-col bg-[var(--cream)]"><AppHeader /><main className="flex-1"><section className="mx-auto max-w-[1380px] px-5 py-12 sm:px-8 lg:px-12"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--forest)]/65">Dashboard</p><h1 className="mt-2 font-serif text-4xl text-[var(--forest)] sm:text-5xl">Here’s what needs attention today.</h1><p className="mt-3 text-lg text-[var(--text-muted)]">Continue active cases and take the next useful action.</p></section><AuthenticatedHome active onStart={() => navigate('/')} onContinue={(petId, caseId) => navigate(`/pets/${petId}/cases/${caseId}`)} onViewAll={() => navigate('/my-pets')} /></main><Footer variant="product" /></div>;
}
