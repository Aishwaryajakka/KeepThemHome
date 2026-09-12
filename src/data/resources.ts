import type { BarrierType, HousingGoal, HousingSituation, HousingTiming } from '@/types/assessment';

export type ResourceCategory =
  | 'housing-search'
  | 'financial-support'
  | 'temporary-care'
  | 'general-support';

export interface SupportResource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  geographicScope: string;
  eligibilitySummary: string;
  costSummary: string;
  url: string;
  sourceName: string;
  verifiedAt: string;
  tags: string[];
}

const VERIFIED_AT = '2026-09-10';

export const supportResources: SupportResource[] = [
  {
    id: 'best-friends-rentals-guide',
    name: 'Pet-Friendly Rentals Guide',
    category: 'housing-search',
    description: 'Practical guidance for finding rentals, presenting your pet to a landlord, and reviewing pet terms in a lease.',
    geographicScope: 'United States; general guidance',
    eligibilitySummary: 'Open-access information for renters with pets.',
    costSummary: 'Free online guide.',
    url: 'https://bestfriends.org/pet-care-resources/pet-friendly-rentals-guide-finding-housing',
    sourceName: 'Best Friends Animal Society',
    verifiedAt: VERIFIED_AT,
    tags: ['rentals', 'moving', 'landlord', 'breed-restriction'],
  },
  {
    id: 'humane-world-renters',
    name: 'Tenant Information for Renters With Pets',
    category: 'housing-search',
    description: 'Rental-search, lease, landlord-conversation, and housing-conflict guidance for people living with pets.',
    geographicScope: 'United States; laws and protections vary locally',
    eligibilitySummary: 'Open-access information; legal guidance should be confirmed locally.',
    costSummary: 'Free online guide.',
    url: 'https://www.humaneworld.org/en/resources/tenant-information-renters-pets',
    sourceName: 'Humane World for Animals',
    verifiedAt: VERIFIED_AT,
    tags: ['rentals', 'lease', 'landlord', 'pet-fees'],
  },
  {
    id: 'aspca-housing-renters',
    name: 'Pet-Friendly Housing and Renters',
    category: 'housing-search',
    description: 'Background and practical considerations for renters facing pet policies, deposits, and breed or weight restrictions.',
    geographicScope: 'United States; general guidance',
    eligibilitySummary: 'Open-access information for renters and housing advocates.',
    costSummary: 'Free online resource.',
    url: 'https://www.aspca.org/improving-laws-animals/public-policy/housing/pet-friendly-housing-and-renters',
    sourceName: 'ASPCA',
    verifiedAt: VERIFIED_AT,
    tags: ['rentals', 'pet-deposit', 'breed-restriction', 'policy'],
  },
  {
    id: 'united-way-211-housing',
    name: '211 Housing Expense Support',
    category: 'financial-support',
    description: 'Connects people with local options for rent, mortgage, utility, shelter, and other housing-related assistance.',
    geographicScope: 'United States; services vary by local 211',
    eligibilitySummary: 'Local programs set their own eligibility requirements.',
    costSummary: '211 information and referral is free; referred program costs vary.',
    url: 'https://www.211.org/get-help/housing-expenses',
    sourceName: 'United Way 211',
    verifiedAt: VERIFIED_AT,
    tags: ['rent', 'housing-expenses', 'utilities', 'financial-help'],
  },
  {
    id: 'arizona-humane-bridge-gap',
    name: 'Bridge the Gap Program',
    category: 'financial-support',
    description: 'Supports eligible pet owners in crisis with pet-care expenses, including some rental pet-deposit needs.',
    geographicScope: 'Maricopa County, Arizona',
    eligibilitySummary: 'Application is reviewed by Arizona Humane Society; assistance and availability are not guaranteed.',
    costSummary: 'Financial contribution varies by approved case and may not cover the full expense.',
    url: 'https://www.azhumane.org/resources-to-keep-your-pet/',
    sourceName: 'Arizona Humane Society',
    verifiedAt: VERIFIED_AT,
    tags: ['pet-deposit', 'financial-hardship', 'short-term-boarding', 'arizona'],
  },
  {
    id: 'pet-help-finder',
    name: 'Pet Help Finder',
    category: 'temporary-care',
    description: 'Searches for nearby financially friendly pet services, including boarding, temporary pet housing, food, and veterinary care.',
    geographicScope: 'United States; searchable local directory',
    eligibilitySummary: 'Each listed provider sets availability and eligibility.',
    costSummary: 'Includes free and lower-cost providers; costs vary by listing.',
    url: 'https://www.pethelpfinder.org/',
    sourceName: 'Pet Help Finder / Open Door Veterinary Collective',
    verifiedAt: VERIFIED_AT,
    tags: ['temporary-housing', 'boarding', 'pet-food', 'veterinary-care'],
  },
  {
    id: 'safe-havens-for-pets',
    name: 'Safe Havens for Pets',
    category: 'temporary-care',
    description: 'Searchable directory of sheltering services or referrals for pets of people experiencing domestic violence or homelessness.',
    geographicScope: 'United States; searchable directory',
    eligibilitySummary: 'For people experiencing domestic violence or homelessness; individual programs determine availability.',
    costSummary: 'Directory access is free; program costs, if any, vary.',
    url: 'https://www.safehavensforpets.org/',
    sourceName: 'Animal Welfare Institute',
    verifiedAt: VERIFIED_AT,
    tags: ['temporary-housing', 'domestic-violence', 'homelessness', 'safety'],
  },
  {
    id: 'pets-findhelp',
    name: 'Findhelp Pet Support Directory',
    category: 'general-support',
    description: 'ZIP-code search for free and lower-cost pet food, veterinary care, behavior support, and other community services.',
    geographicScope: 'United States; searchable local directory',
    eligibilitySummary: 'Each listed program sets its own eligibility and service area.',
    costSummary: 'Focuses on free and lower-cost services; costs vary by provider.',
    url: 'https://pets.findhelp.com/',
    sourceName: 'Human Animal Support Services / Findhelp',
    verifiedAt: VERIFIED_AT,
    tags: ['directory', 'pet-food', 'veterinary-care', 'community-support'],
  },
];

