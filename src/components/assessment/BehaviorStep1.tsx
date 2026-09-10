import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AssessmentProgress from './AssessmentProgress';
import type { BehaviorConcern } from '@/types/assessment';

interface BehaviorStep1Props {
  petName: string;
  selectedConcern: BehaviorConcern;
  onSelectConcern: (concern: BehaviorConcern) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const BehaviorStep1: React.FC<BehaviorStep1Props> = ({
  petName,
  selectedConcern,
  onSelectConcern,
  onContinue,
  onBack,
}) => {
  const displayName = petName.trim() || 'your pet';

  const options: BehaviorConcern[] = [
    'Barking or excessive noise',
    'Destructive behavior',
    'House-training problems',
    'Separation-related behavior',
    'Leash or walking problems',
    'Conflict with another animal',
    'Growling, biting, or aggression',
  ];

  const isContinueEnabled = selectedConcern !== '';

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
        <span>Back to challenges</span>
      </button>

      {/* Progress Indicator */}
      <AssessmentProgress
        currentStep={1}
        totalSteps={4}
        label="BEHAVIOR • STEP 1 OF 4"
      />

      {/* Question Header */}
      <div className="mb-8 sm:mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          What behavior is making things difficult with {displayName}?
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/80 leading-relaxed text-pretty">
          Choose the issue that feels most important right now.
        </p>
      </div>

      {/* Options Form */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-3.5">
          {options.map((option) => {
            const isSelected = selectedConcern === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onSelectConcern(option)}
                className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] ${
                  isSelected
                    ? 'border-[#2E5440] bg-[#E3C9B2]/25 shadow-sm ring-1 ring-[#2E5440]'
                    : 'border-[#A7B89F]/35 bg-white/70 hover:bg-white hover:border-[#A7B89F]/70'
                }`}
                aria-pressed={isSelected}
              >
                <span
                  className={`font-sans text-base sm:text-lg leading-snug ${
                    isSelected ? 'text-[#2E5440] font-medium' : 'text-[#2D2D2D]'
                  }`}
                >
                  {option}
                </span>

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
    </div>
  );
};

export default BehaviorStep1;
