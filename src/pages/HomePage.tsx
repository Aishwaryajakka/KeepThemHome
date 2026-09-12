import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Header from '@/components/Header';
import AppHeader from '@/components/AppHeader';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import TrustDisclaimer from '@/components/TrustDisclaimer';
import Footer from '@/components/Footer';
import { BrandMoment, ValueProposition } from '@/components/LandingSections';
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
import { structuredFactors, useCaseSync } from '@/hooks/use-case-sync';
import { caseApi, SAVED_PLANS_CHANGED_EVENT } from '@/lib/case-api';
import { useAppAuth } from '@/auth/AuthProvider';
import { mergeIntakeResult } from '@/lib/intake-merge';
import type { IntakeResult } from '@/lib/intake-api';
import { useDemoMode } from '@/demo/DemoModeProvider';
import AuthenticatedHome from '@/components/AuthenticatedHome';
import DomainDetailsScreen from '@/components/assessment/DomainDetailsScreen';
import { restorePersistedCase } from '@/lib/persisted-case';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

type AssessmentAction =
  | { type: 'update'; patch: Partial<AssessmentCaseState> }
  | { type: 'reset' };

const assessmentReducer = (state: AssessmentCaseState, action: AssessmentAction): AssessmentCaseState => {
  if (action.type === 'reset') return initialAssessmentCase;
  return { ...state, ...action.patch };
};

const HISTORY_STATE_KEY = 'keepThemHomeScreen';

const LUNA_DEMO_STORY = 'My landlord is threatening eviction because Luna barks while I’m at work. I have a week and can’t afford a trainer.';
const lunaDemoExtraction: IntakeResult = {
  extraction: {
    petName: 'Luna', petType: 'dog', primaryBarrier: 'housing', contributingBarriers: ['behavior', 'cost'],
    housingSituation: 'My landlord or property says pets aren’t allowed', behaviorConcern: 'Barking or excessive noise',
    behaviorSeriousness: null, behaviorAlreadyTried: null, behaviorHelpBarrier: 'Cost',
    costConstraint: 'Cannot afford a trainer', urgency: 'This week', goal: null,
  },
  followUps: [{ field: 'goal', screen: 'housing-3', question: 'What are you open to right now?' }],
};

