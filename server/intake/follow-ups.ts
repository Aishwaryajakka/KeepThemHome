import type { AssessmentScreen } from '../../src/types/assessment';
import type { IntakeExtraction } from '../validation/intake';

export interface IntakeFollowUp {
  field: string;
  screen: AssessmentScreen;
  question: string;
}

export const selectIntakeFollowUps = (extraction: IntakeExtraction): IntakeFollowUp[] => {
  const questions: IntakeFollowUp[] = [];
  if (!extraction.petName || !extraction.petType) questions.push({ field: 'pet', screen: 'pet-info', question: 'Who are we helping?' });
  if (!extraction.primaryBarrier) questions.push({ field: 'primaryBarrier', screen: 'root-cause', question: 'What’s making it hard to keep your pet right now?' });

  const barriers = new Set([extraction.primaryBarrier, ...extraction.contributingBarriers]);
  if (barriers.has('behavior')) {
    if (!extraction.behaviorConcern) questions.push({ field: 'behaviorConcern', screen: 'behavior-1', question: 'What behavior are you dealing with?' });
    if (!extraction.behaviorSeriousness) questions.push({ field: 'behaviorSeriousness', screen: 'behavior-2', question: 'How serious does the situation feel?' });
    if (!extraction.behaviorAlreadyTried) questions.push({ field: 'behaviorAlreadyTried', screen: 'behavior-3', question: 'What have you already tried?' });
    if (!extraction.behaviorHelpBarrier) questions.push({ field: 'behaviorHelpBarrier', screen: 'behavior-4', question: 'What has made it hard to get help?' });
  }
  if (barriers.has('housing')) {
    if (!extraction.housingSituation) questions.push({ field: 'housingSituation', screen: 'housing-1', question: 'What’s happening with your housing?' });
    if (!extraction.urgency) questions.push({ field: 'urgency', screen: 'housing-2', question: 'How soon do you need a solution?' });
    if (!extraction.goal) questions.push({ field: 'goal', screen: 'housing-3', question: 'Would you prefer to stay where you are or move?' });
  }
  return questions.slice(0, 3);
};
