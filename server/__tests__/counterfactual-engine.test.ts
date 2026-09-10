import { describe, expect, it } from 'vitest';
import { materializeSupportedChanges, relevantSupportedChanges, supportedChangeCatalog } from '../counterfactual/catalog';
import {
  applySupportedChanges,
  exploreSmallestUnlock,
  generateCombinations,
  MAX_UNLOCK_CHANGES,
  orderUnlockCandidates,
} from '../counterfactual/engine';
import type { SupportedChange, UnlockCandidate } from '../counterfactual/domain';
import { normalizeHousingCase } from '../retention-paths/normalize';

const luna = normalizeHousingCase(
  { primaryBarrier: 'housing', urgency: 'This week', goal: 'Stay where I am' },
  [
    { factorType: 'behavior_contributor', factorValue: 'behavior' },
    { factorType: 'behavior_concern', factorValue: 'Barking or excessive noise' },
    { factorType: 'cost_constraint', factorValue: 'Cannot afford a professional trainer' },
  ],
);

describe('Counterfactual Explorer', () => {
  it('uses a small trusted supported-change catalog', () => {
    expect(supportedChangeCatalog.map(({ code }) => code)).toEqual([
      'ALLOW_STAY_OR_MOVE',
      'CONFIRM_HOUSING_RESOLUTION',
      'CONFIRM_BEHAVIOR_MITIGATION',
      'CONFIRM_TEMPORARY_CARE',
      'CONFIRM_UNDERLYING_ISSUE_RESOLUTION',
      'CONFIRM_PET_FRIENDLY_HOUSING',
      'CONFIRM_MOVE_REQUIREMENTS',
    ]);
    expect(MAX_UNLOCK_CHANGES).toBe(3);
  });

  it('rejects arbitrary or inapplicable changes', () => {
    expect(() => materializeSupportedChanges(luna, ['NOT_SUPPORTED' as never])).toThrow(/Unsupported change/);
  });

  it('generates bounded candidates and only changes relevant blocker fields', () => {
    const result = exploreSmallestUnlock(luna, 'move_with_pet')!;
    const relevant = relevantSupportedChanges(luna, result.currentBlockers);
    expect(relevant.map(({ code }) => code)).toEqual([
      'ALLOW_STAY_OR_MOVE', 'CONFIRM_PET_FRIENDLY_HOUSING', 'CONFIRM_MOVE_REQUIREMENTS',
    ]);
    expect(generateCombinations(relevant, 2)).toHaveLength(3);
  });

  it('finds a single-change unlock', () => {
    const facts = applySupportedChanges(luna, materializeSupportedChanges(luna, ['CONFIRM_UNDERLYING_ISSUE_RESOLUTION']));
    const result = exploreSmallestUnlock(facts, 'temporary_care_bridge')!;
    expect(result.smallestUnlock?.changes.map(({ code }) => code)).toEqual(['CONFIRM_TEMPORARY_CARE']);
    expect(result.smallestUnlock?.changeCount).toBe(1);
  });

  it('finds Luna’s three-change move unlock and minimizes cardinality', () => {
    const result = exploreSmallestUnlock(luna, 'move_with_pet')!;
    expect(result.currentStatus).toBe('BLOCKED');
    expect(result.smallestUnlock?.changeCount).toBe(3);
    expect(result.smallestUnlock?.changes.map(({ code }) => code)).toEqual([
      'ALLOW_STAY_OR_MOVE', 'CONFIRM_PET_FRIENDLY_HOUSING', 'CONFIRM_MOVE_REQUIREMENTS',
    ]);
    expect(result.smallestUnlock?.resultingStatus).toBe('FEASIBLE');
  });

  it('uses burden then stable change-code order to rank equal-cardinality candidates', () => {
    const evaluation = exploreSmallestUnlock(luna, 'move_with_pet')!.currentPathEvaluation;
    const change = (code: SupportedChange['code'], burden: number): SupportedChange => ({
      code, burden, field: 'moveRequirementsMet', from: 'unknown', to: true,
      label: code, source: 'supported_catalog',
    });
    const candidate = (changeValue: SupportedChange): UnlockCandidate => ({
      changes: [changeValue], changeCount: 1, totalBurden: changeValue.burden,
      resultingStatus: 'FEASIBLE', resultingPathEvaluation: evaluation,
    });
    const ordered = orderUnlockCandidates([
      candidate(change('CONFIRM_MOVE_REQUIREMENTS', 4)),
      candidate(change('CONFIRM_HOUSING_RESOLUTION', 2)),
      candidate(change('CONFIRM_BEHAVIOR_MITIGATION', 2)),
    ]);
    expect(ordered.map(({ changes }) => changes[0].code)).toEqual([
      'CONFIRM_BEHAVIOR_MITIGATION', 'CONFIRM_HOUSING_RESOLUTION', 'CONFIRM_MOVE_REQUIREMENTS',
    ]);
  });

  it('does not mutate actual facts and unknown remains unknown unless directly overridden', () => {
    const before = structuredClone(luna);
    const changed = applySupportedChanges(luna, materializeSupportedChanges(luna, ['ALLOW_STAY_OR_MOVE']));
    expect(luna).toEqual(before);
    expect(changed.constraints.temporaryCareAvailable).toBe('unknown');
    expect(changed.constraints.goalSupportsMove).toBe(true);
  });

  it('supports BLOCKED to CONDITIONAL and CONDITIONAL to FEASIBLE recomputation', () => {
    const afterGoal = exploreSmallestUnlock(luna, 'move_with_pet', ['ALLOW_STAY_OR_MOVE'])!;
    expect(afterGoal.currentStatus).toBe('CONDITIONAL');
    expect(afterGoal.smallestUnlock?.changeCount).toBe(2);

    const temporary = exploreSmallestUnlock(luna, 'temporary_care_bridge')!;
    expect(temporary.currentStatus).toBe('CONDITIONAL');
    expect(temporary.smallestUnlock?.resultingStatus).toBe('FEASIBLE');
  });

  it('returns no unlock when feasible or when no supported combination exists', () => {
    const stayChanges = materializeSupportedChanges(luna, [
      'CONFIRM_HOUSING_RESOLUTION', 'CONFIRM_BEHAVIOR_MITIGATION',
    ]);
    const feasibleFacts = applySupportedChanges(luna, stayChanges);
    const feasible = exploreSmallestUnlock(feasibleFacts, 'remain_in_current_housing')!;
    expect(feasible.unlockNeeded).toBe(false);
    expect(feasible.smallestUnlock).toBeNull();

    const missingGoal = { ...luna, goal: null, constraints: { ...luna.constraints, goalSupportsStay: 'unknown' as const } };
    const unsupported = exploreSmallestUnlock(missingGoal, 'remain_in_current_housing')!;
    expect(unsupported.smallestUnlock).toBeNull();
  });

  it('validates target paths and never uses resources as case truth', () => {
    expect(exploreSmallestUnlock(luna, 'not-a-path')).toBeUndefined();
    expect(luna.constraints.temporaryCareAvailable).toBe('unknown');
  });
});
