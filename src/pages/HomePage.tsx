import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import TrustDisclaimer from '@/components/TrustDisclaimer';
import Footer from '@/components/Footer';
import PetInfoScreen from '@/components/assessment/PetInfoScreen';
import RootCauseScreen from '@/components/assessment/RootCauseScreen';
import HousingStep1 from '@/components/assessment/HousingStep1';
import HousingStep2 from '@/components/assessment/HousingStep2';
import HousingStep3 from '@/components/assessment/HousingStep3';
import HousingComplete from '@/components/assessment/HousingComplete';
import HousingActionPlan from '@/components/assessment/HousingActionPlan';
import BehaviorStep1 from '@/components/assessment/BehaviorStep1';
import BehaviorStep2 from '@/components/assessment/BehaviorStep2';
import BehaviorStep3 from '@/components/assessment/BehaviorStep3';
import BehaviorStep4 from '@/components/assessment/BehaviorStep4';
import BehaviorComplete from '@/components/assessment/BehaviorComplete';
import OutcomeCheckIn from '@/components/assessment/OutcomeCheckIn';
import OutcomeKeeping from '@/components/assessment/OutcomeKeeping';
import OutcomeStillTrying from '@/components/assessment/OutcomeStillTrying';
import OutcomeRehoming from '@/components/assessment/OutcomeRehoming';
import ResponsibleRehoming from '@/components/assessment/ResponsibleRehoming';
import type {
  PetType,
  AssessmentScreen,
  HousingSituation,
  HousingTiming,
  HousingGoal,
  BehaviorConcern,
  BehaviorSeriousness,
  BehaviorTried,
  BehaviorBarrier,
  BarrierType,
  OutcomeType,
} from '@/types/assessment';
import {
  initialAssessmentCase,
  isAssessmentScreen,
  loadAssessmentCase,
  persistAssessmentCase,
  type AssessmentCaseState,
} from '@/lib/assessment-session';
import { useCaseSync } from '@/hooks/use-case-sync';
import { mergeIntakeResult } from '@/lib/intake-merge';
import type { IntakeResult } from '@/lib/intake-api';

type AssessmentAction =
  | { type: 'update'; patch: Partial<AssessmentCaseState> }
  | { type: 'reset' };

const assessmentReducer = (state: AssessmentCaseState, action: AssessmentAction): AssessmentCaseState => {
  if (action.type === 'reset') return initialAssessmentCase;
  return { ...state, ...action.patch };
};

const HISTORY_STATE_KEY = 'keepThemHomeScreen';

