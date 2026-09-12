import type { StructuredSimilarityInput } from './domain.js';

export const CANONICAL_SIMILARITY_VERSION = 'structured-v1';
const clean = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
const allowedFactors = new Set(['housing', 'behavior', 'cost', 'medical', 'temporary_crisis', 'time_capacity', 'circumstances', 'unknown']);
const allowedConstraints = new Set(['goalSupportsStay', 'goalSupportsMove', 'housingResolutionPossible', 'behaviorContributor', 'behaviorMitigationAvailable', 'temporaryCareAvailable', 'underlyingIssueResolutionPossible', 'petFriendlyHousingAvailable', 'moveRequirementsMet', 'primarySupportPossible', 'bridgeAvailable', 'alternativeAvailable', 'safetyManageable', 'costReductionPossible', 'careAccessPossible', 'careSupportAvailable', 'householdAdaptationPossible']);
const allowedPaths = new Set(['remain_in_current_housing', 'temporary_care_bridge', 'move_with_pet', 'unknown']);
const allowedInterventions = new Set(['clarify_housing_restriction', 'address_housing_cost', 'search_pet_friendly_housing', 'seek_temporary_care_bridge', 'explore_general_pet_support', 'behavior_management_plan', 'behavior_separation_support', 'qualified_behavior_support', 'lower_cost_service', 'financial_assistance_search', 'lower_cost_veterinary_search', 'veterinary_support_navigation', 'veterinary_transport_support', 'temporary_caregiver', 'trusted_network_support', 'emergency_pet_support', 'routine_modification', 'shared_caregiving', 'household_transition_planning', 'housing_transition_support', 'behavior_support', 'temporary_care_bridge', 'pet_friendly_housing_search']);
const uniqueAllowed = (values: string[], allowed: Set<string>) => Array.from(new Set(values.map((value) => allowed.has(value) ? value : allowed.has(clean(value)) ? clean(value) : '').filter(Boolean))).sort();

export const normalizeSimilarityInput = (input: StructuredSimilarityInput): StructuredSimilarityInput => ({
  petType: ['dog', 'cat', 'other'].includes(clean(input.petType)) ? clean(input.petType) : 'other',
  primaryFactor: allowedFactors.has(clean(input.primaryFactor)) ? clean(input.primaryFactor) : 'unknown',
  urgencyBucket: ['immediate', 'within_week', 'within_month', 'planning_ahead', 'unknown'].includes(clean(input.urgencyBucket)) ? clean(input.urgencyBucket) : 'unknown',
  contributingFactors: uniqueAllowed(input.contributingFactors, allowedFactors), constraintKeys: uniqueAllowed(input.constraintKeys, allowedConstraints), pathKey: allowedPaths.has(clean(input.pathKey)) ? clean(input.pathKey) : 'unknown',
  blockerCategories: uniqueAllowed(input.blockerCategories, allowedFactors), interventionCategories: uniqueAllowed(input.interventionCategories, allowedInterventions), outcomeCategory: input.outcomeCategory,
});

export const canonicalSimilarityText = (raw: StructuredSimilarityInput) => {
  const input = normalizeSimilarityInput(raw);
  return [
    `pet_type:${input.petType}`, `primary_factor:${input.primaryFactor}`, `contributors:${input.contributingFactors.join(',')}`,
    `urgency:${input.urgencyBucket}`, `constraints:${input.constraintKeys.join(',')}`, `selected_path:${input.pathKey}`,
    `blockers:${input.blockerCategories.join(',')}`, `actions:${input.interventionCategories.join(',')}`, `outcome:${input.outcomeCategory}`,
  ].join('\n');
};

// Privacy-safe, deterministic feature hashing. No narrative or external provider receives data.
export const structuredEmbedding = (input: StructuredSimilarityInput, dimensions = 32) => {
  const vector = Array.from({ length: dimensions }, () => 0);
  for (const token of canonicalSimilarityText(input).split(/[\n,:]+/).filter(Boolean)) {
    let hash = 2166136261;
    for (const character of token) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    vector[Math.abs(hash) % dimensions] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
};

export const urgencyBucket = (value: string | null) => value?.toLowerCase().includes('week') ? 'within_week' : value?.toLowerCase().includes('today') ? 'immediate' : value?.toLowerCase().includes('month') ? 'within_month' : 'unknown';
