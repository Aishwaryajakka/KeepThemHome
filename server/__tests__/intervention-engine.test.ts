import { describe, expect, it } from 'vitest';
import { rankHousingInterventions } from '../interventions/engine.js';

const rank = (situation: string, goal = 'Either could work', urgency = 'Within a month') =>
  rankHousingInterventions({ primaryBarrier: 'housing', situation, goal, urgency });

describe('deterministic Housing intervention engine', () => {
  it('prioritizes financial help for a pet deposit or fee', () => {
    const [first] = rank('I can’t afford the pet deposit or fee', 'Stay where I am');
    expect(first.key).toBe('address_housing_cost');
    expect(first.reasons).toContain('PET_DEPOSIT_OR_FEE');
    expect(first.reasons).toContain('GOAL_STAY');
  });

  it('prioritizes housing search when moving', () => {
    const [first] = rank('I’m moving and struggling to find pet-friendly housing', 'Move');
    expect(first.key).toBe('search_pet_friendly_housing');
    expect(first.reasons).toEqual(expect.arrayContaining(['MOVING_HOUSING_SEARCH', 'GOAL_MOVE']));
  });

  it('prioritizes temporary care for a temporary housing gap', () => {
    const [first] = rank('I’m temporarily between homes', 'Either could work', 'This week');
    expect(first.key).toBe('seek_temporary_care_bridge');
    expect(first.reasons).toEqual(expect.arrayContaining(['TEMPORARY_HOUSING', 'URGENT_CASE']));
  });

  it('uses stay and move goals as explicit ranking rules', () => {
    const situation = 'My landlord or property says pets aren’t allowed';
    const stay = rank(situation, 'Stay where I am');
    const move = rank(situation, 'Move');
    expect(stay.find(({ key }) => key === 'clarify_housing_restriction')?.reasons).toContain('GOAL_STAY');
    expect(move.find(({ key }) => key === 'search_pet_friendly_housing')?.reasons).toContain('GOAL_MOVE');
  });
});
