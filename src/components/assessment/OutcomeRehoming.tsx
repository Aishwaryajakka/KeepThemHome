import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, HeartHandshake, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OutcomeRehomingProps {
  petName: string;
  onExploreRehoming?: () => void;
  onReturnToPlan: () => void;
}

export const OutcomeRehoming: React.FC<OutcomeRehomingProps> = ({
  petName,
  onExploreRehoming,
  onReturnToPlan,
}) => {
  const displayName = petName.trim() || 'Luna';
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExploreClick = () => {
    if (onExploreRehoming) {
      onExploreRehoming();
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <div className="py-10 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto w-full">
      {/* Label */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3C9B2]/40 border border-[#E3C9B2] text-[#2E5440] text-xs font-semibold tracking-wider uppercase font-sans">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>OTHER OPTIONS</span>
        </span>
      </div>

      {/* Main Heading */}
      <div className="mb-8 sm:mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          Sometimes keeping a pet at home still isn’t possible.
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/85 leading-relaxed mb-4 text-pretty">
          We can help you think through a safer next step for {displayName} without judgment.
        </p>
        <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/70 leading-relaxed italic">
          Choosing to explore responsible rehoming does not erase the effort you’ve already made.
        </p>
      </div>

      {/* Rehoming Guidance Note */}
      <div className="p-6 rounded-2xl bg-white/70 border border-[#A7B89F]/35 shadow-xs mb-10 text-xs sm:text-sm text-[#2D2D2D]/80 leading-relaxed font-sans space-y-2">
        <p className="font-medium text-[#2E5440]">Principles of responsible rehoming:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-1 text-[#2D2D2D]/75">
          <li>Direct-to-adopter placement avoids the stress of shelter intake when time permits.</li>
          <li>Transparent medical and behavioral history helps find a sustainable long-term match.</li>
          <li>Regional surrender counseling can provide temporary safety nets before making final transfers.</li>
        </ul>
      </div>

      {/* Decision CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <Button
          type="button"
          onClick={handleExploreClick}
          size="lg"
          className="min-h-12 px-7 rounded-lg bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] font-medium flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E5440]"
        >
          <span>Explore responsible rehoming</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onReturnToPlan}
          size="lg"
          className="min-h-12 px-7 rounded-lg border-[#A7B89F]/60 text-[#2D2D2D] hover:bg-white hover:text-[#2E5440] font-medium cursor-pointer"
        >
          <span>Return to my plan</span>
        </Button>
      </div>

      {/* Rehoming Pathway Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-[#FAF7F2] border-[#A7B89F]/40 p-6 sm:p-8">
          <DialogHeader className="space-y-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#E3C9B2]/40 border border-[#E3C9B2] flex items-center justify-center text-[#2E5440]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <DialogTitle className="font-serif text-2xl text-[#2E5440] font-normal">
              Responsible Rehoming Pathway
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-[#2D2D2D]/80 leading-relaxed pt-1">
              The guided responsible rehoming toolkit — including pet profile templates, adoption agreement guidelines, and shelter surrender navigation — will be unlocked in the next release step.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setIsModalOpen(false)}
              className="bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2] px-5 py-2 font-medium"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OutcomeRehoming;
