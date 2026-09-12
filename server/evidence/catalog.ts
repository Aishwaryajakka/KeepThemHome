import { z } from 'zod';
import { evidenceClaimCodes, type EvidenceClaim, type EvidenceClaimCode, type EvidenceSource } from './domain.js';

export const evidenceClaims: Record<EvidenceClaimCode, EvidenceClaim> = {
  MULTI_FACTOR_SURRENDER: { code: 'MULTI_FACTOR_SURRENDER', label: 'Multiple contributing circumstances', summary: 'Pet surrender situations can involve several contributing circumstances rather than one isolated reason.' },
  HOUSING_SURRENDER_DRIVER: { code: 'HOUSING_SURRENDER_DRIVER', label: 'Housing-related surrender pressure', summary: 'Housing problems are documented contributors to pet relinquishment and rehoming.' },
  LANDLORD_HOUSING_BARRIER: { code: 'LANDLORD_HOUSING_BARRIER', label: 'Landlord and property barriers', summary: 'Rental policies, landlord restrictions, deposits, and pet rent can create barriers for renters with pets.' },
  PET_FRIENDLY_HOUSING_BARRIER: { code: 'PET_FRIENDLY_HOUSING_BARRIER', label: 'Pet-friendly housing access', summary: 'Finding housing that accepts pets can be a meaningful obstacle for pet-owning renters.' },
  FINANCIAL_SURRENDER_DRIVER: { code: 'FINANCIAL_SURRENDER_DRIVER', label: 'Financial pressure', summary: 'Financial constraints and affordability of pet-related support appear among reported relinquishment factors.' },
  BEHAVIOR_SURRENDER_DRIVER: { code: 'BEHAVIOR_SURRENDER_DRIVER', label: 'Behavior-related surrender pressure', summary: 'Non-aggressive behavior and personality concerns appear among reported reasons for owner surrender.' },
  BEHAVIOR_HELP_ACCESS: { code: 'BEHAVIOR_HELP_ACCESS', label: 'Access to behavior support', summary: 'Some owners report that affordable training or behavior help could have helped them keep their pet.' },
  TEMPORARY_CARE_SUPPORT: { code: 'TEMPORARY_CARE_SUPPORT', label: 'Temporary care support', summary: 'Some owners report that temporary pet care or boarding could have helped prevent rehoming.' },
  VETERINARY_COST_SUPPORT: { code: 'VETERINARY_COST_SUPPORT', label: 'Veterinary affordability', summary: 'Affordability of veterinary care can contribute to the pressure that leads owners to rehome pets.' },
};

const claimSchema = z.enum(evidenceClaimCodes);
export const evidenceSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  organization: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().refine((url) => url.startsWith('https://'), 'Evidence URLs must use HTTPS'),
  publicationYear: z.number().int().min(1900).max(2100).nullable(),
  sourceType: z.enum(['research', 'industry_guidance', 'industry_data']),
  summary: z.string().min(1).max(500),
  supportsClaims: z.array(claimSchema).min(1).refine((claims) => new Set(claims).size === claims.length),
  tags: z.array(z.string().min(1)),
  priority: z.number().int().min(0),
  active: z.boolean(),
});

