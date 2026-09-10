import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { HousingSituation, HousingTiming, HousingGoal } from '@/types/assessment';
import { matchHousingResources } from '@/data/resources';
import {
  caseApi,
  type CasePlan,
  type RetentionPathResult,
  type SupportedChangeCode,
  type UnlockResponse,
} from '@/lib/case-api';

interface HousingActionPlanProps {
  backendCaseId?: string;
  petName: string;
  situation: HousingSituation;
  timing: HousingTiming;
  goal: HousingGoal;
  onTryPlan: () => void;
  onBack: () => void;
}

export const HousingActionPlan: React.FC<HousingActionPlanProps> = ({
  backendCaseId,
  petName,
  situation,
  timing,
  goal,
  onTryPlan,
  onBack,
}) => {
  const displayName = petName.trim() || 'Luna';
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [backendPlan, setBackendPlan] = useState<CasePlan | null>(null);
  const [retentionPaths, setRetentionPaths] = useState<RetentionPathResult[] | null>(null);
  const [appliedChanges, setAppliedChanges] = useState<SupportedChangeCode[]>([]);
  const [unlockingPath, setUnlockingPath] = useState<string | null>(null);
  const [unlockResults, setUnlockResults] = useState<Record<string, UnlockResponse>>({});
  const [unlockErrors, setUnlockErrors] = useState<Record<string, boolean>>({});
  const fallbackResources = matchHousingResources(situation, timing, goal);
  const matchedResources = backendPlan
    ? backendPlan.interventions.flatMap(({ resources }) => resources).slice(0, 3)
    : fallbackResources;

  useEffect(() => {
    if (!backendCaseId) {
      setBackendPlan(null);
      return;
    }
    let active = true;
    void caseApi.getPlan(backendCaseId)
      .then((plan) => {
        if (active && plan.interventions.length > 0) setBackendPlan(plan);
      })
      .catch(() => {
        if (active) setBackendPlan(null);
      });
    return () => { active = false; };
  }, [backendCaseId]);

  useEffect(() => {
    if (!backendCaseId) {
      setRetentionPaths(null);
      return;
    }
    let active = true;
    void caseApi.getRetentionPaths(backendCaseId, [])
      .then(({ paths }) => {
        if (active && paths.length > 0) setRetentionPaths(paths);
      })
      .catch(() => {
        if (active) setRetentionPaths(null);
      });
    return () => { active = false; };
  }, [backendCaseId]);

  const exploreUnlock = async (pathKey: string) => {
    if (!backendCaseId) return;
    setUnlockingPath(pathKey);
    setUnlockErrors((current) => ({ ...current, [pathKey]: false }));
    try {
      const result = await caseApi.getSmallestUnlock(backendCaseId, pathKey, appliedChanges);
      setUnlockResults((current) => ({ ...current, [pathKey]: result }));
    } catch {
      setUnlockErrors((current) => ({ ...current, [pathKey]: true }));
    } finally {
      setUnlockingPath(null);
    }
  };

  const applyUnlock = async (result: UnlockResponse) => {
    if (!backendCaseId || !result.smallestUnlock) return;
    const nextChanges = Array.from(new Set([
      ...appliedChanges,
      ...result.smallestUnlock.changes.map(({ code }) => code),
    ]));
    try {
      const response = await caseApi.getRetentionPaths(backendCaseId, nextChanges);
      setAppliedChanges(nextChanges);
      setRetentionPaths(response.paths);
      setUnlockResults({});
      setUnlockErrors({});
    } catch {
      // Keep the current exploration visible if the recomputation request fails.
    }
  };

  const resetHypotheticals = async () => {
    if (!backendCaseId) return;
    try {
      const response = await caseApi.getRetentionPaths(backendCaseId, []);
      setAppliedChanges([]);
      setRetentionPaths(response.paths);
      setUnlockResults({});
      setUnlockErrors({});
    } catch {
      // The displayed paths remain usable; actual persisted facts are untouched.
    }
  };

  const explainReasons = (reasons: string[]) => {
    if (reasons.includes('PET_DEPOSIT_OR_FEE')) return 'You identified a pet deposit or fee as the immediate housing barrier.';
    if (reasons.includes('MOVING_HOUSING_SEARCH')) return 'You told us you are moving and need housing that can work for your pet.';
    if (reasons.includes('TEMPORARY_HOUSING')) return 'You told us the housing gap is temporary, so a short-term bridge ranks higher.';
    if (reasons.includes('LANDLORD_OR_PROPERTY_RESTRICTION')) return 'You want to remain in your current home, and the immediate issue involves a landlord or property restriction.';
    if (reasons.includes('BREED_OR_SIZE_RESTRICTION')) return 'You identified a breed or size policy, so clarifying the exact restriction is especially relevant.';
    if (reasons.includes('GOAL_MOVE')) return 'Your goal is to move, so pet-friendly housing search support ranks higher.';
    if (reasons.includes('GOAL_STAY')) return 'Your goal is to stay where you are, so options that address the current barrier rank higher.';
    if (reasons.includes('URGENT_CASE')) return 'Your timeline is urgent, so options that can create time rank higher.';
    return 'This action matches the housing barrier you described.';
  };

  // Deterministic natural summary builder
  const getSituationSummary = () => {
    let goalText = "You’re trying to stay where you are";
    if (goal === "Move") goalText = "You’re looking to move";
    else if (goal === "Either could work") goalText = "You’re open to staying or moving";

    let timingText = "your housing situation needs attention this week";
    if (timing === "Today or within 48 hours") timingText = "your housing situation needs attention within 48 hours";
    else if (timing === "Within a month") timingText = "your housing situation needs attention within a month";
    else if (timing === "I’m planning ahead") timingText = "you’re planning ahead for your housing situation";

    let situationText = "your landlord or property says pets aren’t allowed";
    if (situation === "I can’t afford the pet deposit or fee") situationText = "you can’t afford the pet deposit or fee";
    else if (situation === "I’m moving and struggling to find pet-friendly housing") situationText = "you’re struggling to find pet-friendly housing";
    else if (situation === "There’s a breed or size restriction") situationText = "there’s a breed or size restriction";
    else if (situation === "I’m temporarily between homes") situationText = "you’re temporarily between homes";

    return `${goalText}, ${timingText}, and ${situationText}.`;
  };

  return (
    <div className="py-8 sm:py-14 md:py-20 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto w-full">
      {/* Back to my answers */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#2D2D2D]/60 hover:text-[#2E5440] font-medium mb-6 sm:mb-8 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] rounded px-1 -ml-1"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to my answers</span>
      </button>

      {/* Page Introduction */}
      <div className="mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3C9B2]/35 border border-[#E3C9B2] text-[#2E5440] text-xs font-semibold tracking-wider uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>WE FOUND SOME OPTIONS</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          {retentionPaths ? `Possible paths to keeping ${displayName} home` : `Your Keep ${displayName} Home Plan`}
        </h1>

        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/85 leading-relaxed mb-4 text-pretty">
          Based on what you told us, here are three things worth trying before making a permanent decision.
        </p>

        {appliedChanges.length > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-[#F3E9CF]/55 border border-[#D9C58F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-[#5E4B20]">Viewing a hypothetical scenario. Your current case has not changed.</p>
            <button type="button" onClick={() => void resetHypotheticals()} className="text-sm font-semibold text-[#2E5440] underline underline-offset-4 self-start sm:self-auto">
              Reset to current situation
            </button>
          </div>
        )}

        {/* Personalized Situation Summary */}
        <div className="p-4 sm:p-5 rounded-xl bg-white/70 border border-[#A7B89F]/35 text-xs sm:text-sm text-[#2D2D2D]/80 leading-relaxed font-sans">
          <span className="font-semibold text-[#2E5440] mr-1.5">Your situation:</span>
          {getSituationSummary()}
        </div>
      </div>

      {/* Prioritized Action Plan Cards */}
      <div className="space-y-6 sm:space-y-8 mb-14 sm:mb-16">
        {retentionPaths ? retentionPaths.map((path, index) => (
          <article
            key={path.key}
            className={`p-6 sm:p-8 rounded-2xl bg-white shadow-sm ${index === 0 ? 'border-2 border-[#2E5440]' : 'border border-[#A7B89F]/45'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-xs font-semibold text-[#2D2D2D]/50 tracking-widest uppercase font-sans">
                Path {String(index + 1).padStart(2, '0')}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${path.status === 'FEASIBLE' ? 'bg-[#DDEBDD] text-[#245038]' : path.status === 'BLOCKED' ? 'bg-[#F3DEDA] text-[#7A3028]' : 'bg-[#F3E9CF] text-[#6B5420]'}`}>
                {path.status}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2E5440] font-medium leading-snug mb-2">
              {path.title}
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/80 leading-relaxed mb-5">
              {path.objective}
            </p>
            <ol className="space-y-4 mb-5">
              {path.steps.map((step, stepIndex) => (
                <li key={step.key} className="pl-4 border-l-2 border-[#A7B89F]/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 mb-1">Step {stepIndex + 1}</p>
                  <h3 className="font-serif text-lg text-[#2E5440]">{step.title}</h3>
                  <p className="text-sm text-[#2D2D2D]/75 mt-1">{step.description}</p>
                  {step.resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2E5440] underline decoration-[#A7B89F] underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440]"
                    >
                      {resource.name}<ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </li>
              ))}
            </ol>
            <details className="p-4 rounded-xl bg-[#FAF7F2] border border-[#A7B89F]/30 text-xs sm:text-sm">
              <summary className="font-semibold text-[#2E5440] cursor-pointer">Why this status?</summary>
              <p className="text-[#2D2D2D]/75 leading-relaxed mt-2">{path.statusReason}</p>
              {path.blockers.length > 0 && (
                <ul className="mt-2 space-y-1 list-disc pl-5">
                  {path.blockers.map((blocker) => <li key={`${path.key}-${blocker.field}`}>{blocker.label}</li>)}
                </ul>
              )}
            </details>
            {path.status !== 'FEASIBLE' && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={unlockingPath === path.key}
                  onClick={() => void exploreUnlock(path.key)}
                  className="border-[#2E5440] text-[#2E5440]"
                >
                  {unlockingPath === path.key ? 'Checking supported changes…' : 'What would unlock this?'}
                </Button>
                {unlockResults[path.key] && (
                  <div className="mt-4 p-4 rounded-xl bg-[#F4F0E7] border border-[#D7CCB8]">
                    <p className="text-xs font-bold tracking-wider uppercase text-[#2E5440] mb-2">Smallest Unlock</p>
                    {unlockResults[path.key].smallestUnlock ? (
                      <>
                        <ul className="space-y-2 text-sm text-[#2D2D2D]/80">
                          {unlockResults[path.key].smallestUnlock?.changes.map((change) => (
                            <li key={change.code}>
                              <span className="block">{change.label}</span>
                              <span className="block text-xs text-[#2D2D2D]/60 mt-0.5">
                                {String(change.from)} → {String(change.to)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-xs text-[#2D2D2D]/65">
                          Applying these changes would make this modeled path FEASIBLE. This does not confirm that the conditions are true.
                        </p>
                        <Button type="button" onClick={() => void applyUnlock(unlockResults[path.key]!)} className="mt-4 bg-[#2E5440] text-[#FAF7F2]">
                          Apply Changes
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-[#2D2D2D]/75">No supported unlock found with the constraints currently modeled.</p>
                    )}
                  </div>
                )}
                {unlockErrors[path.key] && (
                  <p className="mt-3 text-sm text-[#2D2D2D]/70">We couldn’t check hypothetical changes right now. Your current plan is still available.</p>
                )}
              </div>
            )}
          </article>
        )) : backendPlan ? backendPlan.interventions.map((intervention, index) => (
          <article
            key={intervention.key}
            className={`p-6 sm:p-8 rounded-2xl bg-white shadow-sm transition-all ${index === 0 ? 'border-2 border-[#2E5440]' : 'border border-[#A7B89F]/45'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase font-sans ${index === 0 ? 'bg-[#2E5440] text-[#FAF7F2]' : 'bg-[#A7B89F]/30 text-[#2E5440] border border-[#A7B89F]/50'}`}>
                {index === 0 && <ShieldCheck className="w-3.5 h-3.5" />}
                {index === 0 ? 'DO THIS FIRST' : 'TRY THIS NEXT'}
              </span>
              <span className="text-xs font-semibold text-[#2D2D2D]/50 tracking-widest uppercase font-sans">
                Step {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#2E5440] font-medium leading-snug mb-3">
              {intervention.title}
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/85 leading-relaxed mb-5">
              {intervention.description}
            </p>
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#A7B89F]/30 space-y-1 text-xs sm:text-sm">
              <span className="font-semibold text-[#2E5440] font-sans">
                {index === 0 ? 'Why this comes first:' : 'Why this may help:'}
              </span>
              <p className="text-[#2D2D2D]/75 leading-relaxed font-sans">
                {explainReasons(intervention.reasons)}
              </p>
            </div>
          </article>
        )) : <>
        {/* STEP 01 (Visually Prioritized) */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#2E5440] shadow-sm relative transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E5440] text-[#FAF7F2] text-xs font-bold tracking-wider uppercase font-sans">
              <ShieldCheck className="w-3.5 h-3.5" />
              DO THIS FIRST
            </span>
            <span className="text-xs font-semibold text-[#2E5440] tracking-widest uppercase font-sans">
              Step 01
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-[#2E5440] font-medium leading-snug mb-3">
            Understand the exact housing restriction
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/85 leading-relaxed mb-5">
            Confirm whether the barrier comes from your lease, property policy, pet fees, breed restrictions, or another requirement. Knowing the exact restriction helps determine what options may be available.
          </p>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#A7B89F]/30 space-y-1 text-xs sm:text-sm">
            <span className="font-semibold text-[#2E5440] font-sans">
              Why this comes first:
            </span>
            <p className="text-[#2D2D2D]/75 leading-relaxed font-sans">
              Before searching for a new home or making a permanent decision, make sure you know exactly what requirement is creating the problem.
            </p>
          </div>
        </div>

        {/* STEP 02 */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/85 border border-[#A7B89F]/45 shadow-sm transition-all hover:border-[#A7B89F]/80">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#A7B89F]/30 text-[#2E5440] text-xs font-semibold tracking-wider uppercase font-sans border border-[#A7B89F]/50">
              TRY THIS NEXT
            </span>
            <span className="text-xs font-semibold text-[#2D2D2D]/50 tracking-widest uppercase font-sans">
              Step 02
            </span>
          </div>

          <h2 className="font-serif text-xl sm:text-2xl text-[#2E5440] font-medium leading-snug mb-3">
            Explore housing support
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/85 leading-relaxed mb-5">
            Look for pet-friendly housing resources, deposit assistance, or organizations that support pet owners facing housing-related surrender.
          </p>

          <div className="p-4 rounded-xl bg-[#FAF7F2]/80 border border-[#A7B89F]/25 space-y-1 text-xs sm:text-sm">
            <span className="font-semibold text-[#2E5440] font-sans">
              Why it may help:
            </span>
            <p className="text-[#2D2D2D]/75 leading-relaxed font-sans">
              Knowing whether the barrier is a policy, fee, or housing search problem can help you focus on the right type of support.
            </p>
          </div>
        </div>

        {/* STEP 03 */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/85 border border-[#A7B89F]/45 shadow-sm transition-all hover:border-[#A7B89F]/80">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E3C9B2]/40 text-[#2E5440] text-xs font-semibold tracking-wider uppercase font-sans border border-[#E3C9B2]">
              CREATE A BACKUP PLAN
            </span>
            <span className="text-xs font-semibold text-[#2D2D2D]/50 tracking-widest uppercase font-sans">
              Step 03
            </span>
          </div>

          <h2 className="font-serif text-xl sm:text-2xl text-[#2E5440] font-medium leading-snug mb-3">
            Consider a temporary bridge
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/85 leading-relaxed mb-5">
            If the problem is temporary, short-term care or foster support may give you time to resolve the housing situation without immediately pursuing permanent surrender.
          </p>

          <div className="p-4 rounded-xl bg-[#FAF7F2]/80 border border-[#A7B89F]/25 space-y-1 text-xs sm:text-sm">
            <span className="font-semibold text-[#2E5440] font-sans">
              Why it may help:
            </span>
            <p className="text-[#2D2D2D]/75 leading-relaxed font-sans">
              A temporary solution can create time to work through a housing problem without immediately making a permanent placement decision.
            </p>
          </div>
        </div>
        </>}
      </div>

      {/* Resources Section */}
      <div className="mb-14 sm:mb-16 pt-6 border-t border-[#2E5440]/10">
        <div className="mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2E5440] font-normal mb-2">
            Resources that may help
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/80">
            Start with the type of support that best matches your situation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-4">
          {matchedResources.map((resource) => (
            <article key={resource.id} className="p-5 sm:p-6 rounded-xl bg-white border border-[#A7B89F]/40 flex flex-col justify-between shadow-xs">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E3C9B2]/30 text-[#2E5440] text-[11px] font-semibold tracking-wider uppercase mb-3 font-sans">
                  {resource.category.replace('-', ' ')}
                </span>
                <h3 className="font-serif text-lg sm:text-xl text-[#2E5440] font-medium mb-2">
                  {resource.name}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#2D2D2D]/75 leading-relaxed mb-3">
                  {resource.description}
                </p>
                <dl className="text-[11px] text-[#2D2D2D]/65 leading-relaxed space-y-1 mb-4">
                  <div><dt className="font-semibold inline text-[#2E5440]">Scope: </dt><dd className="inline">{resource.geographicScope}</dd></div>
                  <div><dt className="font-semibold inline text-[#2E5440]">Eligibility: </dt><dd className="inline">{resource.eligibilitySummary}</dd></div>
                  <div><dt className="font-semibold inline text-[#2E5440]">Cost: </dt><dd className="inline">{resource.costSummary}</dd></div>
                </dl>
              </div>
              <div>
                <p className="text-[11px] text-[#2D2D2D]/60 mb-3 font-sans">
                  Source: {resource.sourceName} · Verified {resource.verifiedAt}
                </p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-[#FAF7F2] hover:bg-[#E3C9B2]/30 text-[#2E5440] text-xs sm:text-sm font-semibold border border-[#A7B89F]/40 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440]"
                >
                  <span>Visit resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Safety disclaimer */}
        <p className="text-xs text-[#2D2D2D]/60 italic font-sans">
          Resource availability and eligibility can change. Verify details directly with the organization before relying on a program.
        </p>
      </div>

      {/* Final Decision Area */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white/70 border border-[#A7B89F]/40 shadow-xs space-y-5">
        <h2 className="font-serif text-xl sm:text-2xl text-[#2E5440] font-normal">
          What would you like to do next?
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button
            type="button"
            onClick={onTryPlan}
            size="lg"
            className="min-h-12 px-7 rounded-lg bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] font-medium flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E5440]"
          >
            <span>I’ll try this plan</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowOtherOptions(true)}
            size="lg"
            className="min-h-12 px-7 rounded-lg border-[#A7B89F]/60 text-[#2D2D2D] hover:bg-[#FAF7F2] hover:text-[#2E5440] font-medium cursor-pointer"
          >
            <span>I still need other options</span>
          </Button>
        </div>
      </div>

      {/* Action Dialogs */}
      <Dialog open={showOtherOptions} onOpenChange={setShowOtherOptions}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-[#FAF7F2] border-[#A7B89F]/40 p-6 sm:p-8">
          <>
              <DialogHeader className="space-y-3 text-left">
                <div className="w-10 h-10 rounded-full bg-[#E3C9B2]/40 border border-[#E3C9B2] flex items-center justify-center text-[#2E5440]">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <DialogTitle className="font-serif text-2xl text-[#2E5440] font-normal">
                  Additional Support Options
                </DialogTitle>
                <DialogDescription className="font-sans text-sm text-[#2D2D2D]/80 leading-relaxed pt-1">
                  If housing steps aren’t sufficient, our upcoming responsible rehoming guidance and local surrender counseling pathways are designed to help you navigate every option compassionately.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowOtherOptions(false)}
                  className="bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] px-5 py-2 font-medium"
                >
                  Understood
                </Button>
              </div>
          </>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HousingActionPlan;
