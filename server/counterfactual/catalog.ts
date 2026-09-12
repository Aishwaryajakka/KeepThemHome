import type { NormalizedHousingCase } from '../retention-paths/domain.js';
import type { SupportedChange, SupportedChangeCode } from './domain.js';

type ChangeDefinition = {
  code: SupportedChangeCode;
  field: SupportedChange['field'];
  burden: number;
  label: string;
  relevantBlockers: string[];
  available: (facts: NormalizedHousingCase) => boolean;
  materialize: (facts: NormalizedHousingCase) => Pick<SupportedChange, 'from' | 'to'>;
};

export class UnsupportedCounterfactualError extends Error {}

const domainChange = (
  domain: string,
  code: SupportedChangeCode,
  field: Exclude<SupportedChange['field'], 'goal'>,
  burden: number,
  label: string,
): ChangeDefinition => ({
  code, field, burden, label, relevantBlockers: [field],
  available: (facts) => facts.primaryBarrier === domain && facts.constraints[field] !== true,
  materialize: (facts) => ({ from: facts.constraints[field] ?? 'unknown', to: true }),
});

export const supportedChangeCatalog: ChangeDefinition[] = [
  {
    code: 'ALLOW_STAY_OR_MOVE', field: 'goal', burden: 3,
    label: 'Become open to either staying or relocating with your pet.',
    relevantBlockers: ['goalSupportsStay', 'goalSupportsMove'],
    available: ({ goal }) => goal === 'Stay where I am' || goal === 'Move',
    materialize: ({ goal }) => ({ from: goal ?? 'unknown', to: 'Either could work' }),
  },
  {
    code: 'CONFIRM_HOUSING_RESOLUTION', field: 'housingResolutionPossible', burden: 2,
    label: 'Test this path assuming the housing complaint or restriction can be addressed.',
    relevantBlockers: ['housingResolutionPossible'],
    available: ({ constraints }) => constraints.housingResolutionPossible !== true,
    materialize: ({ constraints }) => ({ from: constraints.housingResolutionPossible ?? 'unknown', to: true }),
  },
  {
    code: 'CONFIRM_BEHAVIOR_MITIGATION', field: 'behaviorMitigationAvailable', burden: 2,
    label: 'Test this path assuming an appropriate behavior-mitigation option is available.',
    relevantBlockers: ['behaviorMitigationAvailable'],
    available: ({ constraints }) => constraints.behaviorMitigationAvailable !== true,
    materialize: ({ constraints }) => ({ from: constraints.behaviorMitigationAvailable ?? 'unknown', to: true }),
  },
  {
    code: 'CONFIRM_TEMPORARY_CARE', field: 'temporaryCareAvailable', burden: 3,
    label: 'Test this path assuming appropriate temporary care is available.',
    relevantBlockers: ['temporaryCareAvailable'],
    available: ({ constraints }) => constraints.temporaryCareAvailable !== true,
    materialize: ({ constraints }) => ({ from: constraints.temporaryCareAvailable ?? 'unknown', to: true }),
  },
  {
    code: 'CONFIRM_UNDERLYING_ISSUE_RESOLUTION', field: 'underlyingIssueResolutionPossible', burden: 2,
    label: 'Test this path assuming the underlying housing or behavior issue can be resolved.',
    relevantBlockers: ['underlyingIssueResolutionPossible'],
    available: ({ constraints }) => constraints.underlyingIssueResolutionPossible !== true,
    materialize: ({ constraints }) => ({ from: constraints.underlyingIssueResolutionPossible ?? 'unknown', to: true }),
  },
  {
    code: 'CONFIRM_PET_FRIENDLY_HOUSING', field: 'petFriendlyHousingAvailable', burden: 4,
    label: 'Test this path assuming suitable pet-friendly housing is available.',
    relevantBlockers: ['petFriendlyHousingAvailable'],
    available: ({ constraints }) => constraints.petFriendlyHousingAvailable !== true,
    materialize: ({ constraints }) => ({ from: constraints.petFriendlyHousingAvailable ?? 'unknown', to: true }),
  },
  {
    code: 'CONFIRM_MOVE_REQUIREMENTS', field: 'moveRequirementsMet', burden: 4,
    label: 'Test this path assuming the relevant move requirements can be met.',
    relevantBlockers: ['moveRequirementsMet'],
    available: ({ constraints }) => constraints.moveRequirementsMet !== true,
    materialize: ({ constraints }) => ({ from: constraints.moveRequirementsMet ?? 'unknown', to: true }),
  },
  domainChange('behavior', 'CONFIRM_BEHAVIOR_MANAGEMENT', 'primarySupportPossible', 2, 'Test this path assuming safe behavior management at home is workable.'),
  domainChange('behavior', 'CONFIRM_SAFE_SEPARATION', 'bridgeAvailable', 3, 'Test this path assuming an appropriate temporary separation option is available.'),
  domainChange('behavior', 'CONFIRM_BEHAVIOR_SUPPORT_ACCESS', 'alternativeAvailable', 3, 'Test this path assuming qualified behavior support is accessible.'),
  domainChange('cost', 'CONFIRM_COST_REDUCTION', 'primarySupportPossible', 2, 'Test this path assuming the immediate expense can be reduced.'),
  domainChange('cost', 'CONFIRM_FINANCIAL_BRIDGE', 'bridgeAvailable', 3, 'Test this path assuming a temporary financial bridge is available.'),
  domainChange('cost', 'CONFIRM_AFFORDABLE_ALTERNATIVE', 'alternativeAvailable', 2, 'Test this path assuming an appropriate lower-cost alternative exists.'),
  domainChange('medical', 'CONFIRM_CARE_ACCESS', 'primarySupportPossible', 2, 'Test this path assuming appropriate veterinary care is accessible.'),
  domainChange('medical', 'CONFIRM_VET_COST_SUPPORT', 'bridgeAvailable', 3, 'Test this path assuming short-term veterinary cost support is available.'),
  domainChange('medical', 'CONFIRM_TRANSPORT_SUPPORT', 'alternativeAvailable', 2, 'Test this path assuming treatment-burden support is available.'),
  domainChange('temporary_crisis', 'CONFIRM_CRISIS_TEMPORARY_CARE', 'primarySupportPossible', 2, 'Test this path assuming appropriate temporary care is available.'),
  domainChange('temporary_crisis', 'CONFIRM_TRUSTED_CAREGIVER', 'bridgeAvailable', 2, 'Test this path assuming a trusted caregiver is available.'),
  domainChange('temporary_crisis', 'CONFIRM_REUNIFICATION_PLAN', 'alternativeAvailable', 2, 'Test this path assuming short-term support can preserve reunification.'),
  domainChange('time_capacity', 'CONFIRM_CARE_SUPPORT', 'primarySupportPossible', 2, 'Test this path assuming the daily care burden can be reduced.'),
  domainChange('time_capacity', 'CONFIRM_SHARED_CARE', 'bridgeAvailable', 2, 'Test this path assuming shared caregiving is available.'),
  domainChange('time_capacity', 'CONFIRM_ROUTINE_CHANGE', 'alternativeAvailable', 2, 'Test this path assuming a workable routine change is possible.'),
  domainChange('circumstances', 'CONFIRM_HOUSEHOLD_ADAPTATION', 'primarySupportPossible', 2, 'Test this path assuming household adaptation is workable.'),
  domainChange('circumstances', 'CONFIRM_TEMPORARY_BRIDGE', 'bridgeAvailable', 3, 'Test this path assuming a temporary transition bridge is available.'),
  domainChange('circumstances', 'CONFIRM_MOVE_WITH_PET', 'alternativeAvailable', 4, 'Test this path assuming a pet-inclusive living arrangement is possible.'),
  {
    code: 'CONFIRM_CONTRIBUTING_COST_REDUCTION', field: 'costReductionPossible', burden: 2,
    label: 'Test this path assuming an affordable route reduces the contributing cost pressure.',
    relevantBlockers: ['costReductionPossible'],
    available: ({ contributingBarriers, constraints }) => Boolean(contributingBarriers?.includes('cost')) && constraints.costReductionPossible !== true,
    materialize: ({ constraints }) => ({ from: constraints.costReductionPossible ?? 'unknown', to: true }),
  },
  {
    code: 'CONFIRM_CONTRIBUTING_CARE_ACCESS', field: 'careAccessPossible', burden: 2,
    label: 'Test this path assuming appropriate veterinary care is accessible.', relevantBlockers: ['careAccessPossible'],
    available: ({ contributingBarriers, constraints }) => Boolean(contributingBarriers?.includes('medical')) && constraints.careAccessPossible !== true,
    materialize: ({ constraints }) => ({ from: constraints.careAccessPossible ?? 'unknown', to: true }),
  },
  {
    code: 'CONFIRM_CONTRIBUTING_CARE_SUPPORT', field: 'careSupportAvailable', burden: 2,
    label: 'Test this path assuming caregiving support is available.', relevantBlockers: ['careSupportAvailable'],
    available: ({ contributingBarriers, constraints }) => Boolean(contributingBarriers?.includes('time_capacity')) && constraints.careSupportAvailable !== true,
    materialize: ({ constraints }) => ({ from: constraints.careSupportAvailable ?? 'unknown', to: true }),
  },
  {
    code: 'CONFIRM_CONTRIBUTING_HOUSEHOLD_ADAPTATION', field: 'householdAdaptationPossible', burden: 2,
    label: 'Test this path assuming a workable household adaptation is possible.', relevantBlockers: ['householdAdaptationPossible'],
    available: ({ contributingBarriers, constraints }) => Boolean(contributingBarriers?.includes('circumstances')) && constraints.householdAdaptationPossible !== true,
    materialize: ({ constraints }) => ({ from: constraints.householdAdaptationPossible ?? 'unknown', to: true }),
  },
];

export const materializeSupportedChanges = (
  facts: NormalizedHousingCase,
  codes: SupportedChangeCode[],
): SupportedChange[] => codes.map((code) => {
  const definition = supportedChangeCatalog.find((item) => item.code === code);
  if (!definition || !definition.available(facts)) throw new UnsupportedCounterfactualError(`Unsupported change for current state: ${code}`);
  return { ...definition.materialize(facts), code, field: definition.field, label: definition.label, burden: definition.burden, source: 'supported_catalog' };
});

export const relevantSupportedChanges = (
  facts: NormalizedHousingCase,
  blockers: { field: string }[],
): SupportedChange[] => supportedChangeCatalog
  .filter((definition) => definition.available(facts)
    && blockers.some((blocker) => definition.relevantBlockers.includes(blocker.field)))
  .map((definition) => ({
    ...definition.materialize(facts),
    code: definition.code,
    field: definition.field,
    label: definition.label,
    burden: definition.burden,
    source: 'supported_catalog',
  }));
