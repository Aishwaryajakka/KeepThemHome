import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, HeartHandshake, LockKeyhole, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { BarrierType, HousingGoal, HousingSituation, HousingTiming } from '@/types/assessment';
import { matchHousingResources } from '@/data/resources';
import {
  caseApi, type CasePlan, type ExplanationResponse, type PathEvidenceResponse,
  type RetentionPathResult, type SupportedChange, type SupportedChangeCode, type UnlockResponse,
} from '@/lib/case-api';
import { solveRetentionPaths } from '../../../server/retention-paths/solver';
import { applySupportedChanges, exploreSmallestUnlock } from '../../../server/counterfactual/engine';
import { materializeSupportedChanges } from '../../../server/counterfactual/catalog';
import type { NormalizedHousingCase } from '../../../server/retention-paths/domain';

interface HousingActionPlanProps {
  backendCaseId?: string;
  petName: string;
  situation: HousingSituation;
  timing: HousingTiming;
  goal: HousingGoal;
  onTryPlan: () => void;
  onBack: () => void;
  onSavePlan?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  contributingBarriers?: BarrierType[];
  costConstraint?: string;
}

const NONE: BarrierType[] = [];
const statusTone = (status: RetentionPathResult['status']) => status === 'FEASIBLE'
  ? 'border-[var(--status-feasible-text)] bg-[var(--status-feasible-bg)] text-[var(--status-feasible-text)]'
  : status === 'BLOCKED'
    ? 'border-[var(--status-blocked-text)] bg-[var(--status-blocked-bg)] text-[var(--status-blocked-text)]'
    : 'border-[var(--status-conditional-text)] bg-[var(--status-conditional-bg)] text-[var(--status-conditional-text)]';
const factLabel = (field: string, hypothetical = false) => {
  const labels: Record<string, string> = {
    goal: hypothetical ? 'Open to staying or moving' : 'Current housing goal',
    housingResolutionPossible: hypothetical ? 'Housing resolution confirmed' : 'Landlord issue unresolved',
    behaviorMitigationAvailable: hypothetical ? 'Behavior mitigation confirmed' : 'Behavior mitigation unknown',
    temporaryCareAvailable: hypothetical ? 'Temporary care confirmed' : 'Temporary care unknown',
    petFriendlyHousingAvailable: hypothetical ? 'Pet-friendly housing confirmed' : 'Pet-friendly housing unknown',
    moveRequirementsMet: hypothetical ? 'Move requirements confirmed' : 'Move requirements unknown',
    underlyingIssueResolutionPossible: hypothetical ? 'Underlying issue resolution confirmed' : 'Underlying issue unresolved',
  };
  return labels[field] ?? field.replace(/([A-Z])/g, ' $1').trim();
};

