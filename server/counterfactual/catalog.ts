import type { NormalizedHousingCase } from '../retention-paths/domain';
import type { SupportedChange, SupportedChangeCode } from './domain';

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
    materialize: ({ constraints }) => ({ from: constraints.housingResolutionPossible, to: true }),
  },
  {
    code: 'CONFIRM_BEHAVIOR_MITIGATION', field: 'behaviorMitigationAvailable', burden: 2,
    label: 'Test this path assuming an appropriate behavior-mitigation option is available.',
    relevantBlockers: ['behaviorMitigationAvailable'],
    available: ({ constraints }) => constraints.behaviorMitigationAvailable !== true,
    materialize: ({ constraints }) => ({ from: constraints.behaviorMitigationAvailable, to: true }),
  },
  {
    code: 'CONFIRM_TEMPORARY_CARE', field: 'temporaryCareAvailable', burden: 3,
    label: 'Test this path assuming appropriate temporary care is available.',
    relevantBlockers: ['temporaryCareAvailable'],
    available: ({ constraints }) => constraints.temporaryCareAvailable !== true,
    materialize: ({ constraints }) => ({ from: constraints.temporaryCareAvailable, to: true }),
  },
  {
    code: 'CONFIRM_UNDERLYING_ISSUE_RESOLUTION', field: 'underlyingIssueResolutionPossible', burden: 2,
    label: 'Test this path assuming the underlying housing or behavior issue can be resolved.',
    relevantBlockers: ['underlyingIssueResolutionPossible'],
    available: ({ constraints }) => constraints.underlyingIssueResolutionPossible !== true,
    materialize: ({ constraints }) => ({ from: constraints.underlyingIssueResolutionPossible, to: true }),
  },
  {
    code: 'CONFIRM_PET_FRIENDLY_HOUSING', field: 'petFriendlyHousingAvailable', burden: 4,
    label: 'Test this path assuming suitable pet-friendly housing is available.',
    relevantBlockers: ['petFriendlyHousingAvailable'],
    available: ({ constraints }) => constraints.petFriendlyHousingAvailable !== true,
    materialize: ({ constraints }) => ({ from: constraints.petFriendlyHousingAvailable, to: true }),
  },
  {
    code: 'CONFIRM_MOVE_REQUIREMENTS', field: 'moveRequirementsMet', burden: 4,
    label: 'Test this path assuming the relevant move requirements can be met.',
    relevantBlockers: ['moveRequirementsMet'],
    available: ({ constraints }) => constraints.moveRequirementsMet !== true,
    materialize: ({ constraints }) => ({ from: constraints.moveRequirementsMet, to: true }),
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
