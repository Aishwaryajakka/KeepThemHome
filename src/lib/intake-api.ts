import type { IntakeFollowUp } from '../../server/intake/follow-ups';
import type { IntakeExtraction } from '../../server/validation/intake';

export type { IntakeExtraction, IntakeFollowUp };

export interface IntakeResult {
  extraction: IntakeExtraction;
  followUps: IntakeFollowUp[];
}

export const extractOwnerStory = async (text: string): Promise<IntakeResult> => {
  const response = await fetch('/api/intake/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Natural-language intake unavailable');
  return response.json() as Promise<IntakeResult>;
};
