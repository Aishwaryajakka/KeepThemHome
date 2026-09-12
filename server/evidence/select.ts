import { evidenceCatalog, evidenceClaims } from './catalog';
import type { EvidenceClaimCode, PathEvidenceResponse } from './domain';
import type { NormalizedHousingCase, PathEvaluation } from '../retention-paths/domain';

const interventionClaims: Record<string, EvidenceClaimCode[]> = {
  clarify_housing_restriction: ['LANDLORD_HOUSING_BARRIER', 'HOUSING_SURRENDER_DRIVER'],
  address_housing_cost: ['FINANCIAL_SURRENDER_DRIVER', 'HOUSING_SURRENDER_DRIVER'],
  search_pet_friendly_housing: ['PET_FRIENDLY_HOUSING_BARRIER', 'HOUSING_SURRENDER_DRIVER'],
  seek_temporary_care_bridge: ['TEMPORARY_CARE_SUPPORT'],
  explore_general_pet_support: ['MULTI_FACTOR_SURRENDER'],
  behavior_management_plan: ['BEHAVIOR_SURRENDER_DRIVER'], behavior_separation_support: ['BEHAVIOR_HELP_ACCESS', 'TEMPORARY_CARE_SUPPORT'],
  qualified_behavior_support: ['BEHAVIOR_HELP_ACCESS'], lower_cost_service: ['FINANCIAL_SURRENDER_DRIVER'],
  financial_assistance_search: ['FINANCIAL_SURRENDER_DRIVER'], lower_cost_veterinary_search: ['VETERINARY_COST_SUPPORT'],
  veterinary_support_navigation: ['VETERINARY_COST_SUPPORT'], veterinary_transport_support: ['VETERINARY_COST_SUPPORT'],
  temporary_caregiver: ['TEMPORARY_CARE_SUPPORT'], trusted_network_support: ['TEMPORARY_CARE_SUPPORT'], emergency_pet_support: ['TEMPORARY_CARE_SUPPORT'],
  routine_modification: ['MULTI_FACTOR_SURRENDER'], shared_caregiving: ['MULTI_FACTOR_SURRENDER'],
  household_transition_planning: ['MULTI_FACTOR_SURRENDER'], housing_transition_support: ['HOUSING_SURRENDER_DRIVER'],
};

const pathClaims: Record<string, EvidenceClaimCode[]> = {
  remain_in_current_housing: ['LANDLORD_HOUSING_BARRIER', 'HOUSING_SURRENDER_DRIVER'],
  temporary_care_bridge: ['TEMPORARY_CARE_SUPPORT', 'HOUSING_SURRENDER_DRIVER'],
  move_with_pet: ['PET_FRIENDLY_HOUSING_BARRIER', 'HOUSING_SURRENDER_DRIVER'],
  manage_behavior_at_home: ['BEHAVIOR_SURRENDER_DRIVER'], behavior_support_bridge: ['BEHAVIOR_HELP_ACCESS', 'TEMPORARY_CARE_SUPPORT'], specialist_supported_retention: ['BEHAVIOR_HELP_ACCESS'],
  reduce_immediate_expense: ['FINANCIAL_SURRENDER_DRIVER'], financial_support_bridge: ['FINANCIAL_SURRENDER_DRIVER'], lower_cost_alternative: ['FINANCIAL_SURRENDER_DRIVER'],
  access_appropriate_care: ['VETERINARY_COST_SUPPORT'], veterinary_support_bridge: ['VETERINARY_COST_SUPPORT'], manage_treatment_burden: ['VETERINARY_COST_SUPPORT'],
  temporary_crisis_care_bridge: ['TEMPORARY_CARE_SUPPORT'], trusted_network_bridge: ['TEMPORARY_CARE_SUPPORT'], keep_together_short_term_support: ['TEMPORARY_CARE_SUPPORT'],
};

const whyForClaim: Record<EvidenceClaimCode, string> = {
  MULTI_FACTOR_SURRENDER: 'Several contributing factors are represented in this case.',
  HOUSING_SURRENDER_DRIVER: 'Housing is the primary barrier in this case.',
  LANDLORD_HOUSING_BARRIER: 'The current path addresses a landlord or property restriction.',
  PET_FRIENDLY_HOUSING_BARRIER: 'This path involves finding housing that can work for the owner and pet.',
  FINANCIAL_SURRENDER_DRIVER: 'A financial constraint is contributing to this case.',
  BEHAVIOR_SURRENDER_DRIVER: 'Behavior is contributing to the surrender pressure in this case.',
  BEHAVIOR_HELP_ACCESS: 'The case includes a cost or access barrier to behavior support.',
  TEMPORARY_CARE_SUPPORT: 'This path considers temporary care as a bridge, without assuming it is available.',
  VETERINARY_COST_SUPPORT: 'Veterinary or pet-health costs are represented in this case.',
};

