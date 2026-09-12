import { exploreSmallestUnlock } from '../counterfactual/engine.js';
import type { SupportedChangeCode } from '../counterfactual/domain.js';
import { loadNormalizedHousingCase } from './path-service.js';

export const generateSmallestUnlock = async (
  caseId: string,
  pathKey: string,
  appliedChanges: SupportedChangeCode[] = [],
) => {
  const facts = await loadNormalizedHousingCase(caseId);
  if (!facts) return undefined;
  return exploreSmallestUnlock(facts, pathKey, appliedChanges);
};
