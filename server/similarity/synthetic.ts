import type { StructuredSimilarityInput } from './domain.js';

export const syntheticSimilarityCases: Array<{ key: string; input: StructuredSimilarityInput }> = [
  { key: 'example-housing-behavior', input: { petType: 'dog', primaryFactor: 'housing', contributingFactors: ['behavior'], urgencyBucket: 'within_week', constraintKeys: ['housingResolutionPossible', 'behaviorMitigationAvailable'], pathKey: 'remain_in_current_housing', blockerCategories: ['housing', 'behavior'], interventionCategories: ['clarify_housing_restriction', 'behavior_support'], outcomeCategory: 'KEEPING_PET' } },
  { key: 'example-housing-cost', input: { petType: 'dog', primaryFactor: 'housing', contributingFactors: ['cost'], urgencyBucket: 'within_week', constraintKeys: ['temporaryCareAvailable'], pathKey: 'temporary_care_bridge', blockerCategories: ['housing', 'cost'], interventionCategories: ['temporary_care_bridge'], outcomeCategory: 'STILL_TRYING' } },
  { key: 'example-housing-only', input: { petType: 'dog', primaryFactor: 'housing', contributingFactors: [], urgencyBucket: 'within_month', constraintKeys: ['petFriendlyHousingAvailable'], pathKey: 'move_with_pet', blockerCategories: ['housing'], interventionCategories: ['pet_friendly_housing_search'], outcomeCategory: 'REHOMING_SUPPORT_NEEDED' } },
];
