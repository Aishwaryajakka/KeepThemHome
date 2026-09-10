import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Dog, Cat, Sparkles, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { extractOwnerStory, type IntakeResult } from '@/lib/intake-api';
import type { PetType } from '@/types/assessment';

interface PetInfoScreenProps {
  petName: string;
  petType: PetType;
  onNameChange: (name: string) => void;
  onTypeSelect: (type: PetType) => void;
  onContinue: () => void;
  onBack: () => void;
  onIntakeConfirm: (result: IntakeResult) => void;
}

export const PetInfoScreen: React.FC<PetInfoScreenProps> = ({
  petName,
  petType,
  onNameChange,
  onTypeSelect,
  onContinue,
  onBack,
  onIntakeConfirm,
}) => {
  const [story, setStory] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [intakeResult, setIntakeResult] = useState<IntakeResult | null>(null);
  const [intakeFailed, setIntakeFailed] = useState(false);
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

  const handleStorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!story.trim() || isExtracting) return;
    setIsExtracting(true);
    setIntakeFailed(false);
    setIntakeResult(null);
    try {
      setIntakeResult(await extractOwnerStory(story));
    } catch {
      setIntakeFailed(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const understood = intakeResult ? [
    intakeResult.extraction.primaryBarrier && `${intakeResult.extraction.primaryBarrier[0].toUpperCase()}${intakeResult.extraction.primaryBarrier.slice(1)} issue`,
    intakeResult.extraction.behaviorConcern && `Behavior: ${intakeResult.extraction.behaviorConcern}`,
    intakeResult.extraction.costConstraint && 'Cost is a constraint',
    intakeResult.extraction.urgency && `Timeline: ${intakeResult.extraction.urgency}`,
  ].filter(Boolean) as string[] : [];

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

      <section className="mb-10 rounded-2xl border border-[#A7B89F]/40 bg-white/65 p-5 sm:p-6" aria-labelledby="story-heading">
        <h2 id="story-heading" className="font-serif text-2xl text-[#2E5440]">Tell us what’s happening</h2>
        <p className="mt-2 text-sm text-[#2D2D2D]/75">Share only what you know. We’ll use guided questions for anything missing.</p>
        <form onSubmit={handleStorySubmit} className="mt-4 space-y-4">
          <Label htmlFor="owner-story" className="sr-only">Tell us what’s happening</Label>
          <Textarea
            id="owner-story"
            value={story}
            onChange={(event) => setStory(event.target.value)}
            maxLength={3000}
            rows={4}
            placeholder="My landlord says Luna has to go because she barks..."
            className="resize-y bg-white"
          />
          <Button type="submit" disabled={!story.trim() || isExtracting} className="bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2]">
            {isExtracting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {isExtracting ? 'Understanding your situation…' : 'Find possible paths'}
          </Button>
        </form>

        {intakeFailed && (
          <div className="mt-4 rounded-lg bg-[#E3C9B2]/25 p-4" role="status">
            <p className="text-sm text-[#2D2D2D]">We couldn’t interpret that automatically. You can continue with the guided questions.</p>
          </div>
        )}

        {intakeResult && (
          <div className="mt-5 rounded-xl border border-[#A7B89F]/45 bg-[#FAF7F2] p-4" aria-live="polite">
            <h3 className="font-medium text-[#2E5440]">We understood:</h3>
            {understood.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#2D2D2D]/85">
                {understood.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[#2D2D2D]/75">We’ll confirm the important details with guided questions.</p>
            )}
            <Button type="button" onClick={() => onIntakeConfirm(intakeResult)} className="mt-4 bg-[#2E5440] hover:bg-[#244232] text-[#FAF7F2]">
              Continue with these details
            </Button>
          </div>
        )}
      </section>

      <div className="mb-7 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[#A7B89F]/40" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[#2E5440]/65">Or use guided questions</span>
        <span className="h-px flex-1 bg-[#A7B89F]/40" />
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