const prioritiesForSituation = (situation: HousingSituation): ResourceCategory[] => {
  if (situation === 'I can’t afford the pet deposit or fee') return ['financial-support', 'general-support', 'housing-search'];
  if (situation === 'I’m moving and struggling to find pet-friendly housing') return ['housing-search', 'general-support', 'temporary-care'];
  if (situation === 'I’m temporarily between homes') return ['temporary-care', 'general-support', 'financial-support'];
  return ['housing-search', 'general-support', 'financial-support'];
};

export const matchHousingResources = (
  situation: HousingSituation,
  urgency: HousingTiming,
  goal: HousingGoal,
  limit = 3,
): SupportResource[] => {
  const categoryPriority = prioritiesForSituation(situation);
  return supportResources
    .map((resource, index) => {
      const categoryIndex = categoryPriority.indexOf(resource.category);
      let score = categoryIndex === -1 ? 0 : 100 - (categoryIndex * 20);
      if (goal === 'Move' && resource.category === 'housing-search') score += 25;
      if (goal === 'Stay where I am' && ['financial-support', 'general-support'].includes(resource.category)) score += 15;
      if (goal === 'Either could work' && resource.category === 'general-support') score += 10;
      if ((urgency === 'Today or within 48 hours' || urgency === 'This week')
        && resource.category === 'temporary-care') score += 10;
      return { resource, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ resource }) => resource);
};

export const matchResources = (barrier: BarrierType, situation: HousingSituation, urgency: HousingTiming, goal: HousingGoal, limit = 3): SupportResource[] => {
  if (barrier === 'housing') return matchHousingResources(situation, urgency, goal, limit);
  const preferred: Record<Exclude<BarrierType, 'housing'>, ResourceCategory[]> = {
    behavior: ['general-support', 'temporary-care', 'financial-support'], cost: ['financial-support', 'general-support', 'temporary-care'],
    medical: ['general-support', 'temporary-care', 'financial-support'], temporary_crisis: ['temporary-care', 'general-support', 'financial-support'],
    time_capacity: ['general-support', 'temporary-care', 'financial-support'], circumstances: ['temporary-care', 'general-support', 'housing-search'],
  };
  return supportResources.map((resource, index) => ({ resource, index, score: 100 - Math.max(0, preferred[barrier].indexOf(resource.category)) * 20 }))
    .sort((a, b) => b.score - a.score || a.index - b.index).slice(0, limit).map(({ resource }) => resource);
};

export const responsibleRehomingResources = supportResources.filter(({ id }) =>
  ['pet-help-finder', 'safe-havens-for-pets', 'pets-findhelp'].includes(id));
