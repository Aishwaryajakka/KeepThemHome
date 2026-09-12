import { getCase, getCaseFactors } from './case-service.js';
import { generateSmallestUnlock } from './counterfactual-service.js';
import { generateRetentionPaths } from './path-service.js';
import type { SupportedChangeCode } from '../counterfactual/domain.js';
import type { GroundedExplanationPayload } from '../explanation/domain.js';
import { deterministicExplanation } from '../explanation/fallback.js';
import { generateGroundedExplanation } from '../explanation/groq.js';
import type { ExplanationMode } from '../validation/explanation.js';

export class ExplanationPathNotFoundError extends Error {}

export interface ExplanationDependencies {
  loadCase: typeof getCase;
  loadFactors: typeof getCaseFactors;
  generatePaths: typeof generateRetentionPaths;
  generateUnlock: typeof generateSmallestUnlock;
  generateExplanation: typeof generateGroundedExplanation;
}

const defaultDependencies: ExplanationDependencies = {
  loadCase: getCase,
  loadFactors: getCaseFactors,
  generatePaths: generateRetentionPaths,
  generateUnlock: generateSmallestUnlock,
  generateExplanation: generateGroundedExplanation,
};

export const buildGroundedExplanationPayload = async (
  caseId: string,
  pathKey: string,
  mode: ExplanationMode,
  appliedCodes: SupportedChangeCode[],
  dependencies: ExplanationDependencies = defaultDependencies,
): Promise<GroundedExplanationPayload | undefined> => {
  const [caseRecord, factors, pathsResult, unlockResult] = await Promise.all([
    dependencies.loadCase(caseId),
    dependencies.loadFactors(caseId),
    dependencies.generatePaths(caseId, appliedCodes),
    dependencies.generateUnlock(caseId, pathKey, appliedCodes),
  ]);
  if (!caseRecord || !pathsResult || !unlockResult) return undefined;
  if (!('facts' in pathsResult) || !pathsResult.facts) {
    throw new ExplanationPathNotFoundError('Computed path not available');
  }
  const selectedIndex = pathsResult.paths.findIndex(({ key }) => key === pathKey);
  if (selectedIndex < 0) throw new ExplanationPathNotFoundError('Computed path not found');
  const path = pathsResult.paths[selectedIndex];
  const resources = path.steps.flatMap((step) => step.resources.map((resource) => ({
    name: resource.name,
    description: resource.description,
    url: resource.url,
    relevantStep: step.title,
  }))).filter((resource, index, all) => all.findIndex(({ url }) => url === resource.url) === index);
  const safetyActive = factors.some(({ factorType, factorValue }) =>
    factorType === 'behavior_seriousness' && factorValue === 'There’s an immediate safety concern');

  return {
    pet: { name: caseRecord.petName, type: caseRecord.petType },
    ownerGoal: pathsResult.facts.goal,
    mode,
    selectedPath: {
      key: path.key,
      title: path.title,
      objective: path.objective,
      status: path.status,
      rank: selectedIndex + 1,
      orderedSteps: path.steps.map(({ title, description }) => ({ title, description })),
      reasonCodes: path.reasonCodes,
      blockers: path.blockers,
    },
    smallestUnlock: unlockResult.smallestUnlock ? {
      changes: unlockResult.smallestUnlock.changes,
      resultingStatus: unlockResult.smallestUnlock.resultingStatus,
    } : null,
    appliedChanges: unlockResult.appliedChanges,
    resources,
    safetyState: safetyActive ? 'ACTIVE' : 'NOT_ACTIVE',
    isHypothetical: appliedCodes.length > 0,
  };
};

export const explainCasePath = async (
  caseId: string,
  pathKey: string,
  mode: ExplanationMode,
  appliedCodes: SupportedChangeCode[],
  dependencies: ExplanationDependencies = defaultDependencies,
) => {
  const groundedPayload = await buildGroundedExplanationPayload(caseId, pathKey, mode, appliedCodes, dependencies);
  if (!groundedPayload) return undefined;
  try {
    return {
      explanation: await dependencies.generateExplanation(groundedPayload),
      source: 'generated' as const,
      grounded: {
        pathKey: groundedPayload.selectedPath.key,
        status: groundedPayload.selectedPath.status,
        rank: groundedPayload.selectedPath.rank,
        isHypothetical: groundedPayload.isHypothetical,
      },
    };
  } catch {
    return {
      explanation: deterministicExplanation(groundedPayload),
      source: 'deterministic' as const,
      grounded: {
        pathKey: groundedPayload.selectedPath.key,
        status: groundedPayload.selectedPath.status,
        rank: groundedPayload.selectedPath.rank,
        isHypothetical: groundedPayload.isHypothetical,
      },
    };
  }
};
