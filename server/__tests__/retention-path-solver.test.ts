import { describe, expect, it } from 'vitest';
import { normalizeHousingCase } from '../retention-paths/normalize.js';
import { solveRetentionPaths } from '../retention-paths/solver.js';
import type { NormalizedHousingCase } from '../retention-paths/domain.js';
import type { RetentionPathDefinition } from '../retention-paths/domain.js';

const luna = normalizeHousingCase(
  { primaryBarrier: 'housing', urgency: 'This week', goal: 'Stay where I am' },
  [
    { factorType: 'housing_situation', factorValue: 'My landlord or property says pets aren’t allowed' },
    { factorType: 'behavior_contributor', factorValue: 'behavior' },
    { factorType: 'behavior_concern', factorValue: 'Barking or excessive noise' },
    { factorType: 'cost_constraint', factorValue: 'Cannot afford a professional trainer' },
  ],
);

const withConstraints = (overrides: Partial<NormalizedHousingCase['constraints']>) => ({
  ...luna,
  constraints: { ...luna.constraints, ...overrides },
});

describe('Retention Path Solver', () => {
  it('generates the three distinct flagship Luna paths deterministically', () => {
    const first = solveRetentionPaths(luna);
    const second = solveRetentionPaths(luna);
    expect(first).toEqual(second);
    expect(first.map(({ key }) => key)).toEqual([
      'remain_in_current_housing',
      'temporary_care_bridge',
      'move_with_pet',
    ]);
    expect(first.every(({ steps }) => steps.length === 3)).toBe(true);
  });

  it('keeps unknown values unknown and classifies unmet knowledge as conditional', () => {
    const paths = solveRetentionPaths(luna);
    const stay = paths.find(({ key }) => key === 'remain_in_current_housing')!;
    const temporary = paths.find(({ key }) => key === 'temporary_care_bridge')!;
    expect(stay.status).toBe('CONDITIONAL');
    expect(stay.blockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'housingResolutionPossible', status: 'UNKNOWN' }),
      expect.objectContaining({ field: 'behaviorMitigationAvailable', status: 'UNKNOWN' }),
    ]));
    expect(temporary.status).toBe('CONDITIONAL');
    expect(temporary.blockers).toContainEqual(expect.objectContaining({
      field: 'temporaryCareAvailable', currentValue: 'unknown', status: 'UNKNOWN',
    }));
  });

  it('classifies a path feasible only when every applicable requirement is explicitly met', () => {
    const [stay] = solveRetentionPaths(withConstraints({
      housingResolutionPossible: true,
      behaviorMitigationAvailable: true,
    }));
    expect(stay.status).toBe('FEASIBLE');
    expect(stay.blockers).toHaveLength(0);
    expect(stay.reasonCodes).toContain('PATH_REQUIREMENTS_MET');
  });

  it('classifies a known conflicting requirement as blocked with a structured blocker', () => {
    const move = solveRetentionPaths(luna).find(({ key }) => key === 'move_with_pet')!;
    expect(move.status).toBe('BLOCKED');
    expect(move.blockers).toContainEqual(expect.objectContaining({
      code: 'KNOWN_CONSTRAINT_CONFLICT',
      field: 'goalSupportsMove',
      currentValue: false,
      requiredCondition: 'Goal allows moving with the pet',
      status: 'KNOWN_CONFLICT',
    }));
  });

  it('does not treat a temporary-care directory or any resource as availability evidence', () => {
    const temporary = solveRetentionPaths(luna).find(({ key }) => key === 'temporary_care_bridge')!;
    expect(temporary.status).toBe('CONDITIONAL');
    expect(temporary.reasonCodes).toContain('UNKNOWN_REQUIREMENT');
  });

  it('uses explicit requirement and reason data in stable ranked order', () => {
    const paths = solveRetentionPaths(withConstraints({
      housingResolutionPossible: true,
      behaviorMitigationAvailable: true,
      temporaryCareAvailable: true,
      underlyingIssueResolutionPossible: true,
    }));
    expect(paths[0].key).toBe('remain_in_current_housing');
    expect(paths[0].rankScore).toBeGreaterThan(paths[1].rankScore);
    expect(paths[0].reasonCodes).toEqual(expect.arrayContaining([
      'HOUSING_BARRIER', 'BEHAVIOR_CONTRIBUTOR', 'COST_CONSTRAINT', 'URGENT_CASE', 'GOAL_STAY',
    ]));
  });

  it('breaks exact ranking ties by stable catalog order', () => {
    const tied: RetentionPathDefinition[] = ['first', 'second'].map((key) => ({
      key,
      title: key,
      objective: key,
      disruption: 1,
      goalAlignment: 'either',
      steps: [],
      requirements: [],
    }));
    expect(solveRetentionPaths(luna, tied).map(({ key }) => key)).toEqual(['first', 'second']);
    expect(solveRetentionPaths(luna, [...tied].reverse()).map(({ key }) => key)).toEqual(['second', 'first']);
  });
});
