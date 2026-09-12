import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/auth/AuthProvider';
import { caseApi, SAVED_PLANS_CHANGED_EVENT, type ActionsResponse, type RetentionPathResult, type SavedCaseSummary } from '@/lib/case-api';
import { ArrowRight, Heart, PawPrint } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { factorLabel } from '@/lib/presentation';
import { useDemoMode } from '@/demo/DemoModeProvider';

const outcomeLabel = (value: string) => ({ KEEPING_PET: 'Keeping pet', STILL_TRYING: 'Still trying', REHOMING_SUPPORT_NEEDED: 'Rehoming support', keeping: 'Keeping pet', still_trying: 'Still trying', rehoming_help: 'Rehoming support' })[value as 'KEEPING_PET'] ?? 'Plan created';

export default function MyPetsPage() {
  const auth = useAppAuth();
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [savedCases, setSavedCases] = useState<SavedCaseSummary[]>([]);
  const [paths, setPaths] = useState<Record<string, RetentionPathResult | undefined>>({});
  const [actionData, setActionData] = useState<Record<string, ActionsResponse | undefined>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!auth.loaded || auth.status === 'AUTH_ERROR') return;
    if (!auth.serverReady) { setStatus('ready'); return; }
    setStatus('loading');
    void caseApi.listCases().then(async (cases) => {
      setSavedCases(cases);
      const results = await Promise.all(cases.map(async (item) => {
        try {
          const [pathResponse, actionsResponse] = await Promise.all([
            caseApi.getRetentionPaths(item.case.id).catch(() => undefined),
            caseApi.getActions(item.case.id).catch(() => undefined),
          ]);
          return [item.case.id, pathResponse?.paths[0], actionsResponse] as const;
        } catch {
          return [item.case.id, undefined, undefined] as const;
        }
      }));
      setPaths(Object.fromEntries(results.map(([id, path]) => [id, path])));
      setActionData(Object.fromEntries(results.map(([id, , actions]) => [id, actions])));
      setStatus('ready');
    }).catch(() => setStatus('error'));
  }, [auth.loaded, auth.serverReady, auth.status, retryKey]);

  useEffect(() => {
    const refresh = () => setRetryKey((value) => value + 1);
    window.addEventListener(SAVED_PLANS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SAVED_PLANS_CHANGED_EVENT, refresh);
  }, []);

  const continueCase = (petId: string, caseId: string, checkIn = false) =>
    navigate(`/pets/${petId}/cases/${caseId}${checkIn ? '?checkIn=1' : ''}`);

  return <div className="flex min-h-screen flex-col bg-[#FAF7F2]"><Header variant="product" /><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
    <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2E5440]/65">Your dashboard</p><h1 className="mt-2 font-serif text-4xl text-[#2E5440] sm:text-5xl">Here’s what needs attention today.</h1><p className="mt-3 text-lg text-[#2D2D2D]/70">Continue a pet’s active case, review the current path, and take the next useful action.</p></div>
    {auth.status === 'SIGNED_OUT' && <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-[#A7B89F]/30 bg-white/70 px-6 py-16 text-center shadow-[0_18px_55px_rgba(46,84,64,0.05)] sm:px-12"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--warm-sand)]/35 text-[var(--forest)]"><PawPrint className="h-7 w-7" aria-hidden="true" /></span><h2 className="mt-6 font-serif text-3xl text-[#2E5440] sm:text-4xl">Sign in to see your pets.</h2><p className="mt-3 text-[#2D2D2D]/70">Your pets, cases, and actions are securely connected to your account.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{auth.configured && <Button onClick={auth.openSignIn} className="bg-[#2E5440] text-[#FAF7F2]">Sign in</Button>}<Button variant="outline" onClick={() => navigate('/')} className="border-[var(--forest)] text-[var(--forest)]">Find options for my pet</Button></div></section>}
    {(!auth.loaded || auth.status === 'SIGNED_IN_SERVER_CHECKING' || (auth.serverReady && status === 'loading')) && <div className="mt-10 grid gap-5 md:grid-cols-2" role="status" aria-label="Loading pets"><div className="h-64 animate-pulse rounded-3xl bg-[#A7B89F]/20" /><div className="hidden h-64 animate-pulse rounded-3xl bg-[#E3C9B2]/25 md:block" /></div>}
    {auth.status === 'AUTH_ERROR' && <section className="mt-10 rounded-3xl border border-[var(--status-blocked-bg)] bg-white/70 px-6 py-12 text-center" role="alert"><h2 className="font-serif text-3xl text-[var(--forest)]">We’re signed in, but couldn’t connect your account.</h2><p className="mt-3 text-[var(--text-muted)]">Your Clerk session is still active. Retry the secure account connection.</p><Button type="button" onClick={auth.retry} className="mt-6 bg-[var(--forest)] text-[var(--cream)]">Retry</Button></section>}
    {auth.serverReady && status === 'error' && <section className="mt-10 rounded-3xl border border-[var(--status-blocked-bg)] bg-white/70 px-6 py-12 text-center" role="alert"><h2 className="font-serif text-3xl text-[var(--forest)]">We couldn’t load your pets right now.</h2><p className="mt-3 text-[var(--text-muted)]">Your account is still intact. Try again.</p><Button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-6 bg-[var(--forest)] text-[var(--cream)]">Try again</Button></section>}
    {auth.signedIn && status === 'ready' && savedCases.length === 0 && <div className="mt-10 rounded-3xl border border-[#A7B89F]/30 bg-white/70 px-6 py-14 text-center shadow-[0_18px_55px_rgba(46,84,64,0.05)] sm:px-10"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E3C9B2]/35 text-[#2E5440]"><Heart className="h-6 w-6" aria-hidden="true" /></span><h2 className="mt-5 font-serif text-2xl text-[#2E5440]">You haven’t started a case yet.</h2><p className="mx-auto mt-2 max-w-md text-sm text-[#2D2D2D]/70">Tell us what’s happening, or explore the same decision workspace with Luna.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button className="bg-[#2E5440] text-[#FAF7F2]" onClick={() => navigate('/')}>Tell us what’s happening</Button><Button variant="outline" className="border-[#2E5440] text-[#2E5440]" onClick={() => { demo.enable(); navigate('/'); }}>Try Luna Demo</Button></div></div>}
    {auth.signedIn && savedCases.length > 0 && <div id="pets" className="mt-10 grid gap-6 md:grid-cols-2">
      {savedCases.map((item) => {
        const contributors = item.factors.filter(({ factorType, factorValue }) => (factorType.startsWith('contributing_') || factorType === 'behavior_contributor') && factorValue).map(({ factorValue }) => factorLabel(factorValue!));
        const currentPath = paths[item.case.id];
        const caseActions = actionData[item.case.id]?.actions ?? [];
        return <article key={item.case.id} className="flex flex-col rounded-3xl border border-[#A7B89F]/35 bg-white p-6 shadow-[0_18px_55px_rgba(46,84,64,0.06)] sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><h2 className="font-serif text-3xl text-[#2E5440]">{item.pet.name}</h2><p className="mt-1 flex items-center gap-1.5 capitalize text-sm text-[#2D2D2D]/65"><PawPrint className="h-3.5 w-3.5" aria-hidden="true" />{item.pet.type}</p></div>{currentPath && <StatusBadge status={currentPath.status} />}</div>
          <dl className="mt-6 grid gap-4 text-sm"><div><dt className="text-xs font-semibold text-[#2E5440]/60">Current plan</dt><dd className="mt-1 font-serif text-xl text-[#2E5440]">{currentPath?.title ?? `${factorLabel(item.case.primaryBarrier ?? '')} plan`}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/60">Outcome</dt><dd className="mt-1 text-[#2D2D2D]/75">{item.latestOutcome ? outcomeLabel(item.latestOutcome.status) : 'No outcome reported'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/60">Progress</dt><dd className="mt-1 text-[#2D2D2D]/75">{item.latestOutcome?.status === 'KEEPING_PET' ? `${item.pet.name} is staying home` : currentPath ? `${currentPath.blockers.length} ${currentPath.blockers.length === 1 ? 'blocker' : 'blockers'} remaining` : 'Plan ready to continue'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/60">Next steps</dt><dd className="mt-1 text-[#2D2D2D]/75">{item.activeActionCount ?? 0} active {(item.activeActionCount ?? 0) === 1 ? 'action' : 'actions'}</dd></div>
          {contributors.length > 0 && <div><dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/60">Also affecting</dt><dd className="mt-1 text-[#2D2D2D]/75">{contributors.join(', ')}</dd></div>}
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/60">Last updated</dt><dd className="mt-1 text-[#2D2D2D]/75">{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.case.updatedAt))}</dd></div></dl>
          {caseActions.length > 0 && <section className="mt-6 border-t border-[var(--border-warm)] pt-5" aria-label={`What needs attention for ${item.pet.name}`}><h3 className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/60">What needs attention</h3><ul className="mt-3 space-y-2">{caseActions.slice(0, 3).map((action) => <li key={action.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-sm"><span className="font-medium text-[var(--charcoal)]">{action.title}</span><span className="shrink-0 text-xs font-semibold capitalize text-[var(--forest)]">{action.status.replace('_', ' ').toLowerCase()}</span></li>)}</ul></section>}
          <div className="mt-7 flex flex-wrap gap-3"><Button className="bg-[#2E5440] text-[#FAF7F2]" onClick={() => continueCase(item.pet.id, item.case.id)}>{item.latestOutcome?.status === 'KEEPING_PET' ? 'View case history' : `Continue ${item.pet.name}’s case`} <ArrowRight className="ml-2 h-4 w-4" /></Button><Button variant="outline" className="border-[#2E5440] text-[#2E5440]" onClick={() => continueCase(item.pet.id, item.case.id, true)}>How are things with {item.pet.name}?</Button></div>
        </article>;
      })}
      <div className="md:col-span-2"><Button variant="outline" className="border-[#2E5440] text-[#2E5440]" onClick={() => navigate('/')}>Find options for another pet</Button></div>
    </div>}
  </main><Footer variant="product" /></div>;
}
