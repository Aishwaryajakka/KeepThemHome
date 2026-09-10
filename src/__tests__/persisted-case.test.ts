import { describe, expect, it } from 'vitest';
import { restorePersistedCase } from '@/lib/persisted-case';
import type { SavedCaseDetail } from '@/lib/case-api';

const saved = (name: string, id: string): SavedCaseDetail => ({
  case: {
    id, petName: name, petType: name === 'Luna' ? 'dog' : 'cat', primaryBarrier: 'housing',
    urgency: 'This week', goal: 'Stay where I am', currentStatus: 'active',
    userId: '750e8400-e29b-41d4-a716-446655440000', petId: '650e8400-e29b-41d4-a716-446655440000',
    createdAt: '2026-09-10T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z',
  },
  pet: { id: '650e8400-e29b-41d4-a716-446655440000', userId: '750e8400-e29b-41d4-a716-446655440000', name, type: name === 'Luna' ? 'dog' : 'cat', createdAt: '', updatedAt: '' },
  factors: [
    ['primary_barrier', 'housing', 'primary'], ['behavior_contributor', 'behavior', 'contributing'],
    ['contributing_cost', 'cost', 'contributing'], ['behavior_concern_barking_or_excessive_noise', 'Barking or excessive noise', 'contributing'],
    ['behavior_help_barrier', 'Cost', 'constraint'], ['cost_constraint', 'Cannot afford behavior help', 'constraint'],
    ['housing_situation', 'My landlord or property says pets aren’t allowed', 'contributing'],
  ].map(([factorType, factorValue, role], index) => ({ id: String(index), caseId: id, factorType, factorValue, role: role as 'primary', source: 'structured' as const, createdAt: '' })),
  outcomes: [],
});

describe('saved case restoration', () => {
  it('restores the complete Luna multi-factor state without repeated intake', () => {
    const state = restorePersistedCase(saved('Luna', '550e8400-e29b-41d4-a716-446655440000'))!;
    expect(state).toMatchObject({
      backendCaseId: '550e8400-e29b-41d4-a716-446655440000', petName: 'Luna', petType: 'dog',
      rootCause: 'housing', selectedFactors: ['housing', 'behavior', 'cost'], contributingBarriers: ['behavior', 'cost'],
      costConstraint: 'Cannot afford behavior help', currentScreen: 'housing-plan',
      housing: { situation: 'My landlord or property says pets aren’t allowed', urgency: 'This week', goal: 'Stay where I am' },
      behavior: { concern: 'Barking or excessive noise', concerns: ['Barking or excessive noise'], helpBarrier: 'Cost' },
    });
  });

  it('restores another pet independently instead of merging Luna state', () => {
    const luna = restorePersistedCase(saved('Luna', '550e8400-e29b-41d4-a716-446655440000'))!;
    const max = restorePersistedCase(saved('Max', '850e8400-e29b-41d4-a716-446655440000'))!;
    expect(max.petName).toBe('Max');
    expect(max.petType).toBe('cat');
    expect(max.backendCaseId).not.toBe(luna.backendCaseId);
  });
});
