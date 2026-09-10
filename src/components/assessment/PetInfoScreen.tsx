import React from 'react';
import { ArrowRight, ArrowLeft, Dog, Cat, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PetType } from '@/types/assessment';

interface PetInfoScreenProps {
  petName: string;
  petType: PetType;
  onNameChange: (name: string) => void;
  onTypeSelect: (type: PetType) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const PetInfoScreen: React.FC<PetInfoScreenProps> = ({
  petName,
  petType,
  onNameChange,
  onTypeSelect,
  onContinue,
  onBack,
}) => {
  const isContinueEnabled = petName.trim().length > 0 && petType !== '';

  const petTypeOptions: { type: PetType; label: string; icon: React.ReactNode }[] = [
    {
      type: 'dog',
      label: 'Dog',
      icon: <Dog className="w-5 h-5" />,
    },
    {
      type: 'cat',
      label: 'Cat',
      icon: <Cat className="w-5 h-5" />,
    },
    {
      type: 'other',
      label: 'Other',
      icon: <Sparkles className="w-5 h-5" />,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isContinueEnabled) {
      onContinue();
    }
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
        <span>Back to homepage</span>
      </button>

      {/* Screen Header */}
      <div className="mb-8 sm:mb-10">
        <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#2E5440]/80 mb-3 font-sans">
          LET’S START
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2E5440] font-normal leading-tight tracking-tight mb-3 sm:mb-4 text-balance">
          First, who are we helping?
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#2D2D2D]/80 leading-relaxed text-pretty">
          Tell us a little about your pet so we can personalize the experience.
        </p>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
        {/* Pet Name Input */}
        <div className="space-y-2.5">
          <Label htmlFor="pet-name" className="text-sm sm:text-base font-medium text-[#2D2D2D]">
            Pet name <span className="text-[#2E5440]">*</span>
          </Label>
          <Input
            id="pet-name"
            type="text"
            value={petName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Luna"
            required
            className="w-full h-12 px-4 rounded-lg bg-white/80 border-[#A7B89F]/50 focus:border-[#2E5440] focus:ring-1 focus:ring-[#2E5440] text-base text-[#2D2D2D] placeholder:text-[#2D2D2D]/40 transition-colors shadow-sm"
          />
        </div>

        {/* Pet Type Selectable Cards */}
        <div className="space-y-3">
          <Label className="text-sm sm:text-base font-medium text-[#2D2D2D]">
            Pet type <span className="text-[#2E5440]">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {petTypeOptions.map((option) => {
              const isSelected = petType === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => onTypeSelect(option.type)}
                  className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl border text-center transition-all cursor-pointer min-h-[96px] sm:min-h-[110px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5440] ${
                    isSelected
                      ? 'border-[#2E5440] bg-[#E3C9B2]/25 shadow-sm ring-1 ring-[#2E5440]'
                      : 'border-[#A7B89F]/35 bg-white/60 hover:bg-white/90 hover:border-[#A7B89F]/70'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div
                    className={`p-2 rounded-full mb-2 transition-colors ${
                      isSelected
                        ? 'bg-[#2E5440] text-[#FAF7F2]'
                        : 'bg-[#FAF7F2] text-[#2E5440]/80'
                    }`}
                  >
                    {option.icon}
                  </div>
                  <span
                    className={`text-sm sm:text-base font-medium ${
                      isSelected ? 'text-[#2E5440] font-semibold' : 'text-[#2D2D2D]'
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary CTA */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
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
              Please enter a pet name and select a pet type to proceed.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default PetInfoScreen;
