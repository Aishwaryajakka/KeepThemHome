import { z } from 'zod';

export const pathKeySchema = z.enum([
  'remain_in_current_housing',
  'temporary_care_bridge',
  'move_with_pet',
]);

export const supportedChangeCodeSchema = z.enum([
  'ALLOW_STAY_OR_MOVE',
  'CONFIRM_HOUSING_RESOLUTION',
  'CONFIRM_BEHAVIOR_MITIGATION',
  'CONFIRM_TEMPORARY_CARE',
  'CONFIRM_UNDERLYING_ISSUE_RESOLUTION',
  'CONFIRM_PET_FRIENDLY_HOUSING',
  'CONFIRM_MOVE_REQUIREMENTS',
]);

export const hypotheticalChangesSchema = z.object({
  appliedChanges: z.array(supportedChangeCodeSchema).max(7).optional(),
}).strict().refine(
  ({ appliedChanges = [] }) => new Set(appliedChanges).size === appliedChanges.length,
  'Duplicate hypothetical changes are not allowed',
);
