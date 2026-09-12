import { count, eq } from 'drizzle-orm';
import { getDatabase } from '../db.js';
import { caseActions, caseSimilarityProfiles, outcomes } from '../db/schema.js';

const frequencies = (values: string[]) => Object.entries(values.reduce<Record<string, number>>((result, value) => ({ ...result, [value]: (result[value] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);

export const getStructuredOutcomeInsights = async () => {
  const db = getDatabase();
  const outcomeRows = await db.select({ status: outcomes.status, helpfulFactors: outcomes.helpfulFactors }).from(outcomes);
  const actionRows = await db.select({ actionKey: caseActions.actionKey, status: caseActions.status, notPossibleReason: caseActions.notPossibleReason }).from(caseActions);
  const [synthetic] = await db.select({ value: count() }).from(caseSimilarityProfiles).where(eq(caseSimilarityProfiles.isSynthetic, true));
  return {
    sampleSize: outcomeRows.length,
    syntheticProfileCount: synthetic.value,
    outcomeCategories: frequencies(outcomeRows.map(({ status }) => status)),
    reportedHelpfulFactors: frequencies(outcomeRows.flatMap(({ helpfulFactors }) => helpfulFactors)),
    attemptedActions: frequencies(actionRows.map(({ actionKey }) => actionKey)),
    notPossibleActions: frequencies(actionRows.filter(({ status }) => status === 'NOT_POSSIBLE').map(({ actionKey }) => actionKey)),
    notPossibleReasons: frequencies(actionRows.flatMap(({ notPossibleReason }) => notPossibleReason ? [notPossibleReason] : [])),
  };
};
