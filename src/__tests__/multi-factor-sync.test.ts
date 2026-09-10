import { describe, expect, it } from 'vitest';
import { structuredFactors } from '@/hooks/use-case-sync';
import { initialAssessmentCase } from '@/lib/assessment-session';
import { normalizeHousingCase } from '../../server/retention-paths/normalize';

describe('multi-factor persistence mapping', () => {
  it('creates stable rows for multiple barriers and behavior concerns', () => {
    const factors = structuredFactors({
      ...initialAssessmentCase,
      rootCause: 'housing', selectedFactors: ['housing', 'behavior', 'cost'], contributingBarriers: ['behavior', 'cost'],
      costConstraint: 'Cannot afford behavior help',
      behavior: { ...initialAssessmentCase.behavior, concern: 'Barking or excessive noise', concerns: ['Barking or excessive noise', 'Separation-related behavior'], helpBarrier: 'Cost' },
    });
    expect(factors).toEqual(expect.arrayContaining([
      expect.objectContaining({ factorType: 'primary_barrier', factorValue: 'housing', role: 'primary' }),
      expect.objectContaining({ factorType: 'behavior_contributor', factorValue: 'behavior' }),
      expect.objectContaining({ factorType: 'contributing_cost', factorValue: 'cost' }),
      expect.objectContaining({ factorType: 'behavior_concern_barking_or_excessive_noise', factorValue: 'Barking or excessive noise' }),
      expect.objectContaining({ factorType: 'behavior_concern_separation_related_behavior', factorValue: 'Separation-related behavior' }),
      expect.objectContaining({ factorType: 'cost_constraint', factorValue: 'Cannot afford behavior help' }),
    ]));
    const normalized = normalizeHousingCase(
      { primaryBarrier: 'housing', urgency: 'This week', goal: 'Stay where I am' },
      factors.map((factor) => ({ factorType: factor.factorType, factorValue: factor.factorValue ?? null })),
    );
    expect(normalized.constraints.behaviorContributor).toBe(true);
    expect(normalized.costConstraint).toBe('Cannot afford behavior help');
  });

  it('writes null tombstones for deselected factors and concerns', () => {
    const factors = structuredFactors(initialAssessmentCase);
    expect(factors).toContainEqual(expect.objectContaining({ factorType: 'behavior_contributor', factorValue: null }));
    expect(factors).toContainEqual(expect.objectContaining({ factorType: 'behavior_concern_barking_or_excessive_noise', factorValue: null }));
  });
});
