import { useEffect, useMemo, useState } from 'react';
import { caseApi, type SimilarCase, type RetentionPathResult } from '@/lib/case-api';
import { factorLabel } from '@/lib/presentation';
import type { NormalizedHousingCase } from '../../../server/retention-paths/domain';
import type { StructuredSimilarityInput } from '../../../server/similarity/domain';
import { similarityReasons, similarityScore, qualitativeSimilarity } from '../../../server/similarity/rank';
import { syntheticSimilarityCases } from '../../../server/similarity/synthetic';
import { urgencyBucket } from '../../../server/similarity/canonical';

interface Props { backendCaseId?: string; petType?: string; path: RetentionPathResult; facts: NormalizedHousingCase; }
const pathLabels: Record<string, string> = { remain_in_current_housing: 'Stay in current housing', temporary_care_bridge: 'Use a temporary-care bridge', move_with_pet: 'Move with your pet' };
const outcomeLabels: Record<SimilarCase['outcomeCategory'], string> = { KEEPING_PET: 'Pet stayed home', STILL_TRYING: 'Still trying', REHOMING_SUPPORT_NEEDED: 'Needed rehoming support', UNKNOWN: 'Outcome unknown' };

const localExamples = (facts: NormalizedHousingCase, path: RetentionPathResult, petType = 'unknown'): SimilarCase[] => {
  const contributors = facts.contributingBarriers ?? [];
  const source: StructuredSimilarityInput = { petType, primaryFactor: facts.primaryBarrier ?? 'unknown', contributingFactors: contributors, urgencyBucket: urgencyBucket(facts.urgency), constraintKeys: path.blockers.map(({ field }) => field), pathKey: path.key, blockerCategories: [facts.primaryBarrier ?? 'unknown', ...contributors], interventionCategories: [], outcomeCategory: 'UNKNOWN' };
  return syntheticSimilarityCases.filter(({ input }) => input.petType === source.petType && input.primaryFactor === source.primaryFactor).map(({ key, input }) => { const score = similarityScore(source, input); return { id: key, provenance: 'synthetic_example' as const, similarityLabel: qualitativeSimilarity(score), petType: input.petType, factors: [input.primaryFactor, ...input.contributingFactors], pathKey: input.pathKey, actions: input.interventionCategories, outcomeCategory: input.outcomeCategory, reasons: similarityReasons(source, input) }; }).sort((a, b) => similarityScore(source, syntheticSimilarityCases.find(({ key }) => key === b.id)!.input) - similarityScore(source, syntheticSimilarityCases.find(({ key }) => key === a.id)!.input)).slice(0, 3);
};

export default function SimilarSituations({ backendCaseId, petType, path, facts }: Props) {
  const examples = useMemo(() => localExamples(facts, path, petType), [facts, path, petType]);
  const [cases, setCases] = useState<SimilarCase[]>(backendCaseId ? [] : examples);
  useEffect(() => { if (!backendCaseId) { setCases(examples); return; } let active = true; void caseApi.getSimilarCases(backendCaseId).then((result) => { if (active) setCases(result.cases); }).catch(() => { if (active) setCases([]); }); return () => { active = false; }; }, [backendCaseId, examples]);
  if (!cases.length) return null;
  return <section className="mt-10 border-t border-[var(--border-warm)] pt-8" aria-labelledby="similar-situations-heading"><h3 id="similar-situations-heading" className="font-serif text-3xl text-[var(--forest)]">Similar situations</h3><p className="mt-2 text-[var(--text-muted)]">See how other cases with similar constraints were approached.</p><p className="mt-2 text-sm font-semibold text-[var(--forest)]">Similarity describes circumstances, not likelihood of success.</p><div className="mt-5 grid gap-4 lg:grid-cols-3">{cases.map((item) => <article key={item.id} className="rounded-xl border border-[var(--sage)] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold text-[var(--forest)]">{item.similarityLabel}</span><span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold">{item.provenance === 'synthetic_example' ? 'Synthetic example' : 'Anonymous shared case'}</span></div><p className="mt-4 capitalize">{item.petType} · {item.factors.map(factorLabel).join(' + ')}</p><p className="mt-3 text-sm"><strong>Path they tried:</strong> {pathLabels[item.pathKey] ?? factorLabel(item.pathKey)}</p><p className="mt-2 text-sm"><strong>Actions:</strong> {item.actions.length ? item.actions.map(factorLabel).join(', ') : 'No actions recorded'}</p><p className="mt-2 text-sm"><strong>Outcome:</strong> {outcomeLabels[item.outcomeCategory]}</p><p className="mt-3 text-xs text-[var(--text-muted)]"><strong>Similar because:</strong> {item.reasons.map(factorLabel).join(', ')}</p></article>)}</div></section>;
}
