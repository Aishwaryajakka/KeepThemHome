import type { GroundedExplanationPayload } from './domain';
import type { ExplanationOutput } from '../validation/explanation';

const urlPattern = /https?:\/\/[^\s)\]}>,]+/gi;

export const isGroundedExplanation = (
  output: ExplanationOutput,
  payload: GroundedExplanationPayload,
) => {
  if (output.status !== payload.selectedPath.status || output.isHypothetical !== payload.isHypothetical) return false;
  const approvedNames = new Set(payload.resources.map(({ name }) => name));
  if (new Set(output.resourceNames).size !== output.resourceNames.length) return false;
  if (output.resourceNames.some((name) => !approvedNames.has(name))) return false;
  const approvedUrls = new Set(payload.resources.map(({ url }) => url));
  const prose = [output.headline, output.summary, output.why, output.nextStep].join(' ');
  if (payload.isHypothetical && !/\bwhat-if\b|\bhypothetical\b|\bif we assume\b/i.test(prose)) return false;
  return (prose.match(urlPattern) ?? []).every((url) => approvedUrls.has(url));
};