export const HomePage: React.FC = () => {
  const [caseState, dispatch] = useReducer(assessmentReducer, undefined, loadAssessmentCase);
  const mainContentRef = useRef<HTMLElement>(null);
  const {
    currentScreen,
    petName,
    petType,
    rootCause: selectedRootCause,
    selectedFactors,
    contributingBarriers,
    housing: { situation: housingSituation, urgency: housingTiming, goal: housingGoal },
    behavior: {
      concern: behaviorConcern,
      concerns: behaviorConcerns,
      seriousness: behaviorSeriousness,
      alreadyTried: behaviorTried,
      helpBarrier: behaviorBarrier,
    },
    outcome: selectedOutcome,
  } = caseState;

  const updateCase = <K extends keyof AssessmentCaseState>(key: K, value: AssessmentCaseState[K]) => {
    dispatch({ type: 'update', patch: { [key]: value } as Pick<AssessmentCaseState, K> });
  };

  const retainBackendCaseId = useCallback((id: string) => {
    dispatch({ type: 'update', patch: { backendCaseId: id } });
  }, []);

  useCaseSync(caseState, retainBackendCaseId);

  const setCurrentScreen = useCallback((screen: AssessmentScreen) => {
    if (screen === currentScreen) return;
    window.history.pushState({ [HISTORY_STATE_KEY]: screen }, '', window.location.href);
    dispatch({ type: 'update', patch: { currentScreen: screen } });
  }, [currentScreen]);

  useEffect(() => {
    persistAssessmentCase(caseState);
  }, [caseState]);

  useEffect(() => {
    window.history.replaceState({
      ...window.history.state,
      [HISTORY_STATE_KEY]: currentScreen,
    }, '', window.location.href);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const screen = event.state?.[HISTORY_STATE_KEY];
      if (isAssessmentScreen(screen)) {
        dispatch({ type: 'update', patch: { currentScreen: screen } });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mainContentRef.current?.focus({ preventScroll: true });
  }, [currentScreen]);

  const handleStartAssessment = () => {
    setCurrentScreen('pet-info');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleContinueToRootCause = () => {
    setCurrentScreen('root-cause');
  };

  const handleIntakeConfirm = (result: IntakeResult) => {
    const nextState = mergeIntakeResult(caseState, result);
    window.history.pushState({ [HISTORY_STATE_KEY]: nextState.currentScreen }, '', window.location.href);
    dispatch({ type: 'update', patch: nextState });
  };

  const handleBackToPetInfo = () => {
    setCurrentScreen('pet-info');
  };

  const handleFactorsChange = (factors: BarrierType[]) => {
    const primary = selectedRootCause && factors.includes(selectedRootCause) ? selectedRootCause : '';
    dispatch({ type: 'update', patch: {
      selectedFactors: factors,
      rootCause: primary,
      contributingBarriers: factors.filter((factor) => factor !== primary),
    } });
  };

  const handleConfirmFactors = (primary: BarrierType) => {
    dispatch({ type: 'update', patch: {
      rootCause: primary,
      contributingBarriers: selectedFactors.filter((factor) => factor !== primary),
    } });
    if (selectedFactors.includes('behavior')) setCurrentScreen('behavior-1');
    else if (primary === 'housing') setCurrentScreen('housing-1');
  };

  const handleBackToRootCause = () => {
    setCurrentScreen('root-cause');
  };

  // Housing Steps Navigation
  const handleContinueToHousing2 = () => {
    setCurrentScreen('housing-2');
  };

  const handleBackToHousing1 = () => {
    setCurrentScreen('housing-1');
  };

  const handleContinueToHousing3 = () => {
    setCurrentScreen('housing-3');
  };

  const handleBackToHousing2 = () => {
    setCurrentScreen('housing-2');
  };

  const handleContinueToHousingComplete = () => {
    setCurrentScreen('housing-complete');
  };

  const handleBackToHousing3 = () => {
    setCurrentScreen('housing-3');
  };

  const handleContinueToHousingPlan = () => {
    setCurrentScreen('housing-plan');
  };

  const handleBackToHousingComplete = () => {
    setCurrentScreen('housing-complete');
  };

  // Behavior Steps Navigation
  const handleContinueToBehavior2 = () => {
    setCurrentScreen('behavior-2');
  };

  const handleBackToBehavior1 = () => {
    setCurrentScreen('behavior-1');
  };

  const handleContinueToBehavior3 = () => {
    setCurrentScreen('behavior-3');
  };

  const handleBackToBehavior2 = () => {
    setCurrentScreen('behavior-2');
  };

  const handleContinueToBehavior4 = () => {
    setCurrentScreen('behavior-4');
  };

  const handleBackToBehavior3 = () => {
    setCurrentScreen('behavior-3');
  };

  const handleContinueToBehaviorComplete = () => {
    setCurrentScreen('behavior-complete');
  };

  const handleContinueAfterBehavior = () => {
    if (selectedRootCause !== 'housing') return;
    if (!housingSituation) setCurrentScreen('housing-1');
    else if (!housingTiming) setCurrentScreen('housing-2');
    else if (!housingGoal) setCurrentScreen('housing-3');
    else setCurrentScreen('housing-complete');
  };

  const handleToggleBehaviorConcern = (value: Exclude<BehaviorConcern, ''>) => {
    const concerns = behaviorConcerns.includes(value)
      ? behaviorConcerns.filter((concern) => concern !== value)
      : [...behaviorConcerns, value];
    updateCase('behavior', { ...caseState.behavior, concerns, concern: concerns[0] ?? '' });
  };

  const handleSelectBehaviorBarrier = (value: BehaviorBarrier) => {
    const patch: Partial<AssessmentCaseState> = {
      behavior: { ...caseState.behavior, helpBarrier: value },
    };
    if (value === 'Cost') {
      const factors = Array.from(new Set([...selectedFactors, 'cost' as const]));
      patch.selectedFactors = factors;
      patch.contributingBarriers = factors.filter((factor) => factor !== selectedRootCause);
      patch.costConstraint = 'Cannot afford behavior help';
    }
    dispatch({ type: 'update', patch });
  };

  const handleBackToBehavior4 = () => {
    setCurrentScreen('behavior-4');
  };

  // Outcome Flow Navigation
  const handleTryPlan = () => {
    setCurrentScreen('outcome-checkin');
  };

  const handleBackToHousingPlan = () => {
    setCurrentScreen('housing-plan');
  };

  const handleContinueFromCheckIn = () => {
    if (selectedOutcome === 'keeping') {
      setCurrentScreen('outcome-keeping');
    } else if (selectedOutcome === 'stillTrying') {
      setCurrentScreen('outcome-still-trying');
    } else if (selectedOutcome === 'rehomingHelp') {
      setCurrentScreen('outcome-rehoming');
    }
  };

  const handleExploreOtherOptions = () => {
    // Return to root cause while preserving pet name, pet type, and housing answers
    setCurrentScreen('root-cause');
  };

  // Responsible Rehoming Navigation
  const handleExploreResponsibleRehoming = () => {
    setCurrentScreen('responsible-rehoming');
  };

  const handleBackToOutcomeRehoming = () => {
    setCurrentScreen('outcome-rehoming');
  };

  // Intentional reset ONLY when user explicitly starts another case
  const handleStartAnotherCase = () => {
    window.history.pushState({ [HISTORY_STATE_KEY]: 'home' }, '', window.location.href);
    dispatch({ type: 'reset' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2D2D2D] selection:bg-[#E3C9B2]/60 selection:text-[#2E5440]">
      {/* Header */}
      <Header onCtaClick={handleBackToHome} />

      {/* Main Content Area */}
      <main ref={mainContentRef} tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
        {currentScreen === 'home' && (
          <>
            <Hero onStart={handleStartAssessment} />
            <HowItWorks />
            <TrustDisclaimer />
          </>
        )}

        {currentScreen === 'pet-info' && (
          <PetInfoScreen
            petName={petName}
            petType={petType}
            onNameChange={(value) => updateCase('petName', value)}
            onTypeSelect={(value) => updateCase('petType', value)}
            onContinue={handleContinueToRootCause}
            onBack={handleBackToHome}
            onIntakeConfirm={handleIntakeConfirm}
          />
        )}

        {currentScreen === 'root-cause' && (
          <RootCauseScreen
            petName={petName}
            selectedFactors={selectedFactors}
            selectedRootCause={selectedRootCause}
            onFactorsChange={handleFactorsChange}
            onConfirm={handleConfirmFactors}
            onBack={handleBackToPetInfo}
          />
        )}

        {/* Housing Pathway Screens */}
        {currentScreen === 'housing-1' && (
          <HousingStep1
            petName={petName}
            selectedSituation={housingSituation}
            onSelectSituation={(value) => updateCase('housing', { ...caseState.housing, situation: value })}
            onContinue={handleContinueToHousing2}
            onBack={handleBackToRootCause}
          />
        )}

        {currentScreen === 'housing-2' && (
          <HousingStep2
            selectedTiming={housingTiming}
            onSelectTiming={(value) => updateCase('housing', { ...caseState.housing, urgency: value })}
            onContinue={handleContinueToHousing3}
            onBack={handleBackToHousing1}
          />
        )}

        {currentScreen === 'housing-3' && (
          <HousingStep3
            selectedGoal={housingGoal}
            onSelectGoal={(value) => updateCase('housing', { ...caseState.housing, goal: value })}
            onContinue={handleContinueToHousingComplete}
            onBack={handleBackToHousing2}
          />
        )}

        {currentScreen === 'housing-complete' && (
          <HousingComplete
            petName={petName}
            situation={housingSituation}
            timing={housingTiming}
            goal={housingGoal}
            contributingBarriers={contributingBarriers}
            behaviorConcerns={behaviorConcerns}
            behaviorHelpBarrier={behaviorBarrier}
            costConstraint={caseState.costConstraint}
            onContinue={handleContinueToHousingPlan}
            onBack={handleBackToHousing3}
            onRestart={handleStartAnotherCase}
          />
        )}

        {currentScreen === 'housing-plan' && (
          <HousingActionPlan
            backendCaseId={caseState.backendCaseId}
            petName={petName}
            situation={housingSituation}
            timing={housingTiming}
            goal={housingGoal}
            onTryPlan={handleTryPlan}
            onBack={handleBackToHousingComplete}
          />
        )}

        {/* Behavior Pathway Screens */}
        {currentScreen === 'behavior-1' && (
          <BehaviorStep1
            petName={petName}
            selectedConcerns={behaviorConcerns}
            onToggleConcern={handleToggleBehaviorConcern}
            onContinue={handleContinueToBehavior2}
            onBack={handleBackToRootCause}
          />
        )}

        {currentScreen === 'behavior-2' && (
          <BehaviorStep2
            selectedSeriousness={behaviorSeriousness}
            onSelectSeriousness={(value) => updateCase('behavior', { ...caseState.behavior, seriousness: value })}
            onContinue={handleContinueToBehavior3}
            onBack={handleBackToBehavior1}
          />
        )}

        {currentScreen === 'behavior-3' && (
          <BehaviorStep3
            selectedTried={behaviorTried}
            onSelectTried={(value) => updateCase('behavior', { ...caseState.behavior, alreadyTried: value })}
            onContinue={handleContinueToBehavior4}
            onBack={handleBackToBehavior2}
          />
        )}

        {currentScreen === 'behavior-4' && (
          <BehaviorStep4
            selectedBarrier={behaviorBarrier}
            onSelectBarrier={handleSelectBehaviorBarrier}
            onContinue={handleContinueToBehaviorComplete}
            onBack={handleBackToBehavior3}
          />
        )}

        {currentScreen === 'behavior-complete' && (
          <BehaviorComplete
            petName={petName}
            concern={behaviorConcern}
            seriousness={behaviorSeriousness}
            tried={behaviorTried}
            barrier={behaviorBarrier}
            concerns={behaviorConcerns}
            contributingBarriers={contributingBarriers}
            costConstraint={caseState.costConstraint}
            onContinue={selectedRootCause === 'housing' ? handleContinueAfterBehavior : undefined}
            onBack={handleBackToBehavior4}
            onRestart={handleStartAnotherCase}
          />
        )}

        {/* Outcome Follow-Up Screens */}
        {currentScreen === 'outcome-checkin' && (
          <OutcomeCheckIn
            petName={petName}
            selectedOutcome={selectedOutcome}
            onSelectOutcome={(value) => updateCase('outcome', value)}
            onContinue={handleContinueFromCheckIn}
            onBack={handleBackToHousingPlan}
          />
        )}

        {currentScreen === 'outcome-keeping' && (
          <OutcomeKeeping
            petName={petName}
            onStartAnotherCase={handleStartAnotherCase}
            onReviewPlan={handleBackToHousingPlan}
          />
        )}

        {currentScreen === 'outcome-still-trying' && (
          <OutcomeStillTrying
            onReviewPlan={handleBackToHousingPlan}
            onExploreOtherOptions={handleExploreOtherOptions}
          />
        )}

        {currentScreen === 'outcome-rehoming' && (
          <OutcomeRehoming
            petName={petName}
            onExploreRehoming={handleExploreResponsibleRehoming}
            onReturnToPlan={handleBackToHousingPlan}
          />
        )}

        {/* Responsible Rehoming Pathway Screen */}
        {currentScreen === 'responsible-rehoming' && (
          <ResponsibleRehoming
            petName={petName}
            onReturnToPlan={handleBackToHousingPlan}
            onStartAnotherCase={handleStartAnotherCase}
            onBack={handleBackToOutcomeRehoming}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
