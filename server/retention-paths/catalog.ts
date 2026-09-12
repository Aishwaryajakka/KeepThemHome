import type { RetentionPathDefinition } from './domain.js';

const domainPath = (
  domain: string,
  key: string,
  title: string,
  objective: string,
  fact: 'primarySupportPossible' | 'bridgeAvailable' | 'alternativeAvailable',
  requiredCondition: string,
  label: string,
  disruption: number,
  interventionKey?: string,
): RetentionPathDefinition => ({
  domain, key, title, objective, disruption, goalAlignment: 'either',
  steps: [{ key: `${key}_first_step`, title: objective, description: 'Confirm this support is appropriate and actually available before relying on it.', interventionKey }],
  requirements: [{ key: `${key}_requirement`, fact, requiredValue: true, requiredCondition, label }],
});

export const retentionPathCatalog: RetentionPathDefinition[] = [
  {
    key: 'remain_in_current_housing',
    domain: 'housing',
    title: 'Stay in current housing with your pet',
    objective: 'Address the housing complaint and its contributing cause while attempting to remain housed together.',
    disruption: 1,
    goalAlignment: 'stay',
    steps: [
      {
        key: 'clarify_complaint',
        title: 'Clarify the housing complaint or restriction',
        description: 'Confirm the exact policy, complaint, or requirement that is putting the tenancy at risk.',
        interventionKey: 'clarify_housing_restriction',
      },
      {
        key: 'address_behavior_effects',
        title: 'Address the barking or other contributing issue',
        description: 'Identify a safe, practical mitigation attempt for the contributing behavior or its effects.',
      },
      {
        key: 'document_mitigation',
        title: 'Document the mitigation attempt',
        description: 'Keep a clear record of the steps taken while attempting to remain housed with the pet.',
      },
    ],
    requirements: [
      {
        key: 'stay_goal_compatible', fact: 'goalSupportsStay', requiredValue: true,
        label: 'The stated goal must allow remaining in the current home.',
        requiredCondition: 'Goal allows staying in the current housing',
      },
      {
        key: 'housing_issue_resolvable', fact: 'housingResolutionPossible', requiredValue: true,
        label: 'Whether the housing complaint can be resolved is not yet established.',
        requiredCondition: 'Housing complaint or restriction can be addressed',
      },
      {
        key: 'behavior_support_available', fact: 'behaviorMitigationAvailable', requiredValue: true,
        appliesWhen: { fact: 'behaviorContributor', value: true },
        label: 'A contributing behavior issue needs an available mitigation approach.',
        requiredCondition: 'Behavior mitigation is available',
      },
    ],
  },
  {
    key: 'temporary_care_bridge',
    domain: 'housing',
    title: 'Use a temporary-care bridge',
    objective: 'Create temporary separation while the underlying housing or behavior issue is addressed, then reunite.',
    disruption: 2,
    goalAlignment: 'either',
    steps: [
      {
        key: 'find_temporary_care',
        title: 'Explore temporary placement or support',
        description: 'Check whether an appropriate short-term care option is actually available.',
        interventionKey: 'seek_temporary_care_bridge',
      },
      {
        key: 'resolve_underlying_issue',
        title: 'Work on the underlying housing or behavior issue',
        description: 'Use the bridge period to address the known cause of the housing crisis.',
      },
      {
        key: 'reunite',
        title: 'Reunite owner and pet',
        description: 'Return the pet only after the underlying situation supports a safe reunion.',
      },
    ],
    requirements: [
      {
        key: 'temporary_care_available', fact: 'temporaryCareAvailable', requiredValue: true,
        label: 'Temporary-care availability has not been confirmed.',
        requiredCondition: 'Appropriate temporary care is available',
      },
      {
        key: 'underlying_issue_resolvable', fact: 'underlyingIssueResolutionPossible', requiredValue: true,
        label: 'Resolution of the underlying issue has not been confirmed.',
        requiredCondition: 'Underlying housing or behavior issue can be resolved',
      },
    ],
  },
  {
    key: 'move_with_pet',
    domain: 'housing',
    title: 'Move with your pet',
    objective: 'Secure suitable pet-friendly housing, meet the move requirements, and relocate together.',
    disruption: 3,
    goalAlignment: 'move',
    steps: [
      {
        key: 'find_pet_friendly_housing',
        title: 'Search for pet-friendly housing',
        description: 'Explore verified housing-search guidance without assuming a suitable unit is available.',
        interventionKey: 'search_pet_friendly_housing',
      },
      {
        key: 'meet_move_requirements',
        title: 'Confirm the move requirements can be met',
        description: 'Confirm the relevant timing, financial, and property requirements using known information.',
      },
      {
        key: 'relocate_together',
        title: 'Relocate with your pet',
        description: 'Move together only after suitable housing and the required arrangements are confirmed.',
      },
    ],
    requirements: [
      {
        key: 'move_goal_compatible', fact: 'goalSupportsMove', requiredValue: true,
        label: 'The stated goal does not currently allow relocation.',
        requiredCondition: 'Goal allows moving with the pet',
      },
      {
        key: 'pet_friendly_housing_available', fact: 'petFriendlyHousingAvailable', requiredValue: true,
        label: 'Suitable pet-friendly housing has not been confirmed.',
        requiredCondition: 'Suitable pet-friendly housing is available',
      },
      {
        key: 'move_requirements_met', fact: 'moveRequirementsMet', requiredValue: true,
        label: 'The requirements for a move have not been confirmed.',
        requiredCondition: 'Relevant move requirements can be met',
      },
    ],
  },
  domainPath('behavior', 'manage_behavior_at_home', 'Keep your pet and manage behavior at home', 'Build a safe management and routine plan at home.', 'primarySupportPossible', 'Safe behavior management is workable at home', 'Whether safe management at home is workable still needs confirmation.', 1, 'behavior_management_plan'),
  domainPath('behavior', 'behavior_support_bridge', 'Use a temporary separation or support bridge', 'Create safe short-term separation while support is arranged.', 'bridgeAvailable', 'Appropriate temporary separation or support is available', 'A safe temporary separation or support option has not been confirmed.', 2, 'behavior_separation_support'),
  domainPath('behavior', 'specialist_supported_retention', 'Use specialist-supported retention', 'Work with qualified behavior or veterinary behavior support.', 'alternativeAvailable', 'Qualified behavior support is accessible', 'Access to qualified behavior support has not been confirmed.', 2, 'qualified_behavior_support'),

  domainPath('cost', 'reduce_immediate_expense', 'Keep your pet and reduce the immediate expense', 'Reduce or restructure the expense creating immediate pressure.', 'primarySupportPossible', 'The immediate expense can be reduced', 'A workable cost reduction has not been confirmed.', 1, 'lower_cost_service'),
  domainPath('cost', 'financial_support_bridge', 'Use a temporary financial-support bridge', 'Explore time-limited support for the immediate gap.', 'bridgeAvailable', 'A financial-support bridge is available', 'Financial-support availability has not been confirmed.', 2, 'financial_assistance_search'),
  domainPath('cost', 'lower_cost_alternative', 'Use a lower-cost service or care alternative', 'Substitute an appropriate lower-cost option where possible.', 'alternativeAvailable', 'An appropriate lower-cost alternative exists', 'A suitable lower-cost alternative has not been confirmed.', 2, 'lower_cost_service'),

  domainPath('medical', 'access_appropriate_care', 'Keep your pet and access appropriate care', 'Connect with appropriate veterinary care without offering a diagnosis.', 'primarySupportPossible', 'Appropriate care access is available', 'Access to appropriate veterinary care has not been confirmed.', 1, 'lower_cost_veterinary_search'),
  domainPath('medical', 'veterinary_support_bridge', 'Use a short-term care or financial bridge', 'Create time to access appropriate professional care.', 'bridgeAvailable', 'A short-term veterinary support bridge is available', 'A veterinary care or financial bridge has not been confirmed.', 2, 'veterinary_support_navigation'),
  domainPath('medical', 'manage_treatment_burden', 'Manage treatment burden with support', 'Add transport, routine, or temporary caregiving support.', 'alternativeAvailable', 'Treatment-support help is available', 'Support for the treatment burden has not been confirmed.', 2, 'veterinary_transport_support'),

  domainPath('temporary_crisis', 'temporary_crisis_care_bridge', 'Use a temporary-care bridge', 'Arrange appropriate short-term care with reunification in view.', 'primarySupportPossible', 'Appropriate temporary care is available', 'Temporary-care availability has not been confirmed.', 1, 'temporary_caregiver'),
  domainPath('temporary_crisis', 'trusted_network_bridge', 'Use a trusted-person bridge', 'Ask whether a trusted person can help during the disruption.', 'bridgeAvailable', 'A trusted caregiver is available', 'A trusted caregiver has not been confirmed.', 1, 'trusted_network_support'),
  domainPath('temporary_crisis', 'keep_together_short_term_support', 'Stay together with short-term support', 'Reduce the immediate disruption while owner and pet remain together.', 'alternativeAvailable', 'Short-term support can keep owner and pet together', 'Suitable short-term support has not been confirmed.', 2, 'emergency_pet_support'),

  domainPath('time_capacity', 'reduce_daily_care_burden', 'Reduce the daily care burden', 'Change the workload while protecting essential pet care.', 'primarySupportPossible', 'The daily care burden can be reduced', 'A workable way to reduce the care burden has not been confirmed.', 1, 'routine_modification'),
  domainPath('time_capacity', 'shared_care_support', 'Add temporary or shared support', 'Share specific care tasks with an appropriate helper.', 'bridgeAvailable', 'Shared or temporary care support is available', 'Shared caregiving support has not been confirmed.', 1, 'shared_caregiving'),
  domainPath('time_capacity', 'change_care_routine', 'Change the care routine or structure', 'Restructure routines around the pet’s essential needs.', 'alternativeAvailable', 'A workable routine change is possible', 'A workable routine change has not been confirmed.', 2, 'routine_modification'),

  domainPath('circumstances', 'household_adaptation', 'Keep your pet through household adaptation', 'Adapt the household around the life transition.', 'primarySupportPossible', 'Household adaptation is workable', 'A workable household adaptation has not been confirmed.', 1, 'household_transition_planning'),
  domainPath('circumstances', 'family_transition_bridge', 'Use a temporary bridge during the transition', 'Create temporary stability while the household changes.', 'bridgeAvailable', 'A temporary transition bridge is available', 'A temporary bridge has not been confirmed.', 2, 'temporary_caregiver'),
  domainPath('circumstances', 'restructure_with_pet', 'Restructure living arrangements with your pet', 'Plan a living arrangement that continues to include the pet.', 'alternativeAvailable', 'A pet-inclusive living arrangement is possible', 'A pet-inclusive living arrangement has not been confirmed.', 3, 'housing_transition_support'),
];
