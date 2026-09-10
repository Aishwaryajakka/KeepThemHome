export const interventionCatalog = [
  {
    key: 'clarify_housing_restriction',
    title: 'Understand the exact housing restriction',
    description: 'Confirm whether the barrier comes from the lease, property policy, pet fees, breed restrictions, or another requirement.',
    supportedBarriers: ['housing'],
  },
  {
    key: 'address_housing_cost',
    title: 'Address the immediate housing cost',
    description: 'Look for assistance that may help with a pet deposit, fee, rent, utilities, or another housing expense.',
    supportedBarriers: ['housing'],
  },
  {
    key: 'search_pet_friendly_housing',
    title: 'Search for pet-friendly housing',
    description: 'Use verified guidance and directories to focus a housing search on rentals that can work for you and your pet.',
    supportedBarriers: ['housing'],
  },
  {
    key: 'seek_temporary_care_bridge',
    title: 'Consider a temporary care bridge',
    description: 'Explore whether short-term care could create time to resolve the housing situation without immediately pursuing permanent surrender.',
    supportedBarriers: ['housing'],
  },
  {
    key: 'explore_general_pet_support',
    title: 'Explore broader pet support',
    description: 'Check verified community directories for other practical support that may reduce pressure on the household.',
    supportedBarriers: ['housing'],
  },
] as const;

export type InterventionKey = typeof interventionCatalog[number]['key'];

export const interventionResourceSlugs: Record<InterventionKey, string[]> = {
  clarify_housing_restriction: [
    'humane-world-renters',
    'aspca-housing-renters',
    'best-friends-rentals-guide',
  ],
  address_housing_cost: [
    'united-way-211-housing',
    'arizona-humane-bridge-gap',
    'pets-findhelp',
  ],
  search_pet_friendly_housing: [
    'best-friends-rentals-guide',
    'humane-world-renters',
    'aspca-housing-renters',
  ],
  seek_temporary_care_bridge: [
    'pet-help-finder',
    'safe-havens-for-pets',
    'arizona-humane-bridge-gap',
  ],
  explore_general_pet_support: [
    'pets-findhelp',
    'pet-help-finder',
    'united-way-211-housing',
  ],
};
