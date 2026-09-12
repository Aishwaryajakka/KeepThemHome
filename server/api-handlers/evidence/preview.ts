import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, parseBody, safeServerError } from '../../http.js';
import { selectEvidenceForPath } from '../../evidence/select.js';
import { solveRetentionPaths } from '../../retention-paths/solver.js';
import type { NormalizedHousingCase } from '../../retention-paths/domain.js';
import { evidencePreviewSchema } from '../../validation/evidence-preview.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const parsed = parseBody(request, evidencePreviewSchema);
  if (!parsed.success) return response.status(400).json({ error: 'Invalid evidence preview request' });
  try {
    const input = parsed.data;
    const facts: NormalizedHousingCase = {
      primaryBarrier: input.primaryBarrier, contributingBarriers: input.contributingBarriers,
      situation: input.situation, urgency: input.urgency, goal: input.goal, costConstraint: input.costConstraint,
      constraints: {
        goalSupportsStay: input.goal === 'Stay where I am' || input.goal === 'Either could work' ? true : input.goal === 'Move' ? false : 'unknown',
        goalSupportsMove: input.goal === 'Move' || input.goal === 'Either could work' ? true : input.goal === 'Stay where I am' ? false : 'unknown',
        housingResolutionPossible: 'unknown', behaviorContributor: input.behaviorContributor,
        behaviorMitigationAvailable: 'unknown', temporaryCareAvailable: 'unknown', underlyingIssueResolutionPossible: 'unknown',
        petFriendlyHousingAvailable: 'unknown', moveRequirementsMet: 'unknown',
      },
    };
    const path = solveRetentionPaths(facts).find(({ key }) => key === input.pathKey);
    return path
      ? response.status(200).json(selectEvidenceForPath('anonymous-preview', path, facts))
      : response.status(404).json({ error: 'Path not found' });
  } catch { return safeServerError(response); }
}
