import { interventionCatalog, type InterventionKey } from './catalog.js';

export type HousingFacts = {
  primaryBarrier: 'housing';
  situation?: string | null;
  urgency?: string | null;
  goal?: string | null;
};

export type InterventionReasonCode =
  | 'HOUSING_BARRIER'
  | 'LANDLORD_OR_PROPERTY_RESTRICTION'
  | 'PET_DEPOSIT_OR_FEE'
  | 'MOVING_HOUSING_SEARCH'
  | 'BREED_OR_SIZE_RESTRICTION'
  | 'TEMPORARY_HOUSING'
  | 'GOAL_STAY'
  | 'GOAL_MOVE'
  | 'GOAL_FLEXIBLE'
  | 'URGENT_CASE';

type RankedIntervention = typeof interventionCatalog[number] & {
  score: number;
  reasons: InterventionReasonCode[];
};

const add = (
  scores: Map<InterventionKey, { score: number; reasons: InterventionReasonCode[] }>,
  keys: InterventionKey[],
  points: number,
  reason: InterventionReasonCode,
) => {
  for (const key of keys) {
    const candidate = scores.get(key);
    if (!candidate) continue;
    candidate.score += points;
    if (!candidate.reasons.includes(reason)) candidate.reasons.push(reason);
  }
};

export const rankHousingInterventions = (facts: HousingFacts): RankedIntervention[] => {
  const scores = new Map<InterventionKey, { score: number; reasons: InterventionReasonCode[] }>();
  for (const item of interventionCatalog) scores.set(item.key, { score: 1, reasons: ['HOUSING_BARRIER'] });

  if (facts.situation === 'My landlord or property says pets aren’t allowed') {
    add(scores, ['clarify_housing_restriction'], 10, 'LANDLORD_OR_PROPERTY_RESTRICTION');
  } else if (facts.situation === 'I can’t afford the pet deposit or fee') {
    add(scores, ['address_housing_cost'], 12, 'PET_DEPOSIT_OR_FEE');
  } else if (facts.situation === 'I’m moving and struggling to find pet-friendly housing') {
    add(scores, ['search_pet_friendly_housing'], 12, 'MOVING_HOUSING_SEARCH');
  } else if (facts.situation === 'There’s a breed or size restriction') {
    add(scores, ['clarify_housing_restriction', 'search_pet_friendly_housing'], 8, 'BREED_OR_SIZE_RESTRICTION');
  } else if (facts.situation === 'I’m temporarily between homes') {
    add(scores, ['seek_temporary_care_bridge'], 12, 'TEMPORARY_HOUSING');
  }

  if (facts.goal === 'Stay where I am') {
    add(scores, ['clarify_housing_restriction', 'address_housing_cost'], 4, 'GOAL_STAY');
  } else if (facts.goal === 'Move') {
    add(scores, ['search_pet_friendly_housing'], 6, 'GOAL_MOVE');
    add(scores, ['seek_temporary_care_bridge'], 2, 'GOAL_MOVE');
  } else if (facts.goal === 'Either could work') {
    add(scores, ['explore_general_pet_support', 'search_pet_friendly_housing'], 3, 'GOAL_FLEXIBLE');
  }

  if (facts.urgency === 'Today or within 48 hours' || facts.urgency === 'This week') {
    add(scores, ['seek_temporary_care_bridge'], 4, 'URGENT_CASE');
    add(scores, ['clarify_housing_restriction'], 2, 'URGENT_CASE');
  }

  return interventionCatalog
    .map((item, index) => ({ ...item, ...scores.get(item.key)!, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ index: _index, ...item }) => item);
};
