import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChoiceCard } from '@/components/ui/choice-card';
import AssessmentProgress from './AssessmentProgress';
import { BEHAVIOR_CONCERN_OPTIONS, type BehaviorConcern } from '@/types/assessment';

interface BehaviorStep1Props {
  petName: string;
  selectedConcerns: Exclude<BehaviorConcern, ''>[];
  onToggleConcern: (concern: Exclude<BehaviorConcern, ''>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const BehaviorStep1: React.FC<BehaviorStep1Props> = ({
  petName,
  selectedConcerns,
  onToggleConcern,
  onContinue,
  onBack,
}) => {
  const displayName = petName.trim() || 'your pet';

  const options = BEHAVIOR_CONCERN_OPTIONS;

  const isContinueEnabled = selectedConcerns.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isContinueEnabled) {
      onContinue();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-14 md:px-8 md:py-16">
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
          Select all that apply.
        </p>
      </div>

      {/* Options Form */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-3.5">
          {options.map((option) => {
            const isSelected = selectedConcerns.includes(option);
            return (
              <ChoiceCard
                key={option}
                type="checkbox"
                name="behavior-concerns"
                checked={isSelected}
                onChange={() => onToggleConcern(option)}
              >
                {option}
              </ChoiceCard>
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
