import React from 'react';
import { ArrowRight, FileText, Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OutcomeStillTryingProps {
  onReviewPlan: () => void;
  onExploreOtherOptions: () => void;
}

export const OutcomeStillTrying: React.FC<OutcomeStillTryingProps> = ({
  onReviewPlan,
  onExploreOtherOptions,
}) => {
  return (
    <div className="py-10 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto w-full">
      {/* Label */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3C9B2]/40 border border-[#E3C9B2] text-[#2E5440] text-xs font-semibold tracking-wider uppercase font-sans">
          <Sparkles className="w-3.5 h-3.5" />
          <span>KEEP GOING</span>
        </span>
      </div>

      {/* Main Heading */}
      <div className="mb-8 sm:mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          Let’s keep working on it.
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/80 leading-relaxed text-pretty">
          Keep working from the current plan. You can revisit unresolved blockers, active actions, resources, or another path.
        </p>
      </div>

      {/* Context Box */}
      <div className="p-6 rounded-2xl bg-white/70 border border-[#A7B89F]/35 shadow-xs mb-10 text-sm text-[#2D2D2D]/80 leading-relaxed font-sans space-y-2">
        <p className="font-medium text-[#2E5440]">Suggestions to keep momentum:</p>
        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-1">
          <li>Re-check the exact details of the housing restriction with your property manager.</li>
          <li>Reach out to deposit assistance or pet-friendly directory listings.</li>
          <li>Consider whether other challenges (cost, medical, behavior) are also contributing.</li>
        </ul>
      </div>

      {/* Decision CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <Button
          type="button"
          onClick={onReviewPlan}
          size="lg"
          className="min-h-12 px-7 rounded-lg bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] font-medium flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E5440]"
        >
          <FileText className="w-4 h-4" />
          <span>Review my plan</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onExploreOtherOptions}
          size="lg"
          className="min-h-12 px-7 rounded-lg border-[#A7B89F]/60 text-[#2D2D2D] hover:bg-white hover:text-[#2E5440] font-medium cursor-pointer flex items-center justify-center gap-2 group"
        >
          <Compass className="w-4 h-4 transition-transform group-hover:rotate-45" />
          <span>Explore other options</span>
        </Button>
      </div>
    </div>
  );
};

export default OutcomeStillTrying;
