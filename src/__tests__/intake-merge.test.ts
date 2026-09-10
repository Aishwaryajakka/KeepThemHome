import { describe, expect, it } from 'vitest';
import { mergeIntakeResult } from '@/lib/intake-merge';
import { initialAssessmentCase } from '@/lib/assessment-session';
import { structuredFactors } from '@/hooks/use-case-sync';
import { normalizeHousingCase } from '../../server/retention-paths/normalize';
import { solveRetentionPaths } from '../../server/retention-paths/solver';
import type { IntakeResult } from '@/lib/intake-api';

const result: IntakeResult = {
  extraction: {
    petName: 'Luna', petType: null, primaryBarrier: 'housing',
    contributingBarriers: ['behavior', 'cost'],
    housingSituation: 'My landlord or property says pets aren’t allowed',
    behaviorConcern: 'Barking or excessive noise', behaviorSeriousness: null,
    behaviorAlreadyTried: null, behaviorHelpBarrier: 'Cost',
    costConstraint: 'Cannot afford a trainer', urgency: 'This week', goal: null,
  },
  followUps: [{ field: 'goal', screen: 'housing-3', question: 'Would you prefer to stay where you are or move?' }],
};

describe('intake merge', () => {
  it('merges explicit facts without erasing existing facts or inventing a goal', () => {
    const merged = mergeIntakeResult({ ...initialAssessmentCase, petType: 'dog' }, result);
    expect(merged).toMatchObject({ petName: 'Luna', petType: 'dog', rootCause: 'housing', costConstraint: 'Cannot afford a trainer', currentScreen: 'housing-3' });
    expect(merged.housing.goal).toBe('');
    expect(merged.behavior.concern).toBe('Barking or excessive noise');
  });

  it('maps extracted factors into the existing deterministic solver input', () => {
    const merged = mergeIntakeResult({ ...initialAssessmentCase, petType: 'dog' }, result);
    const factors = structuredFactors(merged).map((factor, index) => ({
      id: String(index), caseId: 'case', confidence: null, createdAt: new Date(), ...factor,
    }));
    const normalized = normalizeHousingCase({ primaryBarrier: merged.rootCause || null, urgency: merged.housing.urgency || null, goal: null }, factors);
    expect(normalized.constraints.behaviorContributor).toBe(true);
    expect(normalized.costConstraint).toBe('Cannot afford a trainer');
    expect(solveRetentionPaths(normalized)).toHaveLength(3);
  });

  it('routes an explicit immediate safety signal into the existing safety screen', () => {
    const safety = mergeIntakeResult(initialAssessmentCase, {
      extraction: {
        ...result.extraction, primaryBarrier: 'behavior', contributingBarriers: [],
        housingSituation: null, costConstraint: null, behaviorHelpBarrier: 'Cost',
        behaviorSeriousness: 'There’s an immediate safety concern', urgency: null,
      },
      followUps: [],
    });
    expect(safety.currentScreen).toBe('behavior-2');
    expect(safety.behavior.seriousness).toBe('There’s an immediate safety concern');
  });
});
