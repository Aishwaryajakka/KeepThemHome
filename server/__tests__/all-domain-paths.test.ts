import { describe, expect, it } from 'vitest';
import { solveRetentionPaths } from '../retention-paths/solver.js';
import { exploreSmallestUnlock } from '../counterfactual/engine.js';
import type { NormalizedHousingCase } from '../retention-paths/domain.js';

const domains = ['behavior', 'cost', 'medical', 'temporary_crisis', 'time_capacity', 'circumstances'] as const;
const facts = (primaryBarrier: string, value: true | false | 'unknown'): NormalizedHousingCase => ({
  primaryBarrier, contributingBarriers: [], situation: null, urgency: 'Within a month', goal: null, costConstraint: null,
  constraints: { primarySupportPossible: value, bridgeAvailable: value, alternativeAvailable: value },
});

describe('all retention domains', () => {
  it.each(domains)('%s has feasible, conditional, blocked, and unlock behavior', (domain) => {
    expect(solveRetentionPaths(facts(domain, true))).toHaveLength(3);
    expect(solveRetentionPaths(facts(domain, true)).every(({ status }) => status === 'FEASIBLE')).toBe(true);
    expect(solveRetentionPaths(facts(domain, 'unknown')).every(({ status }) => status === 'CONDITIONAL')).toBe(true);
    const blocked = solveRetentionPaths(facts(domain, false));
    expect(blocked.every(({ status }) => status === 'BLOCKED')).toBe(true);
    expect(exploreSmallestUnlock(facts(domain, false), blocked[0].key)?.smallestUnlock?.resultingStatus).toBe('FEASIBLE');
  });

  it('adds a real blocker when a contributing factor is present', () => {
    const base = facts('cost', true);
    const withMedical = { ...base, contributingBarriers: ['medical'], constraints: { ...base.constraints, careAccessPossible: 'unknown' as const } };
    expect(solveRetentionPaths(base)[0].status).toBe('FEASIBLE');
    expect(solveRetentionPaths(withMedical)[0].blockers.map(({ field }) => field)).toContain('careAccessPossible');
  });
});
