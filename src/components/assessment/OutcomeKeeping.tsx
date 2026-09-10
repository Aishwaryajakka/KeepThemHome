import React from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, FileText, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OutcomeKeepingProps {
  petName: string;
  onStartAnotherCase: () => void;
  onReviewPlan: () => void;
}

export const OutcomeKeeping: React.FC<OutcomeKeepingProps> = ({
  petName,
  onStartAnotherCase,
  onReviewPlan,
}) => {
  const displayName = petName.trim() || 'Luna';

  return (
    <div className="py-12 sm:py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto w-full">
      {/* Subtle Sage Good News Badge */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#A7B89F]/30 border border-[#A7B89F]/60 text-[#2E5440] text-xs sm:text-sm font-semibold tracking-wider uppercase font-sans">
          <CheckCircle2 className="w-4 h-4 text-[#2E5440]" />
          <span>GOOD NEWS</span>
        </span>
      </div>

      {/* Main Heading & Emotional Statement */}
      <div className="mb-10 sm:mb-14">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] text-[#2E5440] font-normal leading-[1.18] tracking-tight mb-4 sm:mb-5 text-balance">
          {displayName} is staying home.
        </h1>
        <p className="font-sans text-xl sm:text-2xl text-[#2E5440] font-medium leading-relaxed mb-3">
          Thank you for letting us know.
        </p>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/85 leading-relaxed max-w-2xl text-pretty">
          Every situation is different. We’re glad you found a path that works for you and {displayName}.
        </p>
      </div>

      {/* Subtle Summary Card: Your journey */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white/85 border border-[#A7B89F]/45 shadow-xs space-y-6 mb-10 sm:mb-14">
        <div className="flex items-center gap-2 pb-3.5 border-b border-[#2E5440]/10 text-[#2E5440]">
          <Heart className="w-4 h-4 fill-[#2E5440]/20 text-[#2E5440]" />
          <h2 className="font-serif text-lg sm:text-xl font-medium">
            Your journey
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Pet
            </span>
            <p className="text-base font-medium text-[#2D2D2D]">
              {displayName}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Challenge
            </span>
            <p className="text-base font-medium text-[#2D2D2D]">
              Housing
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Plan
            </span>
            <p className="text-base font-medium text-[#2D2D2D]">
              3 steps explored
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E5440]/70 font-sans">
              Outcome
            </span>
            <p className="text-base font-semibold text-[#2E5440]">
              Staying together
            </p>
          </div>
        </div>
      </div>

      {/* Decision CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <Button
          type="button"
          onClick={onStartAnotherCase}
          size="lg"
          className="min-h-12 px-7 rounded-lg bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] text-base font-medium flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E5440]"
        >
          <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-45" />
          <span>Start another case</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onReviewPlan}
          size="lg"
          className="min-h-12 px-7 rounded-lg border-[#A7B89F]/60 text-[#2D2D2D] hover:bg-white hover:text-[#2E5440] text-base font-medium cursor-pointer flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Review my plan</span>
        </Button>
      </div>
    </div>
  );
};

export default OutcomeKeeping;