export const HousingActionPlan: React.FC<HousingActionPlanProps> = ({
  backendCaseId, petName, situation, timing, goal, onTryPlan, onBack, onSavePlan,
  saveStatus = 'idle', contributingBarriers = NONE, costConstraint = '',
}) => {
  const displayName = petName.trim() || 'Luna';
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [backendPlan, setBackendPlan] = useState<CasePlan | null>(null);
  const [paths, setPaths] = useState<RetentionPathResult[] | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [appliedChanges, setAppliedChanges] = useState<SupportedChangeCode[]>([]);
  const [unlockingPath, setUnlockingPath] = useState<string | null>(null);
  const [unlock, setUnlock] = useState<UnlockResponse | null>(null);
  const [unlockError, setUnlockError] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, ExplanationResponse>>({});
  const [evidence, setEvidence] = useState<Record<string, PathEvidenceResponse>>({});
  const [preview, setPreview] = useState<{ current: RetentionPathResult; hypothetical: RetentionPathResult; changes: SupportedChange[] } | null>(null);

  const fallbackResources = matchHousingResources(situation, timing, goal);
  const resources = backendPlan ? backendPlan.interventions.flatMap(({ resources }) => resources).slice(0, 3) : fallbackResources;
  const localFacts = useMemo<NormalizedHousingCase>(() => ({
    primaryBarrier: 'housing', contributingBarriers, situation, urgency: timing, goal, costConstraint: costConstraint || null,
    constraints: {
      goalSupportsStay: goal === 'Stay where I am' || goal === 'Either could work' ? true : goal === 'Move' ? false : 'unknown',
      goalSupportsMove: goal === 'Move' || goal === 'Either could work' ? true : goal === 'Stay where I am' ? false : 'unknown',
      housingResolutionPossible: 'unknown', behaviorContributor: contributingBarriers.includes('behavior'),
      behaviorMitigationAvailable: 'unknown', temporaryCareAvailable: 'unknown', underlyingIssueResolutionPossible: 'unknown',
      petFriendlyHousingAvailable: 'unknown', moveRequirementsMet: 'unknown',
    },
  }), [contributingBarriers, costConstraint, goal, situation, timing]);
  const localPaths = (facts: NormalizedHousingCase): RetentionPathResult[] => solveRetentionPaths(facts).map((path) => ({ ...path, steps: path.steps.map((step) => ({ ...step, resources: [] })) }));
  const selectedPath = paths?.find(({ key }) => key === selectedKey) ?? null;

  useEffect(() => {
    if (!backendCaseId) { setBackendPlan(null); return; }
    let active = true;
    void caseApi.getPlan(backendCaseId).then((plan) => { if (active) setBackendPlan(plan); }).catch(() => { if (active) setBackendPlan(null); });
    return () => { active = false; };
  }, [backendCaseId]);

  useEffect(() => {
    if (!backendCaseId) { setPaths(localPaths(localFacts)); return; }
    let active = true;
    void caseApi.getRetentionPaths(backendCaseId, []).then(({ paths: results }) => { if (active) setPaths(results.length ? results : null); }).catch(() => { if (active) setPaths(null); });
    return () => { active = false; };
  }, [backendCaseId, localFacts]);

  useEffect(() => {
    if (!paths) return;
    let active = true;
    for (const path of paths) {
      if (backendCaseId) void caseApi.getPathExplanation(backendCaseId, path.key, 'PATH_SUMMARY', appliedChanges).then((value) => { if (active) setExplanations((current) => ({ ...current, [path.key]: value })); }).catch(() => undefined);
      const request = backendCaseId ? caseApi.getPathEvidence(backendCaseId, path.key) : caseApi.previewPathEvidence({
        pathKey: path.key, primaryBarrier: 'housing', situation: situation || null, urgency: timing || null, goal: goal || null,
        behaviorContributor: contributingBarriers.includes('behavior'), costConstraint: costConstraint || null, contributingBarriers,
      });
      void request.then((value) => { if (active) setEvidence((current) => ({ ...current, [path.key]: value })); }).catch(() => undefined);
    }
    return () => { active = false; };
  }, [appliedChanges, backendCaseId, contributingBarriers, costConstraint, goal, paths, situation, timing]);

  const selectPath = (path: RetentionPathResult) => {
    setSelectedKey(path.key);
    setUnlock(null);
    setUnlockError(false);
    setPreview(null);
  };

  const exploreUnlock = async (path: RetentionPathResult) => {
    setUnlockingPath(path.key);
    setUnlockError(false);
    try {
      const result = backendCaseId
        ? await caseApi.getSmallestUnlock(backendCaseId, path.key, appliedChanges)
        : exploreSmallestUnlock(localFacts, path.key, appliedChanges) as unknown as UnlockResponse | undefined;
      if (!result) throw new Error('No supported unlock');
      setUnlock(result);
    } catch { setUnlockError(true); }
    finally { setUnlockingPath(null); }
  };

  const previewUnlock = async () => {
    if (!unlock?.smallestUnlock || !selectedPath) return;
    const next = Array.from(new Set([...appliedChanges, ...unlock.smallestUnlock.changes.map(({ code }) => code)]));
    try {
      const recomputed = backendCaseId
        ? (await caseApi.getRetentionPaths(backendCaseId, next)).paths
        : localPaths(applySupportedChanges(localFacts, materializeSupportedChanges(localFacts, next)));
      const hypothetical = recomputed.find(({ key }) => key === selectedPath.key);
      if (!hypothetical) throw new Error('Path missing from recomputation');
      setAppliedChanges(next);
      setPaths(recomputed);
      setPreview({ current: selectedPath, hypothetical, changes: unlock.smallestUnlock.changes });
      setUnlock(null);
      setExplanations({});
    } catch { setUnlockError(true); }
  };

  const resetPreview = async () => {
    try {
      const actual = backendCaseId ? (await caseApi.getRetentionPaths(backendCaseId, [])).paths : localPaths(localFacts);
      setPaths(actual); setAppliedChanges([]); setPreview(null); setUnlock(null); setExplanations({});
    } catch { /* Preserve the visible, explicitly hypothetical result. */ }
  };

  return <div className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
    <button type="button" onClick={onBack} className="brand-focus mb-7 inline-flex items-center gap-2 rounded text-sm font-medium text-[var(--text-muted)] hover:text-[var(--forest)]"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to my answers</button>
    <header className="mb-9"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--forest)]/65">Decision workspace</p><h1 className="mt-3 font-serif text-5xl leading-tight text-[var(--forest)] sm:text-6xl">{displayName}’s options</h1><p className="mt-4 max-w-3xl text-lg text-[var(--charcoal)]/75 sm:text-xl">We evaluated three ways {displayName} may be able to stay with you based on what you told us.</p></header>

    <section className="mb-10 grid gap-6 rounded-2xl border border-[var(--sage)]/40 bg-white/75 p-5 sm:grid-cols-[180px_1fr] sm:p-7" aria-label={`${displayName} case context`}>
      <div><p className="font-serif text-3xl text-[var(--forest)]">{displayName}</p><p className="mt-1 text-base text-[var(--text-muted)]">Dog</p></div>
      <div className="grid gap-5 sm:grid-cols-2"><div><p className="text-sm font-bold tracking-wider text-[var(--forest)]">FROM YOUR STORY</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-md bg-[var(--forest)] px-3 py-2 font-semibold text-white">Housing</span>{contributingBarriers.map((barrier) => <span key={barrier} className="rounded-md bg-[var(--warm-sand)]/45 px-3 py-2 font-semibold capitalize">{barrier}</span>)}{timing && <span className="rounded-md bg-[var(--surface-soft)] px-3 py-2 font-semibold">{timing === 'This week' ? '7 days' : timing}</span>}</div></div><div><p className="text-sm font-bold tracking-wider text-[var(--forest)]">CONFIRMED BY YOU</p><p className="mt-3 text-base font-medium">{goal === 'Stay where I am' ? 'Stay in current home' : goal === 'Move' ? 'Open to moving' : 'Open to staying or moving'}</p></div></div>
    </section>

    {paths ? <section aria-labelledby="paths-heading"><h2 id="paths-heading" className="sr-only">Compared paths</h2><div className="grid gap-5 lg:grid-cols-3">
      {paths.map((path) => { const selected = selectedKey === path.key; return <article key={path.key} className={`motion-safe:transition-all motion-safe:duration-300 flex min-h-[360px] flex-col rounded-2xl border-2 bg-white p-6 ${selected ? 'border-[var(--forest)] shadow-[0_20px_55px_rgba(46,84,64,.14)]' : 'border-[var(--border-warm)]'}`}>
        <StatusBadge status={path.status} className="self-start px-3 py-2 text-base" /><h3 className="mt-6 font-serif text-3xl leading-tight text-[var(--forest)]">{path.title.replace('your pet', displayName)}</h3><p className="mt-3 text-base leading-relaxed text-[var(--charcoal)]/75">{path.objective}</p><div className="mt-5"><p className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">{path.blockers.length ? `${path.blockers.length} blockers / unknowns` : 'No blockers identified'}</p>{path.blockers[0] && <p className="mt-2 text-base font-medium text-[var(--charcoal)]">{path.blockers[0].label}</p>}</div><Button type="button" onClick={() => selectPath(path)} variant={selected ? 'default' : 'outline'} className={`brand-focus mt-auto min-h-12 w-full rounded-full ${selected ? 'bg-[var(--forest)] text-white' : 'border-[var(--forest)] text-[var(--forest)]'}`}>Explore this path</Button>
      </article>; })}
    </div></section> : <section className="rounded-2xl border border-[var(--border-warm)] bg-white p-8" role="status"><h2 className="font-serif text-3xl text-[var(--forest)]">Path comparison is unavailable right now.</h2><p className="mt-3 text-[var(--text-muted)]">Your answers remain in this browser. Please try again shortly.</p>{backendPlan?.interventions[0] && <p className="mt-5 font-medium">Suggested starting point: {backendPlan.interventions[0].title}</p>}</section>}

    {selectedPath && <section className="motion-safe:animate-fade-in mt-10 rounded-3xl border border-[var(--sage)]/50 bg-[var(--surface)] p-5 sm:p-8 lg:p-10" aria-label={`Path detail for ${selectedPath.title}`}>
      <div className="grid gap-8 lg:grid-cols-[1.35fr_.65fr]"><div><p className="text-sm font-bold uppercase tracking-wider text-[var(--forest)]">Current reality</p><div className="mt-3 flex flex-wrap items-center gap-4"><p className={`rounded-lg border px-4 py-2 text-2xl font-black ${statusTone(preview?.current.status ?? selectedPath.status)}`}>{preview?.current.status ?? selectedPath.status}</p><h2 className="font-serif text-4xl text-[var(--forest)]">{selectedPath.title.replace('your pet', displayName)}</h2></div><p className="mt-5 text-lg leading-relaxed text-[var(--charcoal)]/80">{preview?.current.statusReason ?? selectedPath.statusReason}</p></div><div><h3 className="text-xl font-bold text-[var(--charcoal)]">What is blocking it</h3>{(preview?.current.blockers ?? selectedPath.blockers).length ? <ul className="mt-4 space-y-3">{(preview?.current.blockers ?? selectedPath.blockers).map((blocker) => <li key={blocker.field} className="rounded-lg bg-[var(--status-blocked-bg)] p-3 text-base font-semibold text-[var(--status-blocked-text)]">{blocker.label}</li>)}</ul> : <p className="mt-3 text-[var(--text-muted)]">No blockers are currently identified.</p>}</div></div>

      {explanations[selectedPath.key] && <aside className="mt-8 border-t border-[var(--border-warm)] pt-7" aria-label={`Why this changes the path for ${selectedPath.title}`}><h3 className="font-serif text-3xl text-[var(--forest)]">Why this changes the path</h3><p className="mt-3 max-w-4xl text-base leading-relaxed">{explanations[selectedPath.key].explanation.summary} {explanations[selectedPath.key].explanation.why}</p></aside>}

      {!preview && selectedPath.status !== 'FEASIBLE' && <div className="mt-8"><Button type="button" disabled={unlockingPath === selectedPath.key} onClick={() => void exploreUnlock(selectedPath)} className="brand-focus min-h-14 w-full bg-[var(--forest)] px-6 text-lg text-white sm:w-auto"><LockKeyhole className="mr-2 h-5 w-5" aria-hidden="true" />{unlockingPath ? 'Checking supported changes…' : 'What would unlock this path?'}</Button></div>}
      {unlockError && <p className="mt-4 text-base text-[var(--status-blocked-text)]" role="alert">We couldn’t check supported changes right now. Your current case has not changed.</p>}

      {unlock && <section className="motion-safe:animate-fade-in mt-8 rounded-2xl border-2 border-[var(--forest)] bg-[var(--sage)]/10 p-6 sm:p-8" aria-labelledby="unlock-heading"><p className="text-sm font-bold uppercase tracking-[.16em] text-[var(--forest)]">Smallest unlock</p><h3 id="unlock-heading" className="mt-2 font-serif text-4xl text-[var(--forest)]">The smallest change set we found</h3><p className="mt-3 max-w-3xl text-lg leading-relaxed">These are the fewest supported changes needed to make this path possible based on {displayName}’s current constraints.</p>{unlock.smallestUnlock ? <><ul className="mt-6 grid gap-4 md:grid-cols-2">{unlock.smallestUnlock.changes.map((change) => <li key={change.code} className="rounded-xl border border-[var(--sage)] bg-white p-5"><p className="text-lg font-bold text-[var(--forest)]">{change.label}</p><p className="mt-2 text-sm text-[var(--text-muted)]">{String(change.from)} <span aria-hidden="true">→</span> {String(change.to)}</p></li>)}</ul><Button type="button" onClick={() => void previewUnlock()} className="brand-focus mt-6 min-h-13 w-full bg-[var(--forest)] text-base text-white sm:w-auto">Preview these changes <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button></> : <p className="mt-5 text-lg">No supported unlock was found for the constraints currently modeled.</p>}</section>}

      {preview && <section className="motion-safe:animate-fade-in mt-8 rounded-2xl border-2 border-[#3D6E82] bg-[#EAF3F5] p-6 sm:p-8" aria-labelledby="preview-heading"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#315C6D]">Hypothetical preview</p><h3 id="preview-heading" className="mt-2 font-serif text-4xl text-[#315C6D]">This path could become possible if these conditions change.</h3><div className="mt-7 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]"><div className="rounded-xl bg-white p-5"><p className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Current reality</p><p className={`mt-3 inline-block rounded-lg border px-3 py-2 text-2xl font-black ${statusTone(preview.current.status)}`}>{preview.current.status}</p><ul className="mt-5 space-y-3">{preview.current.blockers.map((blocker) => <li key={blocker.field} className="text-base font-semibold">{factLabel(blocker.field)}</li>)}</ul></div><div className="flex items-center justify-center text-4xl text-[#315C6D]" aria-hidden="true">→</div><div className="rounded-xl bg-white p-5"><p className="text-sm font-bold uppercase tracking-wider text-[#315C6D]">Hypothetical</p><p className={`mt-3 inline-block rounded-lg border px-3 py-2 text-2xl font-black ${statusTone(preview.hypothetical.status)}`}>{preview.hypothetical.status}</p><ul className="mt-5 space-y-3">{preview.changes.map((change) => <li key={change.code} className="text-base font-semibold">{factLabel(change.field, true)}</li>)}</ul></div></div><p className="mt-6 text-lg font-bold text-[#315C6D]">Your actual case has not changed.</p><Button type="button" variant="outline" onClick={() => void resetPreview()} className="mt-4 border-[#315C6D] text-[#315C6D]"><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />Reset to current reality</Button></section>}

      {evidence[selectedPath.key]?.evidence.length ? <aside className="mt-10 border-t border-[var(--border-warm)] pt-8" aria-label={`Evidence for ${selectedPath.title}`}><h3 className="font-serif text-3xl text-[var(--forest)]">Why this is grounded</h3><p className="mt-2 text-base text-[var(--text-muted)]">These sources support the factors and interventions considered in this path.</p><div className="mt-5 grid gap-4 md:grid-cols-3">{evidence[selectedPath.key].evidence.slice(0, 3).map((source) => <article key={source.id} className="rounded-xl border border-[var(--border-warm)] bg-white p-5"><p className="text-sm font-bold uppercase tracking-wider text-[var(--forest)]">{source.organization}</p><p className="mt-2 font-serif text-xl text-[var(--charcoal)]">{source.title}</p><p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{source.claims[0]?.summary ?? source.whyRelevant}</p><a href={source.url} target="_blank" rel="noopener noreferrer" className="brand-focus mt-4 inline-flex rounded text-sm font-bold text-[var(--forest)] underline underline-offset-4">View source <ExternalLink className="ml-1 h-4 w-4" aria-hidden="true" /></a></article>)}</div>{evidence[selectedPath.key].evidence.length > 3 && <details className="mt-4"><summary className="cursor-pointer font-bold text-[var(--forest)]">View all evidence</summary><ul className="mt-3 space-y-2">{evidence[selectedPath.key].evidence.slice(3).map((source) => <li key={source.id}>{source.organization} — {source.title}</li>)}</ul></details>}</aside> : null}
    </section>}

    <section className="mt-12 border-t border-[var(--border-warm)] pt-10" aria-labelledby="resources-heading"><h2 id="resources-heading" className="font-serif text-4xl text-[var(--forest)]">Resources that may help</h2><p className="mt-3 text-base text-[var(--text-muted)]">These are places to explore support. Availability and eligibility can vary.</p><div className="mt-6 grid gap-5 md:grid-cols-3">{resources.map((resource) => <article key={resource.id} className="flex flex-col rounded-xl border border-[var(--sage)]/45 bg-white p-5"><p className="text-sm font-bold uppercase tracking-wider text-[var(--forest)]">{resource.sourceName}</p><h3 className="mt-2 font-serif text-2xl text-[var(--forest)]">{resource.name}</h3><p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{resource.description}</p><a href={resource.url} target="_blank" rel="noopener noreferrer" className="brand-focus mt-auto pt-5 text-sm font-bold text-[var(--forest)] underline underline-offset-4">Visit resource <ExternalLink className="ml-1 inline h-4 w-4" aria-hidden="true" /></a></article>)}</div></section>

    {onSavePlan && <section className="mt-12 rounded-2xl bg-[var(--forest)] p-6 text-[var(--cream)] sm:p-8" aria-live="polite"><h2 className="font-serif text-3xl">Want to come back to {displayName}’s plan?</h2><div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center"><Button type="button" onClick={onSavePlan} disabled={saveStatus === 'saving' || saveStatus === 'saved'} className="brand-focus w-full bg-[var(--cream)] text-[var(--forest)] hover:bg-[var(--warm-sand)] sm:w-auto">{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? `${displayName}’s plan is saved.` : `Save ${displayName}’s plan`}</Button>{saveStatus === 'saved' && <Link to="/my-pets" className="brand-focus rounded font-bold underline underline-offset-4">View My Pets</Link>}{saveStatus === 'error' && <p>Sign-in or saving is unavailable. Your progress remains in this browser.</p>}</div></section>}

    <section className="mt-8 rounded-2xl border border-[var(--border-warm)] bg-white/70 p-6"><h2 className="font-serif text-2xl text-[var(--forest)]">What would you like to do next?</h2><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={onTryPlan} className="min-h-12 bg-[var(--forest)] text-white">I’ll try this plan <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button><Button type="button" variant="outline" onClick={() => setShowOtherOptions(true)}>I still need other options</Button></div></section>
    <Dialog open={showOtherOptions} onOpenChange={setShowOtherOptions}><DialogContent className="max-w-[calc(100%-2rem)] bg-[var(--cream)] md:max-w-lg"><DialogHeader><HeartHandshake className="h-7 w-7 text-[var(--forest)]" aria-hidden="true" /><DialogTitle className="font-serif text-2xl text-[var(--forest)]">Additional Support Options</DialogTitle><DialogDescription>If these paths aren’t sufficient, responsible rehoming guidance can help you navigate the next step compassionately.</DialogDescription></DialogHeader><Button onClick={() => setShowOtherOptions(false)} className="mt-5 bg-[var(--forest)] text-white">Understood</Button></DialogContent></Dialog>
  </div>;
};

export default HousingActionPlan;
