export type PetType = 'dog' | 'cat' | 'other' | '';

export type BarrierType = 'housing' | 'behavior' | 'cost' | 'medical' | 'temporary_crisis' | 'time_capacity' | 'circumstances';
export type RootCauseType = BarrierType | '';

export type HousingSituation =
  | "My landlord or property says pets aren’t allowed"
  | "I can’t afford the pet deposit or fee"
  | "I’m moving and struggling to find pet-friendly housing"
  | "There’s a breed or size restriction"
  | "I’m temporarily between homes"
  | '';

export type HousingTiming =
  | "Today or within 48 hours"
  | "This week"
  | "Within a month"
  | "I’m planning ahead"
  | '';

export type HousingGoal =
  | "Stay where I am"
  | "Move"
  | "Either could work"
  | '';

export type BehaviorConcern =
  | "Barking or excessive noise"
  | "Destructive behavior"
  | "House-training problems"
  | "Separation-related behavior"
  | "Leash or walking problems"
  | "Conflict with another animal"
  | "Growling, biting, or aggression"
  | "Difficulty around other dogs"
  | "Difficulty around cats or other animals"
  | "Difficulty around children or people"
  | "Resource guarding"
  | "Escape or roaming"
  | "Fear or anxiety"
  | "High energy or exercise needs"
  | '';

export const BEHAVIOR_CONCERN_OPTIONS: Exclude<BehaviorConcern, ''>[] = [
  'Barking or excessive noise',
  'Destructive behavior',
  'House-training problems',
  'Separation-related behavior',
  'Leash or walking problems',
  'Conflict with another animal',
  'Growling, biting, or aggression',
  'Difficulty around other dogs',
  'Difficulty around cats or other animals',
  'Difficulty around children or people',
  'Resource guarding',
  'Escape or roaming',
  'Fear or anxiety',
  'High energy or exercise needs',
];

export type BehaviorSeriousness =
  | "Frustrating, but manageable"
  | "It’s affecting our daily life"
  | "I’m seriously considering surrender"
  | "There’s an immediate safety concern"
  | '';

export type BehaviorTried =
  | "Nothing yet"
  | "Online advice or videos"
  | "Training at home"
  | "Group training classes"
  | "A professional trainer"
  | "A veterinary consultation"
  | '';

export type BehaviorBarrier =
  | "Cost"
  | "Availability"
  | "Transportation"
  | "I don’t know who to contact"
  | "I’ve already tried getting help"
  | "Nothing — I just need a plan"
  | '';

export type OutcomeType = 'keeping' | 'stillTrying' | 'rehomingHelp' | '';

export interface AssessmentState {
  petName: string;
  petType: PetType;
  rootCause: RootCauseType;
  // Housing pathway
  housingSituation: HousingSituation;
  housingTiming: HousingTiming;
  housingGoal: HousingGoal;
  // Behavior pathway
  behaviorConcern: BehaviorConcern;
  behaviorSeriousness: BehaviorSeriousness;
  behaviorTried: BehaviorTried;
  behaviorBarrier: BehaviorBarrier;
  // Outcome
  outcome: OutcomeType;
}

export type AssessmentScreen =
  | 'home'
  | 'pet-info'
  | 'root-cause'
  | 'housing-1'
  | 'housing-2'
  | 'housing-3'
  | 'housing-complete'
  | 'housing-plan'
  | 'outcome-checkin'
  | 'outcome-keeping'
  | 'outcome-still-trying'
  | 'outcome-rehoming'
  | 'responsible-rehoming'
  | 'behavior-1'
  | 'behavior-2'
  | 'behavior-3'
  | 'behavior-4'
  | 'behavior-complete';
