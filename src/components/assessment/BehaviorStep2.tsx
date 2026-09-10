import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AssessmentProgress from './AssessmentProgress';
import type { BehaviorSeriousness } from '@/types/assessment';

interface BehaviorStep2Props {
  selectedSeriousness: BehaviorSeriousness;
  onSelectSeriousness: (seriousness: BehaviorSeriousness) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const BehaviorStep2: React.FC<BehaviorStep2Props> = ({
  selectedSeriousness,
  onSelectSeriousness,
  onContinue,
  onBack,
}) => {
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);

  const options: BehaviorSeriousness[] = [
    'Frustrating, but manageable',
    'It’s affecting our daily life',
    'I’m seriously considering surrender',
    'There’s an immediate safety concern',
  ];

  const handleSelectOption = (option: BehaviorSeriousness) => {
    onSelectSeriousness(option);
    if (option === 'There’s an immediate safety concern') {
      setShowSafetyNotice(true);
    }
  };

  const isContinueEnabled = selectedSeriousness !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isContinueEnabled) {
      onContinue();
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
        <span>Back to step 1</span>
      </button>

      {/* Progress Indicator */}
      <AssessmentProgress
        currentStep={2}
        totalSteps={4}
        label="BEHAVIOR • STEP 2 OF 4"
      />

      {/* Question Header */}
      <div className="mb-8 sm:mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          How serious does the situation feel?
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/80 leading-relaxed text-pretty">
          This helps us understand what kind of support may be appropriate.
        </p>
      </div>

      {/* Options Form */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-3.5">
          {options.map((option) => {
            const isSelected = selectedSeriousness === option;
            const isSafetyConcern = option === 'There’s an immediate safety concern';

            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] ${
                  isSelected
                    ? 'border-[#2E5440] bg-[#E3C9B2]/25 shadow-sm ring-1 ring-[#2E5440]'
                    : isSafetyConcern
                    ? 'border-[#A7B89F]/40 bg-white/70 hover:bg-white hover:border-[#A7B89F]/80'
                    : 'border-[#A7B89F]/35 bg-white/70 hover:bg-white hover:border-[#A7B89F]/70'
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-sans text-base sm:text-lg leading-snug ${
                      isSelected ? 'text-[#2E5440] font-medium' : 'text-[#2D2D2D]'
                    }`}
                  >
                    {option}
                  </span>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'border-[#2E5440] bg-[#2E5440] text-[#FAF7F2]'
                      : 'border-[#A7B89F]/60 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Primary CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
          <Button
            type="submit"
            disabled={!isContinueEnabled}
            size="lg"
            className="w-full sm:w-auto min-h-12 px-8 py-3.5 rounded-lg bg-[#2E5440] hover:bg-[#244232] disabled:bg-[#2E5440]/40 disabled:cursor-not-allowed text-[#FAF7F2] text-base font-medium transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E5440] focus-visible:ring-offset-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          {!isContinueEnabled && (
            <p className="text-xs text-[#2D2D2D]/60 italic font-sans">
              Please choose an option to continue.
            </p>
          )}
        </div>
      </form>

      {/* Immediate Safety Notice Dialog */}
      <Dialog open={showSafetyNotice} onOpenChange={setShowSafetyNotice}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-[#FAF7F2] border-[#A7B89F]/50 p-6 sm:p-8">
          <DialogHeader className="space-y-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#E3C9B2]/45 border border-[#E3C9B2] flex items-center justify-center text-[#2E5440]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <DialogTitle className="font-serif text-2xl text-[#2E5440] font-normal">
              Safety comes first.
            </DialogTitle>
            <DialogDescription className="font-sans text-sm sm:text-base text-[#2D2D2D]/85 leading-relaxed pt-1">
              If a person or animal may be in immediate danger, create distance where it is safe to do so and seek qualified professional help. Keep Them Home cannot assess or diagnose dangerous behavior.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setShowSafetyNotice(false)}
              className="bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] px-6 py-2.5 font-medium rounded-lg flex items-center gap-2 group cursor-pointer"
            >
              <span>I understand</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BehaviorStep2;
