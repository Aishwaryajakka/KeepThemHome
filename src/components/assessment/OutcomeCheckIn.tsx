import React from 'react';
import { ArrowLeft, ArrowRight, Check, Heart, HelpCircle, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OutcomeType } from '@/types/assessment';

interface OutcomeCheckInProps {
  petName: string;
  selectedOutcome: OutcomeType;
  onSelectOutcome: (outcome: OutcomeType) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const OutcomeCheckIn: React.FC<OutcomeCheckInProps> = ({
  petName,
  selectedOutcome,
  onSelectOutcome,
  onContinue,
  onBack,
}) => {
  const displayName = petName.trim() || 'your pet';

  const options: {
    id: OutcomeType;
    title: string;
    description: string;
    icon: React.ReactNode;
    isSageHighlighted?: boolean;
  }[] = [
    {
      id: 'keeping',
      title: `We’re keeping ${displayName}`,
      description: 'We found a path forward and plan to keep our pet.',
      icon: <Heart className="w-5 h-5" />,
      isSageHighlighted: true,
    },
    {
      id: 'stillTrying',
      title: 'We’re still trying',
      description: 'We’re working through the plan but still need time or support.',
      icon: <HelpCircle className="w-5 h-5" />,
    },
    {
      id: 'rehomingHelp',
      title: 'We still need rehoming help',
      description: 'Keeping our pet may not be possible and we need help understanding responsible next steps.',
      icon: <Compass className="w-5 h-5" />,
    },
  ];

  const isContinueEnabled = selectedOutcome !== '';

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
        <span>Back to my plan</span>
      </button>

      {/* Screen Header */}
      <div className="mb-8 sm:mb-10">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#2E5440] mb-2 block font-sans">
          CHECKING IN
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          How are things with {displayName}?
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/80 leading-relaxed text-pretty">
          We want to know whether the plan helped.
        </p>
      </div>

      {/* Options Form */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="space-y-4">
          {options.map((option) => {
            const isSelected = selectedOutcome === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectOutcome(option.id)}
                className={`w-full p-5 sm:p-6 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] ${
                  isSelected
                    ? 'border-[#2E5440] bg-[#E3C9B2]/25 shadow-sm ring-1 ring-[#2E5440]'
                    : option.isSageHighlighted
                    ? 'border-[#A7B89F]/50 bg-[#A7B89F]/10 hover:bg-[#A7B89F]/20 hover:border-[#A7B89F]/80'
                    : 'border-[#A7B89F]/35 bg-white/80 hover:bg-white hover:border-[#A7B89F]/70'
                }`}
                aria-pressed={isSelected}
              >
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`p-1 rounded-md ${isSelected ? 'text-[#2E5440]' : 'text-[#2E5440]/75'}`}>
                      {option.icon}
                    </span>
                    <span
                      className={`font-serif text-lg sm:text-xl leading-snug ${
                        isSelected ? 'text-[#2E5440] font-medium' : 'text-[#2D2D2D]'
                      }`}
                    >
                      {option.title}
                    </span>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-[#2D2D2D]/75 leading-relaxed pl-8">
                    {option.description}
                  </p>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
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

export default OutcomeCheckIn;
