import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChoiceCard } from '@/components/ui/choice-card';
import AssessmentProgress from '@/components/assessment/AssessmentProgress';
import type { HousingTiming } from '@/types/assessment';

interface HousingStep2Props {
  selectedTiming: HousingTiming;
  onSelectTiming: (timing: HousingTiming) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const HousingStep2: React.FC<HousingStep2Props> = ({
  selectedTiming,
  onSelectTiming,
  onContinue,
  onBack,
}) => {
  const options: HousingTiming[] = [
    "Today or within 48 hours",
    "This week",
    "Within a month",
    "I’m planning ahead",
  ];

  const isContinueEnabled = selectedTiming !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isContinueEnabled) {
      onContinue();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-14 md:px-8 md:py-16">
      {/* Subtle Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#2D2D2D]/60 hover:text-[#2E5440] font-medium mb-6 sm:mb-8 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] rounded px-1 -ml-1"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to previous question</span>
      </button>

      {/* Progress Indicator */}
      <AssessmentProgress
        currentStep={2}
        totalSteps={3}
        label="HOUSING • STEP 2 OF 3"
      />

      {/* Screen Header */}
      <div className="mb-8 sm:mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          How soon do you need a solution?
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/80 leading-relaxed text-pretty">
          This helps us understand how urgent the situation is.
        </p>
      </div>

      {/* Options Form */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-3.5">
          {options.map((option) => {
            const isSelected = selectedTiming === option;
            return (
              <ChoiceCard
                key={option}
                name="housing-timing"
                checked={isSelected}
                onChange={() => onSelectTiming(option)}
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
              Please select an option to continue.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default HousingStep2;