const catalogInput = [
  {
    id: 'hass-building-support-system', organization: 'Human Animal Support Services',
    title: 'Building the Human-Animal Support System: Data That Helps Pets Stay Home',
    url: 'https://www.humananimalsupportservices.org/blog/building-the-human-animal-support-system-data-that-helps-pets-stay-home/',
    publicationYear: null, sourceType: 'industry_data',
    summary: 'HASS describes intake data showing that pet-support needs and surrender situations can involve multiple, overlapping circumstances.',
    supportsClaims: ['MULTI_FACTOR_SURRENDER'], tags: ['multi-factor', 'intake'], priority: 20, active: true,
  },
  {
    id: 'hass-intake-triage-findings', organization: 'Human Animal Support Services',
    title: 'Intake Triage Project: Key Findings and Resources',
    url: 'https://www.humananimalsupportservices.org/press-release/hass-announces-key-findings-and-new-resources-developed-through-the-intake-triage-project/',
    publicationYear: null, sourceType: 'industry_data',
    summary: 'HASS reports findings from intake-triage work intended to identify the circumstances behind requests for shelter intake and connect people with support.',
    supportsClaims: ['MULTI_FACTOR_SURRENDER'], tags: ['multi-factor', 'intake'], priority: 30, active: true,
  },
  {
    id: 'aspca-rehoming-study', organization: 'ASPCA',
    title: 'More Than 1 Million Households Forced to Give Up Their Beloved Pet Each Year',
    url: 'https://www.aspca.org/about-us/press-releases/more-1-million-households-forced-give-their-beloved-pet-each-year-aspca',
    publicationYear: 2015, sourceType: 'research',
    summary: 'ASPCA research describes housing and financial pressures and services owners reported could have helped, including affordable behavior help, veterinary care, and temporary care.',
    supportsClaims: ['HOUSING_SURRENDER_DRIVER', 'FINANCIAL_SURRENDER_DRIVER', 'BEHAVIOR_HELP_ACCESS', 'TEMPORARY_CARE_SUPPORT', 'VETERINARY_COST_SUPPORT'],
    tags: ['housing', 'cost', 'behavior', 'temporary-care', 'veterinary'], priority: 10, active: true,
  },
  {
    id: 'aspca-pet-friendly-housing', organization: 'ASPCA', title: 'Pet-Friendly Housing and Renters',
    url: 'https://www.aspca.org/improving-laws-animals/public-policy/housing/pet-friendly-housing-and-renters',
    publicationYear: null, sourceType: 'industry_guidance',
    summary: 'ASPCA housing guidance describes rental restrictions and costs that can make it difficult for families to remain housed with pets.',
    supportsClaims: ['HOUSING_SURRENDER_DRIVER', 'LANDLORD_HOUSING_BARRIER', 'PET_FRIENDLY_HOUSING_BARRIER'],
    tags: ['housing', 'renters'], priority: 5, active: true,
  },
  {
    id: 'best-friends-surrender-analysis', organization: 'Best Friends Animal Society',
    title: 'Owner Surrender Acquisition Source Analysis',
    url: 'https://bestfriends.org/network/studies-publications/owner-surrender-acquisition-source-analysis',
    publicationYear: null, sourceType: 'industry_data',
    summary: 'Best Friends analyzes reported owner-surrender reasons, including housing, financial, and non-aggressive behavior or personality concerns.',
    supportsClaims: ['HOUSING_SURRENDER_DRIVER', 'FINANCIAL_SURRENDER_DRIVER', 'BEHAVIOR_SURRENDER_DRIVER'],
    tags: ['housing', 'cost', 'behavior'], priority: 15, active: true,
  },
  {
    id: 'best-friends-surrender-reasons', organization: 'Best Friends Animal Society',
    title: 'Data Analysis Reveals Reasons for Owner Surrender',
    url: 'https://bestfriends.org/network/blog/data-analysis-reveals-reasons-owner-surrender',
    publicationYear: null, sourceType: 'industry_data',
    summary: 'Best Friends summarizes surrender data that includes housing, financial circumstances, and behavior among reported reasons.',
    supportsClaims: ['HOUSING_SURRENDER_DRIVER', 'FINANCIAL_SURRENDER_DRIVER', 'BEHAVIOR_SURRENDER_DRIVER'],
    tags: ['housing', 'cost', 'behavior'], priority: 25, active: true,
  },
] as const;

export const evidenceCatalog: EvidenceSource[] = catalogInput.map((source) => evidenceSourceSchema.parse(source));

if (new Set(evidenceCatalog.map(({ id }) => id)).size !== evidenceCatalog.length) {
  throw new Error('Evidence source IDs must be unique');
}
