import type { IntakeResult } from './intake-api';
import type { AssessmentCaseState } from './assessment-session';
import type { AssessmentScreen, RootCauseType } from '@/types/assessment';

const nextScreenFor = (state: AssessmentCaseState, result: IntakeResult): AssessmentScreen => {
  const firstStillMissing = result.followUps.find((followUp) => {
    if (followUp.field === 'pet') return !state.petName || !state.petType;
    if (followUp.field === 'primaryBarrier') return !state.rootCause;
    if (followUp.field === 'housingSituation') return !state.housing.situation;
    if (followUp.field === 'urgency') return !state.housing.urgency;
    if (followUp.field === 'goal') return !state.housing.goal;
    if (followUp.field === 'behaviorConcern') return !state.behavior.concern;
    if (followUp.field === 'behaviorSeriousness') return !state.behavior.seriousness;
    if (followUp.field === 'behaviorAlreadyTried') return !state.behavior.alreadyTried;
    if (followUp.field === 'behaviorHelpBarrier') return !state.behavior.helpBarrier;
    return true;
  });
  if (firstStillMissing) return firstStillMissing.screen;
  const extraction = result.extraction;
  if (extraction.primaryBarrier === 'housing') return 'housing-complete';
  if (extraction.primaryBarrier === 'behavior') {
    return extraction.behaviorSeriousness === 'There’s an immediate safety concern'
      ? 'behavior-2'
      : 'behavior-complete';
  }
  return 'root-cause';
};

export const mergeIntakeResult = (
  current: AssessmentCaseState,
  result: IntakeResult,
): AssessmentCaseState => {
  const extraction = result.extraction;
  const contributingBarriers = Array.from(new Set([
    ...(current.contributingBarriers ?? []),
    ...extraction.contributingBarriers,
  ])) as Exclude<RootCauseType, ''>[];

  const merged = {
    ...current,
    petName: extraction.petName ?? current.petName,
    petType: extraction.petType ?? current.petType,
    rootCause: extraction.primaryBarrier ?? current.rootCause,
    contributingBarriers,
    costConstraint: extraction.costConstraint ?? current.costConstraint,
    housing: {
      situation: extraction.housingSituation ?? current.housing.situation,
      urgency: extraction.urgency ?? current.housing.urgency,
      goal: extraction.goal ?? current.housing.goal,
    },
    behavior: {
      concern: extraction.behaviorConcern ?? current.behavior.concern,
      seriousness: extraction.behaviorSeriousness ?? current.behavior.seriousness,
      alreadyTried: extraction.behaviorAlreadyTried ?? current.behavior.alreadyTried,
      helpBarrier: extraction.behaviorHelpBarrier ?? current.behavior.helpBarrier,
    },
    currentScreen: current.currentScreen,
  };
  return { ...merged, currentScreen: nextScreenFor(merged, result) };
};
