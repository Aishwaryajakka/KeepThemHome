import { and, asc, eq } from 'drizzle-orm';
import { getDatabase } from '../db';
import { caseActions, caseEvents } from '../db/schema';
import { getActionDefinition, getOutcomeDefinition } from '../actions/catalog';
import { addCaseFactors } from './case-service';
import { generateRetentionPaths } from './path-service';
import type { ActionStatus, NotPossibleReason } from '../actions/domain';

export const listCaseActions = (caseId: string) => getDatabase().select().from(caseActions).where(eq(caseActions.caseId, caseId)).orderBy(asc(caseActions.createdAt));
export const listCaseEvents = (caseId: string) => getDatabase().select().from(caseEvents).where(eq(caseEvents.caseId, caseId)).orderBy(asc(caseEvents.createdAt));

const addEvent = (caseId: string, eventType: string, eventData: Record<string, string | null>, actionId?: string) =>
  getDatabase().insert(caseEvents).values({ caseId, actionId, eventType, eventData }).returning();

export const addCaseAction = async (caseId: string, pathKey: string, actionKey: string) => {
  const definition = getActionDefinition(pathKey, actionKey);
  if (!definition) return undefined;
  const [action] = await getDatabase().insert(caseActions).values({
    caseId, pathKey, actionKey, interventionKey: definition.interventionKey, relatedFact: definition.relatedFact,
    title: definition.title, description: definition.description,
  }).onConflictDoNothing().returning();
  const existing = action ?? (await getDatabase().select().from(caseActions).where(and(eq(caseActions.caseId, caseId), eq(caseActions.pathKey, pathKey), eq(caseActions.actionKey, actionKey))).limit(1))[0];
  if (action) await addEvent(caseId, 'ACTION_ADDED', { actionKey, title: definition.title, status: 'PLANNED' }, action.id);
  return existing;
};

export const updateCaseAction = async (caseId: string, actionId: string, input: { status: ActionStatus; notPossibleReason?: NotPossibleReason | null; resultNote?: string | null }) => {
  const [action] = await getDatabase().update(caseActions).set({
    status: input.status, notPossibleReason: input.status === 'NOT_POSSIBLE' ? input.notPossibleReason : null,
    resultNote: input.resultNote, completedAt: input.status === 'COMPLETED' ? new Date() : null, updatedAt: new Date(),
  }).where(and(eq(caseActions.id, actionId), eq(caseActions.caseId, caseId))).returning();
  if (action) await addEvent(caseId, 'ACTION_STATUS_CHANGED', { actionKey: action.actionKey, title: action.title, status: action.status, reason: action.notPossibleReason }, action.id);
  return action;
};

const factorTypeForFact: Record<string, string> = {
  housingResolutionPossible: 'housing_resolution_possible', behaviorMitigationAvailable: 'behavior_mitigation_available',
  temporaryCareAvailable: 'temporary_care_available', underlyingIssueResolutionPossible: 'underlying_issue_resolution_possible',
  petFriendlyHousingAvailable: 'pet_friendly_housing_available', moveRequirementsMet: 'move_requirements_met',
  primarySupportPossible: 'primary_support_possible', bridgeAvailable: 'bridge_available', alternativeAvailable: 'alternative_available',
  costReductionPossible: 'cost_reduction_possible', careAccessPossible: 'care_access_possible', careSupportAvailable: 'care_support_available', householdAdaptationPossible: 'household_adaptation_possible',
};

export const recordActionOutcome = async (caseId: string, actionId: string, outcomeKey: string, resultNote?: string | null) => {
  const [current] = await getDatabase().select().from(caseActions).where(and(eq(caseActions.id, actionId), eq(caseActions.caseId, caseId))).limit(1);
  if (!current || current.status !== 'COMPLETED') return { status: 'invalid' as const };
  const definition = getActionDefinition(current.pathKey, current.actionKey);
  const outcome = definition && getOutcomeDefinition(definition, outcomeKey);
  if (!definition || !outcome) return { status: 'invalid' as const };
  const before = await generateRetentionPaths(caseId);
  await getDatabase().update(caseActions).set({ outcomeKey, resultNote, updatedAt: new Date() }).where(eq(caseActions.id, actionId));
  let changedFact: { field: string; value: boolean } | null = null;
  if (outcome.factValue !== undefined) {
    const factorType = factorTypeForFact[definition.relatedFact];
    if (factorType) {
      await addCaseFactors(caseId, { factors: [{ factorType, factorValue: outcome.factValue ? 'yes' : 'no', role: 'constraint', source: 'structured' }] });
      changedFact = { field: definition.relatedFact, value: outcome.factValue };
    }
  }
  const after = await generateRetentionPaths(caseId);
  await addEvent(caseId, 'ACTION_OUTCOME_RECORDED', { actionKey: current.actionKey, title: current.title, outcomeKey, changedFact: changedFact?.field ?? null }, actionId);
  const transitions = (before?.paths ?? []).flatMap((oldPath) => {
    const newPath = after?.paths.find(({ key }) => key === oldPath.key);
    return newPath && newPath.status !== oldPath.status ? [{ pathKey: oldPath.key, title: oldPath.title, from: oldPath.status, to: newPath.status }] : [];
  });
  for (const transition of transitions) await addEvent(caseId, 'PATH_STATUS_CHANGED', transition, actionId);
  return { status: 'ok' as const, action: { ...current, outcomeKey, resultNote }, changedFact, paths: after?.paths ?? [], transitions };
};
