import type {
  AssessmentScreen,
  BehaviorBarrier,
  BehaviorConcern,
  BehaviorSeriousness,
  BehaviorTried,
  HousingGoal,
  HousingSituation,
  HousingTiming,
  OutcomeType,
  PetType,
  RootCauseType,
} from '@/types/assessment';

export const ASSESSMENT_SESSION_KEY = 'keep-them-home:active-case';
export const ASSESSMENT_SESSION_VERSION = 1;

export interface AssessmentCaseState {
  backendCaseId?: string;
  petName: string;
  petType: PetType;
  rootCause: RootCauseType;
  contributingBarriers?: Exclude<RootCauseType, ''>[];
  costConstraint?: string;
  housing: {
    situation: HousingSituation;
    urgency: HousingTiming;
    goal: HousingGoal;
  };
  behavior: {
    concern: BehaviorConcern;
    seriousness: BehaviorSeriousness;
    alreadyTried: BehaviorTried;
    helpBarrier: BehaviorBarrier;
  };
  outcome: OutcomeType;
  currentScreen: AssessmentScreen;
}

export const initialAssessmentCase: AssessmentCaseState = {
  petName: '',
  petType: '',
  rootCause: '',
  contributingBarriers: [],
  costConstraint: '',
  housing: { situation: '', urgency: '', goal: '' },
  behavior: { concern: '', seriousness: '', alreadyTried: '', helpBarrier: '' },
  outcome: '',
  currentScreen: 'home',
};

const allowed = {
  petType: ['', 'dog', 'cat', 'other'],
  rootCause: ['', 'housing', 'behavior', 'cost', 'medical', 'circumstances'],
  housingSituation: [
    '',
    'My landlord or property says pets aren’t allowed',
    'I can’t afford the pet deposit or fee',
    'I’m moving and struggling to find pet-friendly housing',
    'There’s a breed or size restriction',
    'I’m temporarily between homes',
  ],
  housingUrgency: ['', 'Today or within 48 hours', 'This week', 'Within a month', 'I’m planning ahead'],
  housingGoal: ['', 'Stay where I am', 'Move', 'Either could work'],
  behaviorConcern: [
    '',
    'Barking or excessive noise',
    'Destructive behavior',
    'House-training problems',
    'Separation-related behavior',
    'Leash or walking problems',
    'Conflict with another animal',
    'Growling, biting, or aggression',
  ],
  behaviorSeriousness: [
    '',
    'Frustrating, but manageable',
    'It’s affecting our daily life',
    'I’m seriously considering surrender',
    'There’s an immediate safety concern',
  ],
  behaviorTried: [
    '',
    'Nothing yet',
    'Online advice or videos',
    'Training at home',
    'Group training classes',
    'A professional trainer',
    'A veterinary consultation',
  ],
  behaviorBarrier: [
    '',
    'Cost',
    'Availability',
    'Transportation',
    'I don’t know who to contact',
    'I’ve already tried getting help',
    'Nothing — I just need a plan',
  ],
  outcome: ['', 'keeping', 'stillTrying', 'rehomingHelp'],
  screen: [
    'home', 'pet-info', 'root-cause', 'housing-1', 'housing-2', 'housing-3',
    'housing-complete', 'housing-plan', 'outcome-checkin', 'outcome-keeping',
    'outcome-still-trying', 'outcome-rehoming', 'responsible-rehoming',
    'behavior-1', 'behavior-2', 'behavior-3', 'behavior-4', 'behavior-complete',
  ],
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const includes = (values: readonly string[], value: unknown): value is string =>
  typeof value === 'string' && values.includes(value);

export const isAssessmentScreen = (value: unknown): value is AssessmentScreen =>
  includes(allowed.screen, value);

export const isAssessmentCaseState = (value: unknown): value is AssessmentCaseState => {
  if (!isRecord(value) || !isRecord(value.housing) || !isRecord(value.behavior)) return false;

  return (value.backendCaseId === undefined
      || (typeof value.backendCaseId === 'string'
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.backendCaseId)))
    && typeof value.petName === 'string'
    && includes(allowed.petType, value.petType)
    && includes(allowed.rootCause, value.rootCause)
    && (value.contributingBarriers === undefined
      || (Array.isArray(value.contributingBarriers)
        && value.contributingBarriers.every((barrier) => barrier !== '' && includes(allowed.rootCause, barrier))
        && new Set(value.contributingBarriers).size === value.contributingBarriers.length))
    && (value.costConstraint === undefined
      || (typeof value.costConstraint === 'string' && value.costConstraint.length <= 200))
    && includes(allowed.housingSituation, value.housing.situation)
    && includes(allowed.housingUrgency, value.housing.urgency)
    && includes(allowed.housingGoal, value.housing.goal)
    && includes(allowed.behaviorConcern, value.behavior.concern)
    && includes(allowed.behaviorSeriousness, value.behavior.seriousness)
    && includes(allowed.behaviorTried, value.behavior.alreadyTried)
    && includes(allowed.behaviorBarrier, value.behavior.helpBarrier)
    && includes(allowed.outcome, value.outcome)
    && isAssessmentScreen(value.currentScreen);
};

export const loadAssessmentCase = (): AssessmentCaseState => {
  try {
    const raw = sessionStorage.getItem(ASSESSMENT_SESSION_KEY);
    if (!raw) return initialAssessmentCase;
    const stored: unknown = JSON.parse(raw);
    if (!isRecord(stored)
      || stored.version !== ASSESSMENT_SESSION_VERSION
      || !isAssessmentCaseState(stored.caseState)) {
      sessionStorage.removeItem(ASSESSMENT_SESSION_KEY);
      return initialAssessmentCase;
    }
    return stored.caseState;
  } catch {
    try {
      sessionStorage.removeItem(ASSESSMENT_SESSION_KEY);
    } catch {
      // Storage is unavailable; fall back to a clean in-memory case.
    }
    return initialAssessmentCase;
  }
};

export const persistAssessmentCase = (caseState: AssessmentCaseState) => {
  try {
    if (JSON.stringify(caseState) === JSON.stringify(initialAssessmentCase)) {
      sessionStorage.removeItem(ASSESSMENT_SESSION_KEY);
      return;
    }
    sessionStorage.setItem(ASSESSMENT_SESSION_KEY, JSON.stringify({
      version: ASSESSMENT_SESSION_VERSION,
      caseState,
    }));
  } catch {
    // Storage can be unavailable in privacy-restricted browsers; the in-memory flow still works.
  }
};
