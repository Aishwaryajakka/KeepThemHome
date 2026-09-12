import { retentionPathCatalog } from '../retention-paths/catalog';
import type { ActionDefinition } from './domain';

const outcomeLabels = (fact: ActionDefinition['relatedFact']) => [
  { key: `${fact.toUpperCase()}_CONFIRMED`, label: 'The needed support or change is confirmed', factValue: true as const },
  { key: `${fact.toUpperCase()}_UNAVAILABLE`, label: 'The needed support or change is not available', factValue: false as const },
  { key: `${fact.toUpperCase()}_PENDING`, label: 'I’m waiting for a decision' },
  { key: `${fact.toUpperCase()}_OTHER`, label: 'Something else happened' },
];

export const actionCatalog: ActionDefinition[] = retentionPathCatalog.flatMap((path) => path.steps.slice(0, 1).map((step) => {
  const requirement = path.requirements[0];
  const housingContact = path.key === 'remain_in_current_housing';
  return {
    key: housingContact ? 'contact_landlord' : step.key,
    pathKey: path.key,
    interventionKey: step.interventionKey,
    relatedFact: requirement.fact,
    title: housingContact ? 'Contact landlord or property manager' : step.title,
    description: housingContact ? 'Ask for the exact restriction and whether a documented resolution would allow your pet to stay.' : step.description,
    outcomes: housingContact ? [
      { key: 'LANDLORD_CONTACT_ALLOWED_STAY', label: 'They agreed my pet can stay', factValue: true as const },
      { key: 'LANDLORD_CONTACT_DENIED', label: 'They said my pet cannot stay', factValue: false as const },
      { key: 'LANDLORD_CONTACT_PENDING', label: 'I’m waiting for a decision' },
      { key: 'LANDLORD_CONTACT_OTHER', label: 'Something else happened' },
    ] : outcomeLabels(requirement.fact),
  };
}));

export const getActionDefinition = (pathKey: string, actionKey: string) =>
  actionCatalog.find((action) => action.pathKey === pathKey && action.key === actionKey);

export const getOutcomeDefinition = (action: ActionDefinition, outcomeKey: string) =>
  action.outcomes.find((outcome) => outcome.key === outcomeKey);
