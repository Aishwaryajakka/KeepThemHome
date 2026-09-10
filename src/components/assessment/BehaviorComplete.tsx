import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  BehaviorConcern,
  BehaviorSeriousness,
  BehaviorTried,
  BehaviorBarrier,
  BarrierType,
} from '@/types/assessment';

interface BehaviorCompleteProps {
  petName: string;
  concern: BehaviorConcern;
  concerns?: Exclude<BehaviorConcern, ''>[];
  contributingBarriers?: BarrierType[];
  costConstraint?: string;
  seriousness: BehaviorSeriousness;
  tried: BehaviorTried;
  barrier: BehaviorBarrier;
  onContinue?: () => void;
  onBack: () => void;
  onRestart: () => void;
}

export const BehaviorComplete: React.FC<BehaviorCompleteProps> = ({
  petName,
  concern,
  concerns = concern ? [concern] : [],
  contributingBarriers = [],
  costConstraint = '',
  seriousness,
  tried,
  barrier,
  onContinue,
  onBack,
  onRestart,
}) => {
  const displayName = petName.trim() || 'your pet';
  const [showPlanModal, setShowPlanModal] = useState(false);

  const handleContinueClick = () => {
    if (onContinue) {
      onContinue();
    } else {
      setShowPlanModal(true);
    }
  };

  return (
    <div className="py-8 sm:py-14 md:py-20 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto w-full">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#2D2D2D]/60 hover:text-[#2E5440] font-medium mb-6 sm:mb-8 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] rounded px-1 -ml-1"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to my answers</span>
      </button>

      {/* Screen Header */}
      <div className="mb-8 sm:mb-10">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#2E5440] mb-2 block font-sans">
          ASSESSMENT COMPLETE
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          We’re putting together a plan for {displayName}.
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/80 leading-relaxed text-pretty">
          We’ll use what you told us to focus on the most relevant next steps.
        </p>
      </div>

      {/* Assessment Summary Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white/80 border border-[#A7B89F]/40 shadow-xs space-y-6 mb-8 sm:mb-10">
        <div className="flex items-center gap-2 pb-3 border-b border-[#2E5440]/10 text-[#2E5440]">
          <CheckCircle2 className="w-5 h-5" />
          <h2 className="font-serif text-lg sm:text-xl font-medium">
            Assessment summary
          </h2>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-5">
          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Primary challenge
            </dt>
            <dd className="text-sm sm:text-base font-medium text-[#2D2D2D]">
              Behavior
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Main concern
            </dt>
            <dd className="text-sm sm:text-base font-medium text-[#2D2D2D]">
              {concerns.join(', ') || 'Not specified'}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Seriousness
            </dt>
            <dd className="text-sm sm:text-base font-medium text-[#2D2D2D]">
              {seriousness || 'Not specified'}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Already tried
            </dt>
            <dd className="text-sm sm:text-base font-medium text-[#2D2D2D]">
              {tried || 'Not specified'}
            </dd>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Barrier to help
            </dt>
            <dd className="text-sm sm:text-base font-medium text-[#2D2D2D]">
              {barrier || 'Not specified'}
            </dd>
          </div>

          {contributingBarriers.length > 0 && (
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">Also affecting the situation</dt>
              <dd className="text-sm sm:text-base font-medium text-[#2D2D2D]">{contributingBarriers.join(', ')}</dd>
            </div>
          )}

          {costConstraint && (
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">Cost constraint</dt>
              <dd className="text-sm sm:text-base font-medium text-[#2D2D2D]">{costConstraint}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Primary CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <Button
          type="button"
          onClick={handleContinueClick}
          size="lg"
          className="min-h-12 px-8 py-3.5 rounded-lg bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] text-base font-medium transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E5440]"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onRestart}
          size="lg"
          className="min-h-12 px-6 py-3.5 rounded-lg border-[#A7B89F]/60 text-[#2D2D2D] hover:bg-white hover:text-[#2E5440] text-base font-medium transition-all cursor-pointer"
        >
          Start another case
        </Button>
      </div>

      {/* Plan Coming Soon Dialog */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-[#FAF7F2] border-[#A7B89F]/40 p-6 sm:p-8">
          <DialogHeader className="space-y-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#E3C9B2]/40 border border-[#E3C9B2] flex items-center justify-center text-[#2E5440]">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="font-serif text-2xl text-[#2E5440] font-normal">
              Behavior Action Plan in Progress
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-[#2D2D2D]/80 leading-relaxed pt-1">
              Your assessment answers for {displayName} have been organized. Personalized step-by-step action plans for behavior challenges will be released in the next update.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setShowPlanModal(false)}
              className="bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] px-5 py-2 font-medium"
            >
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BehaviorComplete;
