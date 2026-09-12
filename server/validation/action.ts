import { z } from 'zod';
import { actionStatuses, notPossibleReasons } from '../actions/domain';

export const createActionSchema = z.object({ pathKey: z.string().regex(/^[a-z0-9_]+$/), actionKey: z.string().regex(/^[a-z0-9_]+$/) }).strict();
export const updateActionSchema = z.object({
  status: z.enum(actionStatuses), notPossibleReason: z.enum(notPossibleReasons).nullable().optional(), resultNote: z.string().trim().max(300).nullable().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.status === 'NOT_POSSIBLE' && !value.notPossibleReason) ctx.addIssue({ code: 'custom', path: ['notPossibleReason'], message: 'A reason is required' });
  if (value.status !== 'NOT_POSSIBLE' && value.notPossibleReason) ctx.addIssue({ code: 'custom', path: ['notPossibleReason'], message: 'Reason only applies to Not possible' });
});
export const actionOutcomeSchema = z.object({ outcomeKey: z.string().regex(/^[A-Z0-9_]+$/), resultNote: z.string().trim().max(300).nullable().optional() }).strict();
