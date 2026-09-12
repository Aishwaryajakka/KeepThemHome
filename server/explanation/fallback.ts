import type { GroundedExplanationPayload } from './domain.js';
import type { ExplanationOutput } from '../validation/explanation.js';

export const deterministicExplanation = (payload: GroundedExplanationPayload): ExplanationOutput => {
  const { selectedPath: path } = payload;
  const known = path.blockers.filter(({ status }) => status === 'KNOWN_CONFLICT').map(({ label }) => label);
  const unknown = path.blockers.filter(({ status }) => status === 'UNKNOWN').map(({ label }) => label);
  const hypotheticalPrefix = payload.isHypothetical ? 'In this what-if scenario, ' : '';
  const summary = path.status === 'FEASIBLE'
    ? `${hypotheticalPrefix}the currently represented requirements for this path are satisfied. This does not guarantee an outcome or resource availability.`
    : path.status === 'CONDITIONAL'
      ? `${hypotheticalPrefix}no known modeled fact rules this path out, but required information is still unknown. Unknown conditions are not treated as available.`
      : `${hypotheticalPrefix}this path is currently blocked by a known conflict in the represented case facts.`;
  const whyParts = [
    known.length ? `Known conflict: ${known.join(' ')}` : '',
    unknown.length ? `Still unknown: ${unknown.join(' ')}` : '',
  ].filter(Boolean);
  const unlock = payload.smallestUnlock?.changes.map(({ label }) => label).join('; ');
  return {
    status: path.status,
    isHypothetical: payload.isHypothetical,
    headline: `${path.title}: ${path.status.toLowerCase()}`,
    summary,
    why: whyParts.join(' ') || path.objective,
    nextStep: unlock
      ? `For this path to become feasible in the model, these hypothetical changes are required: ${unlock}.`
      : `Review the listed steps and verify unknown conditions before relying on this path.`,
    resourceNames: [],
  };
};