export const selectEvidenceForPath = (
  caseId: string,
  path: PathEvaluation,
  facts: NormalizedHousingCase,
): PathEvidenceResponse => {
  const rankedClaims = new Map<EvidenceClaimCode, number>();
  const add = (code: EvidenceClaimCode, rank: number) => {
    rankedClaims.set(code, Math.min(rank, rankedClaims.get(code) ?? Number.POSITIVE_INFINITY));
  };

  for (const code of pathClaims[path.key] ?? []) add(code, 0);
  for (const step of path.steps) {
    if (step.interventionKey) for (const code of interventionClaims[step.interventionKey] ?? []) add(code, 0);
  }
  if (facts.primaryBarrier === 'housing') add('HOUSING_SURRENDER_DRIVER', 1);
  const contributors = new Set(facts.contributingBarriers ?? []);
  const hasBehavior = facts.primaryBarrier === 'behavior'
    || contributors.has('behavior') || facts.constraints.behaviorContributor === true;
  const hasCost = facts.primaryBarrier === 'cost' || contributors.has('cost') || Boolean(facts.costConstraint);
  if (hasBehavior) add('BEHAVIOR_SURRENDER_DRIVER', 1);
  if (hasCost) {
    add('FINANCIAL_SURRENDER_DRIVER', 1);
    if (hasBehavior) add('BEHAVIOR_HELP_ACCESS', 1);
  }
  if (facts.primaryBarrier === 'medical' || contributors.has('medical')) add('VETERINARY_COST_SUPPORT', 1);
  if (facts.primaryBarrier === 'temporary_crisis' || contributors.has('temporary_crisis')) add('TEMPORARY_CARE_SUPPORT', 1);
  const representedFactors = new Set(contributors);
  if (facts.primaryBarrier) representedFactors.add(facts.primaryBarrier);
  if (hasBehavior) representedFactors.add('behavior');
  if (hasCost) representedFactors.add('cost');
  const factorCount = representedFactors.size;
  if (factorCount > 1) add('MULTI_FACTOR_SURRENDER', 2);

  const cards = evidenceCatalog
    .filter(({ active, supportsClaims }) => active && supportsClaims.some((code) => rankedClaims.has(code)))
    .map((source) => {
      const matchingCodes = source.supportsClaims.filter((code) => rankedClaims.has(code));
      const matchRank = Math.min(...matchingCodes.map((code) => rankedClaims.get(code)!));
      return { source, matchingCodes, matchRank };
    })
    .sort((a, b) => a.matchRank - b.matchRank || a.source.priority - b.source.priority || a.source.id.localeCompare(b.source.id))
    .slice(0, 6)
    .map(({ source, matchingCodes }) => ({
      id: source.id,
      organization: source.organization,
      title: source.title,
      url: source.url,
      publicationYear: source.publicationYear,
      sourceType: source.sourceType,
      summary: source.summary,
      whyRelevant: whyForClaim[matchingCodes.sort((a, b) => rankedClaims.get(a)! - rankedClaims.get(b)!)[0]],
      claims: matchingCodes.map((code) => evidenceClaims[code]),
    }));

  const areas = [
    facts.primaryBarrier === 'housing' ? 'housing' : null,
    hasBehavior ? 'behavior' : null,
    hasCost ? 'cost' : null,
    facts.primaryBarrier === 'medical' || contributors.has('medical') ? 'veterinary care' : null,
    facts.primaryBarrier === 'temporary_crisis' || contributors.has('temporary_crisis') ? 'temporary crisis' : null,
    facts.primaryBarrier === 'time_capacity' || contributors.has('time_capacity') ? 'time and caregiving capacity' : null,
    facts.primaryBarrier === 'circumstances' || contributors.has('circumstances') ? 'family or life change' : null,
  ].filter((value): value is string => Boolean(value));

  return {
    caseId,
    pathKey: path.key,
    whyThisApproach: areas.length > 1
      ? `${areas.map((area) => area[0].toUpperCase() + area.slice(1)).join(', ')} are all affecting this case.`
      : `${(areas[0] ?? 'The represented barrier')[0].toUpperCase()}${(areas[0] ?? 'The represented barrier').slice(1)} is affecting this case.`,
    evidence: cards,
  };
};

export { interventionClaims };
