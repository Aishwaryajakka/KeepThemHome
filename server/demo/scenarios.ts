import type { NormalizedHousingCase } from '../retention-paths/domain.js';

export const DEMO_SOURCE = 'keep-them-home-synthetic-demo-v1' as const;

export interface SyntheticDemoScenario {
  id: string;
  synthetic: true;
  source: typeof DEMO_SOURCE;
  name: string;
  petType: 'dog' | 'cat';
  story: string;
  primaryBarrier: string;
  contributingBarriers: string[];
  solverSupport: 'full-housing' | 'display-context-only';
}

export const syntheticDemoScenarios: SyntheticDemoScenario[] = [
  {
    id: 'demo-luna-v1', synthetic: true, source: DEMO_SOURCE, name: 'Luna', petType: 'dog',
    story: 'My landlord is threatening eviction because Luna barks while I’m at work. I have a week and can’t afford a trainer.',
    primaryBarrier: 'housing', contributingBarriers: ['behavior', 'cost'], solverSupport: 'full-housing',
  },
  {
    id: 'demo-max-v1', synthetic: true, source: DEMO_SOURCE, name: 'Max', petType: 'dog',
    story: 'Max needs veterinary care that I cannot currently afford.',
    primaryBarrier: 'cost', contributingBarriers: ['medical'], solverSupport: 'display-context-only',
  },
  {
    id: 'demo-bella-v1', synthetic: true, source: DEMO_SOURCE, name: 'Bella', petType: 'dog',
    story: 'Bella’s behavior has become difficult to manage with my work schedule.',
    primaryBarrier: 'behavior', contributingBarriers: ['time_capacity'], solverSupport: 'display-context-only',
  },
  {
    id: 'demo-milo-v1', synthetic: true, source: DEMO_SOURCE, name: 'Milo', petType: 'cat',
    story: 'A temporary crisis has disrupted Milo’s care and money is tight.',
    primaryBarrier: 'temporary_crisis', contributingBarriers: ['cost'], solverSupport: 'display-context-only',
  },
  {
    id: 'demo-daisy-v1', synthetic: true, source: DEMO_SOURCE, name: 'Daisy', petType: 'dog',
    story: 'Daisy and I need housing that will accept her, and moving costs are a barrier.',
    primaryBarrier: 'housing', contributingBarriers: ['cost'], solverSupport: 'display-context-only',
  },
  {
    id: 'demo-rocky-v1', synthetic: true, source: DEMO_SOURCE, name: 'Rocky', petType: 'dog',
    story: 'A family change has left me without enough time to care for Rocky.',
    primaryBarrier: 'circumstances', contributingBarriers: ['time_capacity'], solverSupport: 'display-context-only',
  },
];

export const buildLunaSolverFacts = (goal: NormalizedHousingCase['goal'] = null): NormalizedHousingCase => ({
  primaryBarrier: 'housing',
  contributingBarriers: ['behavior', 'cost'],
  situation: 'My landlord or property says pets aren’t allowed',
  urgency: 'This week',
  goal,
  costConstraint: 'Cannot afford a trainer',
  constraints: {
    goalSupportsStay: goal === 'Stay where I am' || goal === 'Either could work' ? true : goal === 'Move' ? false : 'unknown',
    goalSupportsMove: goal === 'Move' || goal === 'Either could work' ? true : goal === 'Stay where I am' ? false : 'unknown',
    housingResolutionPossible: 'unknown',
    behaviorContributor: true,
    behaviorMitigationAvailable: 'unknown',
    temporaryCareAvailable: 'unknown',
    underlyingIssueResolutionPossible: 'unknown',
    petFriendlyHousingAvailable: 'unknown',
    moveRequirementsMet: 'unknown',
  },
});

export const demoSeedManifest = () => ({
  source: DEMO_SOURCE,
  persistence: 'ephemeral-client-only' as const,
  databaseWrites: [] as string[],
  scenarios: syntheticDemoScenarios.map(({ id, name, synthetic, solverSupport }) => ({ id, name, synthetic, solverSupport })),
});
