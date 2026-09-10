import type { RetentionPathDefinition } from './domain';

export const retentionPathCatalog: RetentionPathDefinition[] = [
  {
    key: 'remain_in_current_housing',
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
];
