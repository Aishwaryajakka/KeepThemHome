import { exploreSmallestUnlock } from '../counterfactual/engine';
import type { SupportedChangeCode } from '../counterfactual/domain';
import { loadNormalizedHousingCase } from './path-service';

export const generateSmallestUnlock = async (
  caseId: string,
  pathKey: string,
  appliedChanges: SupportedChangeCode[] = [],
) => {
  const facts = await loadNormalizedHousingCase(caseId);
  if (!facts) return undefined;
  return exploreSmallestUnlock(facts, pathKey, appliedChanges);
};
