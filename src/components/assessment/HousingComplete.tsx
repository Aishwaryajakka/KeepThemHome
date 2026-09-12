import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { BarrierType, BehaviorBarrier, BehaviorConcern, HousingSituation, HousingTiming, HousingGoal } from '@/types/assessment';
import { factorLabel } from '@/lib/presentation';

interface HousingCompleteProps {
  petName: string;
  situation: HousingSituation;
  timing: HousingTiming;
  goal: HousingGoal;
  contributingBarriers?: BarrierType[];
  behaviorConcerns?: Exclude<BehaviorConcern, ''>[];
  behaviorHelpBarrier?: BehaviorBarrier;
  costConstraint?: string;
  onContinue: () => void;
  onBack: () => void;
  onRestart?: () => void;
}

export const HousingComplete: React.FC<HousingCompleteProps> = ({
  petName,
  situation,
  timing,
  goal,
  contributingBarriers = [],
  behaviorConcerns = [],
  behaviorHelpBarrier = '',
  costConstraint = '',
  onContinue,
  onBack,
  onRestart,
}) => {
  const displayName = petName.trim() || 'your pet';
  return (
    <div className="py-8 sm:py-14 md:py-20 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto w-full">
      {/* Subtle Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#2D2D2D]/60 hover:text-[#2E5440] font-medium mb-8 sm:mb-10 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] rounded px-1 -ml-1"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to previous question</span>
      </button>

      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3C9B2]/35 border border-[#E3C9B2] text-[#2E5440] text-xs font-semibold tracking-wider uppercase mb-4">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Assessment complete</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          We have enough to evaluate {displayName}’s options.
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/80 leading-relaxed text-pretty">
          We’re comparing the paths that fit what you told us. Next, you’ll see what is possible now, what is blocked, and what could make another path work.
        </p>
      </div>

      {/* Summary Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white/80 border border-[#A7B89F]/40 shadow-sm space-y-6 mb-8 sm:mb-10">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#2E5440]/10">
          <FileText className="w-5 h-5 text-[#2E5440]" />
          <h2 className="font-serif text-lg sm:text-xl text-[#2E5440] font-medium">
            Case Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Primary challenge
            </span>
            <p className="text-base font-medium text-[#2D2D2D]">
              Housing
            </p>
          </div>

          {contributingBarriers.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">Also affecting the situation</span>
              <p className="text-base font-medium text-[#2D2D2D]">{contributingBarriers.map(factorLabel).join(', ')}</p>
            </div>
          )}

          {behaviorConcerns.length > 0 && (
            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">Behavior</span>
              <p className="text-base font-medium text-[#2D2D2D]">{behaviorConcerns.join(', ')}</p>
            </div>
          )}

          {(behaviorHelpBarrier || costConstraint) && (
            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">Constraint</span>
              <p className="text-base font-medium text-[#2D2D2D]">{costConstraint || behaviorHelpBarrier}</p>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Timing
            </span>
            <p className="text-base font-medium text-[#2D2D2D]">
              {timing || 'Not specified'}
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Situation
            </span>
            <p className="text-base font-medium text-[#2D2D2D] leading-relaxed">
              {situation || 'Not specified'}
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Goal
            </span>
            <p className="text-base font-medium text-[#2D2D2D]">
              {goal || 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Primary CTA & Next Action */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button
          onClick={onContinue}
          size="lg"
          className="w-full sm:w-auto min-h-12 px-8 py-3.5 rounded-lg bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] text-base font-medium transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E5440] focus-visible:ring-offset-2"
        >
          <span>Open decision workspace</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>

        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="text-xs sm:text-sm text-[#2D2D2D]/60 hover:text-[#2E5440] font-medium transition-colors cursor-pointer"
          >
            Start another assessment
          </button>
        )}
      </div>
    </div>
  );
};

export default HousingComplete;
