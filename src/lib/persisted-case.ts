import { initialAssessmentCase, isAssessmentCaseState, type AssessmentCaseState } from './assessment-session';
import type { SavedCaseDetail } from './case-api';
import { BEHAVIOR_CONCERN_OPTIONS, type BarrierType } from '@/types/assessment';

const barrierOrder: BarrierType[] = ['housing', 'behavior', 'cost', 'medical', 'temporary_crisis', 'time_capacity', 'circumstances'];

export const restorePersistedCase = (saved: SavedCaseDetail): AssessmentCaseState | undefined => {
  const value = (type: string) => saved.factors.find((factor) => factor.factorType === type)?.factorValue ?? '';
  const persistedContributors = new Set(saved.factors
    .filter(({ factorType, factorValue }) => (factorType.startsWith('contributing_') || factorType === 'behavior_contributor') && factorValue)
    .map(({ factorValue }) => factorValue!));
  const contributingBarriers = barrierOrder.filter((barrier) => persistedContributors.has(barrier));
  const rootCause = saved.case.primaryBarrier ?? value('primary_barrier');
  const persistedConcerns = new Set(saved.factors
    .filter(({ factorType, factorValue }) => factorType.startsWith('behavior_concern_') && factorValue)
    .map(({ factorValue }) => factorValue!));
  const behaviorConcerns = BEHAVIOR_CONCERN_OPTIONS.filter((concern) => persistedConcerns.has(concern));
  const latestOutcome = saved.outcomes[0]?.status;
  const candidate: unknown = {
    ...initialAssessmentCase,
    backendCaseId: saved.case.id,
    petName: saved.pet?.name ?? saved.case.petName,
    petType: saved.pet?.type ?? saved.case.petType,
    rootCause,
    selectedFactors: Array.from(new Set([rootCause, ...contributingBarriers].filter(Boolean))),
    contributingBarriers: Array.from(new Set(contributingBarriers.filter((barrier) => barrier !== rootCause))),
    costConstraint: value('cost_constraint'),
    housing: {
      situation: value('housing_situation'),
      urgency: saved.case.urgency ?? value('urgency'),
      goal: saved.case.goal ?? value('goal'),
    },
    behavior: {
      concern: behaviorConcerns[0] ?? value('behavior_concern'),
      concerns: behaviorConcerns.length ? behaviorConcerns : value('behavior_concern') ? [value('behavior_concern')] : [],
      seriousness: value('behavior_seriousness'), alreadyTried: value('behavior_already_tried'),
      helpBarrier: value('behavior_help_barrier'),
    },
    domain: {
      primarySupportPossible: value('primary_support_possible'),
      bridgeAvailable: value('bridge_available'),
      alternativeAvailable: value('alternative_available'),
      urgency: saved.case.urgency ?? value('urgency'),
    },
    outcome: latestOutcome === 'STILL_TRYING' ? 'stillTrying' : latestOutcome === 'REHOMING_SUPPORT_NEEDED' ? 'rehomingHelp' : latestOutcome === 'KEEPING_PET' ? 'keeping' : '',
    currentScreen: rootCause ? 'housing-plan' : 'root-cause',
  };
  return isAssessmentCaseState(candidate) ? candidate : undefined;
};
