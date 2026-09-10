import React from 'react';
import { ArrowLeft, Home, Activity, DollarSign, Stethoscope, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RootCauseType } from '@/types/assessment';

interface RootCauseScreenProps {
  petName: string;
  selectedRootCause: RootCauseType;
  onSelectRootCause: (cause: RootCauseType) => void;
  onBack: () => void;
}

export const RootCauseScreen: React.FC<RootCauseScreenProps> = ({
  petName,
  selectedRootCause,
  onSelectRootCause,
  onBack,
}) => {
  const displayName = petName.trim() || 'your pet';

  const cards: {
    id: RootCauseType;
    title: string;
    description: string;
    icon: React.ReactNode;
    isFunctionalPathway: boolean;
  }[] = [
    {
      id: 'housing',
      title: 'HOUSING',
      description: 'Landlord, moving, deposits, or pet restrictions.',
      icon: <Home className="w-5 h-5" />,
      isFunctionalPathway: true,
    },
    {
      id: 'behavior',
      title: 'BEHAVIOR',
      description: 'Barking, destruction, separation, conflict, or other behavior challenges.',
      icon: <Activity className="w-5 h-5" />,
      isFunctionalPathway: true,
    },
    {
      id: 'cost',
      title: 'COST',
      description: 'Food, supplies, or unexpected expenses.',
      icon: <DollarSign className="w-5 h-5" />,
      isFunctionalPathway: false,
    },
    {
      id: 'medical',
      title: 'MEDICAL CARE',
      description: 'Veterinary costs or ongoing care needs.',
      icon: <Stethoscope className="w-5 h-5" />,
      isFunctionalPathway: false,
    },
    {
      id: 'circumstances',
      title: 'LIFE CIRCUMSTANCES',
      description: 'Moving, illness, family changes, or temporary hardship.',
      icon: <Compass className="w-5 h-5" />,
      isFunctionalPathway: false,
    },
  ];

  // Check if a non-functional category is currently active
  const isBuildingPathway =
    selectedRootCause === 'cost' ||
    selectedRootCause === 'medical' ||
    selectedRootCause === 'circumstances';

  const handleCardClick = (id: RootCauseType) => {
    onSelectRootCause(id);
  };

  const handleResetChallenge = () => {
    onSelectRootCause('');
  };

  return (
    <div className="py-8 sm:py-14 md:py-20 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto w-full">
      {/* Subtle Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#2D2D2D]/60 hover:text-[#2E5440] font-medium mb-8 sm:mb-10 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] rounded px-1 -ml-1"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to pet information</span>
      </button>

      {/* Screen Header */}
      <div className="mb-8 sm:mb-10">
        <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#2E5440]/80 mb-3 font-sans">
          WHAT’S GOING ON?
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          What’s making it hard to keep {displayName}?
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/80 leading-relaxed text-pretty">
          Choose the challenge that feels most important right now.
        </p>
      </div>

      {/* Supportive Message for Building Pathways */}
      {isBuildingPathway && (
        <div className="mb-8 p-5 sm:p-6 rounded-xl bg-[#FAF7F2] border border-[#E3C9B2] shadow-sm animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#2E5440] shrink-0 mt-0.5" />
            <div>
              <p className="font-serif text-lg font-medium text-[#2E5440] mb-1">
                We’re still building this support pathway.
              </p>
              <p className="font-sans text-sm text-[#2D2D2D]/75 leading-relaxed text-pretty">
                Full resources for this challenge are currently being compiled. You can choose another challenge or check back soon.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleResetChallenge}
            className="shrink-0 border-[#2E5440] text-[#2E5440] hover:bg-[#2E5440] hover:text-[#FAF7F2] text-xs sm:text-sm font-medium flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Choose another challenge</span>
          </Button>
        </div>
      )}

      {/* 5 Selectable Cards */}
      <div className="space-y-3.5 sm:space-y-4">
        {cards.map((card) => {
          const isSelected = selectedRootCause === card.id;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card.id)}
              className={`w-full p-5 sm:p-6 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-4 sm:gap-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] ${
                isSelected
                  ? 'border-[#2E5440] bg-[#E3C9B2]/25 shadow-sm ring-1 ring-[#2E5440]'
                  : 'border-[#A7B89F]/35 bg-white/70 hover:bg-white hover:border-[#A7B89F]/70'
              }`}
              aria-pressed={isSelected}
            >
              <div
                className={`p-2.5 sm:p-3 rounded-lg shrink-0 transition-colors mt-0.5 ${
                  isSelected
                    ? 'bg-[#2E5440] text-[#FAF7F2]'
                    : 'bg-[#FAF7F2] text-[#2E5440]'
                }`}
              >
                {card.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3
                    className={`font-serif text-base sm:text-lg font-medium tracking-wide ${
                      isSelected ? 'text-[#2E5440] font-semibold' : 'text-[#2D2D2D]'
                    }`}
                  >
                    {card.title}
                  </h3>
                  {isSelected && (
                    <span className="text-xs font-sans font-medium px-2.5 py-0.5 rounded-full bg-[#2E5440] text-[#FAF7F2]">
                      Selected
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm sm:text-base text-[#2D2D2D]/75 leading-relaxed text-pretty">
                  {card.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Housing & Behavior Pathway note */}
      {(selectedRootCause === 'housing' || selectedRootCause === 'behavior') && (
        <div className="mt-8 p-4 rounded-lg bg-white/80 border border-[#A7B89F]/40 text-xs sm:text-sm text-[#2D2D2D]/70 animate-fade-in flex items-center justify-between">
          <span>
            Selected pathway: <strong className="text-[#2E5440] uppercase">{selectedRootCause}</strong>
          </span>
          <button
            type="button"
            onClick={handleResetChallenge}
            className="text-xs text-[#2E5440] underline hover:text-[#244232] font-medium ml-3 cursor-pointer"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
};

export default RootCauseScreen;
