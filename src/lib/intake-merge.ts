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
    if (followUp.field === 'behaviorConcern') return state.behavior.concerns.length === 0;
    if (followUp.field === 'behaviorSeriousness') return !state.behavior.seriousness;
    if (followUp.field === 'behaviorAlreadyTried') return !state.behavior.alreadyTried;
    if (followUp.field === 'behaviorHelpBarrier') return !state.behavior.helpBarrier;
    return true;
  });
  if (firstStillMissing) return firstStillMissing.screen;
  if (state.rootCause === 'housing') return 'housing-complete';
  if (state.rootCause === 'behavior') {
    return state.behavior.seriousness === 'There’s an immediate safety concern'
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
  const primaryBarrier = current.rootCause || extraction.primaryBarrier || '';
  const contributingBarriers = Array.from(new Set([
    ...(current.contributingBarriers ?? []),
    ...extraction.contributingBarriers,
  ])).filter((barrier) => barrier !== primaryBarrier) as Exclude<RootCauseType, ''>[];
  const selectedFactors = Array.from(new Set([
    ...current.selectedFactors,
    ...(primaryBarrier ? [primaryBarrier] : []),
    ...contributingBarriers,
  ])) as Exclude<RootCauseType, ''>[];
  const behaviorConcerns = Array.from(new Set([
    ...current.behavior.concerns,
    ...(extraction.behaviorConcern ? [extraction.behaviorConcern] : []),
  ]));

  const merged: AssessmentCaseState = {
    ...current,
    petName: current.petName || extraction.petName || '',
    petType: current.petType || extraction.petType || '',
    rootCause: primaryBarrier,
    selectedFactors,
    contributingBarriers,
    costConstraint: current.costConstraint || extraction.costConstraint || '',
    housing: {
      situation: current.housing.situation || extraction.housingSituation || '',
      urgency: current.housing.urgency || extraction.urgency || '',
      goal: current.housing.goal || extraction.goal || '',
    },
    behavior: {
      concern: behaviorConcerns[0] ?? '',
      concerns: behaviorConcerns,
      seriousness: current.behavior.seriousness || extraction.behaviorSeriousness || '',
      alreadyTried: current.behavior.alreadyTried || extraction.behaviorAlreadyTried || '',
      helpBarrier: current.behavior.helpBarrier || extraction.behaviorHelpBarrier || '',
    },
    currentScreen: current.currentScreen,
  };
  return { ...merged, currentScreen: nextScreenFor(merged, result) };
};
