import type { SupportedChangeCode } from '../counterfactual/domain.js';
import { selectEvidenceForPath } from '../evidence/select.js';
import { generateRetentionPaths, loadNormalizedHousingCase } from './path-service.js';

export class EvidencePathNotFoundError extends Error {}

interface EvidenceDependencies {
  generatePaths: typeof generateRetentionPaths;
  loadFacts: typeof loadNormalizedHousingCase;
}

const defaultDependencies: EvidenceDependencies = {
  generatePaths: generateRetentionPaths,
  loadFacts: loadNormalizedHousingCase,
};

export const getCasePathEvidence = async (
  caseId: string,
  pathKey: string,
  appliedChanges: SupportedChangeCode[] = [],
  dependencies: EvidenceDependencies = defaultDependencies,
) => {
  const [pathsResult, facts] = await Promise.all([
    dependencies.generatePaths(caseId, appliedChanges),
    dependencies.loadFacts(caseId),
  ]);
  if (!pathsResult || !facts) return undefined;
  const path = pathsResult.paths.find(({ key }) => key === pathKey);
  if (!path) throw new EvidencePathNotFoundError('Trusted path not found for case');
  return selectEvidenceForPath(caseId, path, facts);
};
