import { beforeEach, describe, expect, it } from 'vitest';
import { ASSESSMENT_SESSION_KEY, ASSESSMENT_SESSION_VERSION, initialAssessmentCase, loadAssessmentCase, persistAssessmentCase } from '@/lib/assessment-session';

describe('assessment session v2', () => {
  beforeEach(() => sessionStorage.clear());

  it('persists and restores multi-factor state and behavior concerns', () => {
    const state = {
      ...initialAssessmentCase, petName: 'Luna', petType: 'dog' as const,
      rootCause: 'housing' as const, selectedFactors: ['housing', 'behavior', 'cost'] as const,
      contributingBarriers: ['behavior', 'cost'] as const,
      behavior: { ...initialAssessmentCase.behavior, concern: 'Barking or excessive noise' as const, concerns: ['Barking or excessive noise', 'Separation-related behavior'] as const },
    };
    persistAssessmentCase(state);
    expect(loadAssessmentCase()).toEqual(state);
    expect(JSON.parse(sessionStorage.getItem(ASSESSMENT_SESSION_KEY)!).version).toBe(ASSESSMENT_SESSION_VERSION);
  });

  it('migrates a valid version-1 session without losing its explicit primary', () => {
    sessionStorage.setItem(ASSESSMENT_SESSION_KEY, JSON.stringify({
      version: 1,
      caseState: {
        petName: 'Luna', petType: 'dog', rootCause: 'housing', contributingBarriers: ['behavior', 'cost'], costConstraint: 'Cannot afford a trainer',
        housing: { situation: 'My landlord or property says pets aren’t allowed', urgency: 'This week', goal: 'Stay where I am' },
        behavior: { concern: 'Barking or excessive noise', seriousness: '', alreadyTried: '', helpBarrier: 'Cost' },
        outcome: '', currentScreen: 'housing-3',
      },
    }));
    const restored = loadAssessmentCase();
    expect(restored.selectedFactors).toEqual(['housing', 'behavior', 'cost']);
    expect(restored.contributingBarriers).toEqual(['behavior', 'cost']);
    expect(restored.behavior.concerns).toEqual(['Barking or excessive noise']);
  });
});