export const HomePage: React.FC = () => {
  const [caseState, dispatch] = useReducer(assessmentReducer, undefined, loadAssessmentCase);
  const auth = useAppAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { petId: routePetId, caseId: routeCaseId } = useParams();
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const demo = useDemoMode();
  const demoWasActive = useRef(false);
  const [saveRequested, setSaveRequested] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const mainContentRef = useRef<HTMLElement>(null);
  const saveInFlight = useRef(false);
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
    domain: domainAnswers,
  } = caseState;

  const updateCase = <K extends keyof AssessmentCaseState>(key: K, value: AssessmentCaseState[K]) => {
    dispatch({ type: 'update', patch: { [key]: value } as Pick<AssessmentCaseState, K> });
  };

  const retainBackendCaseId = useCallback((id: string) => {
    dispatch({ type: 'update', patch: { backendCaseId: id } });
  }, []);

  useCaseSync(caseState);

  useEffect(() => {
    if (!routeCaseId || !auth.loaded) return;
    if (!auth.serverReady) { setRestoreStatus('error'); return; }
    let active = true;
    setRestoreStatus('loading');
    dispatch({ type: 'reset' });
    void caseApi.getCase(routeCaseId).then((saved) => {
      if (!active || (routePetId && saved.pet?.id !== routePetId)) throw new Error('Persisted case does not match route');
      const restored = restorePersistedCase(saved);
      if (!restored) throw new Error('Persisted case is invalid');
      const checkIn = new URLSearchParams(location.search).get('checkIn') === '1';
      dispatch({ type: 'update', patch: checkIn ? { ...restored, currentScreen: 'outcome-checkin' } : restored });
      setSaveStatus('saved');
      setRestoreStatus('idle');
    }).catch(() => { if (active) setRestoreStatus('error'); });
    return () => { active = false; };
  }, [auth.loaded, auth.serverReady, location.search, routeCaseId, routePetId]);

  useEffect(() => {
    if (demo.active) {
      demoWasActive.current = true;
      dispatch({ type: 'reset' });
      dispatch({ type: 'update', patch: { currentScreen: 'pet-info', petName: 'Luna', petType: 'dog' } });
      setSaveRequested(false);
      setSaveStatus('idle');
    } else if (demoWasActive.current) {
      demoWasActive.current = false;
      dispatch({ type: 'reset' });
      setSaveRequested(false);
      setSaveStatus('idle');
    }
  }, [demo.active]);

  const saveCurrentPlan = useCallback(async () => {
    if (saveInFlight.current || !auth.serverReady || !caseState.petName.trim() || !caseState.petType || !caseState.rootCause) return;
    saveInFlight.current = true;
    setSaveStatus('saving');
    try {
      const caseInput = {
        primaryBarrier: caseState.rootCause,
        urgency: (caseState.rootCause === 'housing' ? caseState.housing.urgency : caseState.domain.urgency) || null,
        goal: caseState.housing.goal || null,
        currentStatus: 'ACTIVE' as const,
      };
      const saved = await caseApi.saveAssessment({
        ...(caseState.backendCaseId ? { caseId: caseState.backendCaseId } : {}),
        pet: { name: caseState.petName.trim(), type: caseState.petType },
        case: caseInput,
        factors: structuredFactors(caseState),
      });
      retainBackendCaseId(saved.case.id);
      window.dispatchEvent(new Event(SAVED_PLANS_CHANGED_EVENT));
      setSaveStatus('saved');
      setSaveRequested(false);
    } catch {
      setSaveStatus('error');
      setSaveRequested(false);
    } finally {
      saveInFlight.current = false;
    }
  }, [auth.serverReady, caseState, retainBackendCaseId]);

  useEffect(() => {
    if (saveRequested && auth.serverReady && saveStatus !== 'saving') void saveCurrentPlan();
  }, [auth.serverReady, saveCurrentPlan, saveRequested, saveStatus]);

  const handleSavePlan = () => {
    if (!auth.loaded || saveInFlight.current) return;
    if (!auth.configured) {
      setSaveStatus('error');
      return;
    }
    if (auth.serverReady) void saveCurrentPlan();
    else if (auth.signedIn) setSaveStatus('error');
    else {
      setSaveRequested(true);
      auth.openSignIn();
    }
  };

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

  const handleExit = () => {
    if (demo.active) demo.reset();
    window.history.replaceState({ [HISTORY_STATE_KEY]: 'home' }, '', '/');
    dispatch({ type: 'reset' });
    setSaveRequested(false);
    setSaveStatus('idle');
    navigate('/', { replace: true });
  };

  const handleContinueSavedCase = async (caseId: string) => {
    try {
      const restored = restorePersistedCase(await caseApi.getCase(caseId));
      if (!restored) return;
      window.history.pushState({ [HISTORY_STATE_KEY]: restored.currentScreen }, '', window.location.href);
      dispatch({ type: 'update', patch: restored });
    } catch { /* The authenticated home keeps its current recoverable state. */ }
  };

  const handleContinueToRootCause = () => {
    setCurrentScreen('root-cause');
  };

  const handleIntakeConfirm = (result: IntakeResult, confirmedGoal?: HousingGoal) => {
    const merged = mergeIntakeResult(caseState, result);
    const nextState = confirmedGoal ? {
      ...merged,
      housing: { ...merged.housing, goal: confirmedGoal },
      currentScreen: merged.rootCause === 'housing' ? 'housing-complete' as const : merged.currentScreen,
    } : merged;
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
      costConstraint: factors.includes('cost') ? caseState.costConstraint || 'Cost is affecting available options' : '',
    } });
  };

  const handleConfirmFactors = (primary: BarrierType) => {
    dispatch({ type: 'update', patch: {
      rootCause: primary,
      contributingBarriers: selectedFactors.filter((factor) => factor !== primary),
    } });
    if (primary === 'behavior') setCurrentScreen('behavior-1');
    else if (primary === 'housing') setCurrentScreen('housing-1');
    else setCurrentScreen('domain-details');
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
    setCurrentScreen('domain-details');
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
    if (selectedRootCause !== 'housing') {
      setCurrentScreen('domain-details');
      return;
    }
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
      {currentScreen === 'home' ? <Header
        variant={currentScreen === 'home' ? 'marketing' : 'product'}
            onCtaClick={handleExit}
        onStart={currentScreen === 'home' ? handleStartAssessment : undefined}
        petName={petName}
        petType={petType}
        factors={selectedFactors}
        urgency={housingTiming}
        saved={saveStatus === 'saved'}
      /> : auth.signedIn ? <AppHeader /> : <Header variant="product" onCtaClick={handleExit} petName={petName} petType={petType} factors={selectedFactors} urgency={housingTiming} saved={saveStatus === 'saved'} />}

      {/* Main Content Area */}
      <main ref={mainContentRef} tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
        {restoreStatus === 'loading' && <div className="mx-auto w-full max-w-6xl px-5 py-20" role="status"><div className="h-52 animate-pulse rounded-3xl bg-[var(--sage)]/20" /><p className="mt-4 text-center text-[var(--text-muted)]">Loading your pet’s case…</p></div>}
        {restoreStatus === 'error' && <section className="mx-auto my-16 max-w-xl rounded-3xl border border-[var(--border-warm)] bg-white p-8 text-center" role="alert"><h1 className="font-serif text-3xl text-[var(--forest)]">We couldn’t load this pet’s case.</h1><p className="mt-3 text-[var(--text-muted)]">Return to your dashboard and try again.</p><button type="button" onClick={() => navigate('/dashboard')} className="brand-focus mt-6 rounded-full bg-[var(--forest)] px-5 py-3 font-semibold text-white">Back to dashboard</button></section>}
        {restoreStatus === 'idle' && currentScreen === 'home' && (
          <>
            <Hero onStart={handleStartAssessment} />
            <AuthenticatedHome active={auth.loaded && auth.signedIn} onStart={handleStartAssessment} onContinue={(_petId, caseId) => void handleContinueSavedCase(caseId)} onViewAll={() => navigate('/my-pets')} />
            <ValueProposition />
            <section className="bg-[var(--cream)] py-16 sm:py-20"><div className="mx-auto grid max-w-[1380px] gap-10 px-5 sm:px-8 lg:grid-cols-[1.48fr_1fr] lg:items-start lg:gap-16 lg:px-12"><HowItWorks /><TrustDisclaimer /></div></section>
            <BrandMoment onStart={handleStartAssessment} />
          </>
        )}

        {currentScreen === 'pet-info' && (
          <PetInfoScreen
            petName={petName}
            petType={petType}
            demoStory={demo.active ? LUNA_DEMO_STORY : undefined}
            demoFallback={demo.active ? lunaDemoExtraction : undefined}
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
            petType={petType}
            situation={housingSituation}
            timing={housingTiming}
            goal={housingGoal}
            onBack={selectedRootCause === 'housing' ? handleBackToHousingComplete : () => setCurrentScreen('domain-details')}
            onSavePlan={handleSavePlan}
            saveStatus={saveStatus}
            authLoaded={auth.loaded}
            signedIn={auth.signedIn}
            authError={auth.status === 'AUTH_ERROR'}
            onAuthRetry={auth.retry}
            primaryBarrier={selectedRootCause || 'housing'}
            domainAnswers={domainAnswers}
            contributingBarriers={contributingBarriers}
            costConstraint={caseState.costConstraint}
            onCheckIn={() => setCurrentScreen('outcome-checkin')}
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
            onContinue={handleContinueAfterBehavior}
            onBack={handleBackToBehavior1}
            onRestart={handleStartAnotherCase}
          />
        )}

        {(currentScreen === 'domain-details' || currentScreen === 'general-plan') && selectedRootCause && selectedRootCause !== 'housing' && (
          <DomainDetailsScreen
            petName={petName}
            primaryBarrier={selectedRootCause}
            value={domainAnswers}
            onChange={(value) => updateCase('domain', value)}
            onContinue={handleContinueToHousingPlan}
            onBack={selectedRootCause === 'behavior' ? handleBackToBehavior1 : handleBackToRootCause}
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
            onReportHelpful={(factors) => { if (caseState.backendCaseId) void caseApi.recordOutcome(caseState.backendCaseId, 'KEEPING_PET', factors); }}
            onThingsChanged={() => { updateCase('outcome', ''); setCurrentScreen('housing-plan'); }}
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
      <Footer variant={currentScreen === 'home' ? 'marketing' : 'product'} />
    </div>
  );
};

export default HomePage;
