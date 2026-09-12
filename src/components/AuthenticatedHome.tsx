import { useEffect, useState } from 'react';
import { ArrowRight, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { caseApi, SAVED_PLANS_CHANGED_EVENT, type RetentionPathResult, type SavedCaseSummary } from '@/lib/case-api';
import { factorLabel } from '@/lib/presentation';

interface AuthenticatedHomeProps {
  active: boolean;
  onStart: () => void;
  onContinue: (petId: string, caseId: string) => void;
  onViewAll: () => void;
}

export default function AuthenticatedHome({ active, onStart, onContinue: continueWithPet, onViewAll }: AuthenticatedHomeProps) {
  const [cases, setCases] = useState<SavedCaseSummary[]>([]);
  const [paths, setPaths] = useState<Record<string, RetentionPathResult | undefined>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshKey, setRefreshKey] = useState(0);
  const onContinue = (caseId: string) => {
    const item = cases.find(({ case: caseRecord }) => caseRecord.id === caseId);
    if (item) continueWithPet(item.pet.id, caseId);
  };

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1);
    window.addEventListener(SAVED_PLANS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SAVED_PLANS_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (!active) return;
    let mounted = true;
    setStatus('loading');
    void caseApi.listCases().then(async (items) => {
      const visible = items.slice(0, 3);
      const resolvedPaths = await Promise.all(visible.map(async (item) => {
        try {
          const result = await caseApi.getRetentionPaths(item.case.id);
          return [item.case.id, result.paths[0]] as const;
        } catch { return [item.case.id, undefined] as const; }
      }));
      if (!mounted) return;
      setCases(visible);
      setPaths(Object.fromEntries(resolvedPaths));
      setStatus('ready');
    }).catch(() => { if (mounted) setStatus('error'); });
    return () => { mounted = false; };
  }, [active, refreshKey]);

  if (!active) return null;
  return <section className="border-b border-[var(--border-warm)] bg-white/55 py-10 sm:py-12" aria-labelledby="welcome-back-heading"><div className="mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-12">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-[var(--forest)]">Welcome back</p><h2 id="welcome-back-heading" className="mt-1 font-serif text-3xl text-[var(--forest)] sm:text-4xl">Continue where you left off.</h2></div>{cases.length > 0 && <Button type="button" variant="ghost" onClick={onViewAll} className="self-start text-[var(--forest)] sm:self-auto">View all My Pets <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>}</div>
    {status === 'loading' && <div className="mt-6 h-28 animate-pulse rounded-2xl bg-[var(--sage)]/15" role="status" aria-label="Loading saved plans" />}
    {status === 'error' && <div className="mt-6 rounded-2xl border border-[var(--border-warm)] bg-[var(--cream)] p-5" role="alert"><p className="font-semibold text-[var(--forest)]">We couldn’t load your pets right now.</p><Button type="button" variant="outline" onClick={() => setRefreshKey((value) => value + 1)} className="mt-3 border-[var(--forest)] text-[var(--forest)]">Try again</Button></div>}
    {status === 'ready' && cases.length === 0 && <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--sage)]/35 bg-[var(--cream)] p-6 sm:flex-row sm:items-center"><div><h3 className="font-serif text-2xl text-[var(--forest)]">No saved plans yet.</h3><p className="mt-1 text-sm text-[var(--text-muted)]">Start an assessment and save a plan to return to it later.</p></div><Button type="button" onClick={onStart} className="bg-[var(--forest)] text-white">Find options for my pet</Button></div>}
    {status === 'ready' && cases.length > 0 && <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{cases.map((item) => { const path = paths[item.case.id]; const activeActions = item.activeActionCount ?? 0; const keeping = item.latestOutcome?.status === 'KEEPING_PET'; const trying = item.latestOutcome?.status === 'STILL_TRYING'; return <article key={item.case.id} className="rounded-2xl border border-[var(--sage)]/35 bg-[var(--cream)] p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-2xl text-[var(--forest)]">{item.pet.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm capitalize text-[var(--text-muted)]"><PawPrint className="h-3.5 w-3.5" aria-hidden="true" />{item.pet.type}</p></div>{!keeping && path && <StatusBadge status={path.status} />}</div><p className="mt-4 font-medium text-[var(--forest)]">{keeping ? `${item.pet.name} is staying home` : path?.title ?? `${factorLabel(item.case.primaryBarrier ?? '')} plan`}</p><p className="mt-2 text-sm text-[var(--text-muted)]">{keeping ? 'Outcome reported' : `${trying ? 'Still trying · ' : ''}${activeActions} next ${activeActions === 1 ? 'step' : 'steps'}`}</p><Button type="button" variant="outline" onClick={() => onContinue(item.case.id)} className="mt-5 w-full border-[var(--forest)] text-[var(--forest)]">{keeping ? 'View plan history' : `Continue ${item.pet.name}’s plan`} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button></article>; })}</div>}
  </div></section>;
}
