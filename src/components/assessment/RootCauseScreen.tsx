import React, { useState } from 'react';
import { Activity, ArrowLeft, Compass, DollarSign, Home, Stethoscope, Timer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BarrierType } from '@/types/assessment';

interface RootCauseScreenProps {
  petName: string;
  selectedFactors: BarrierType[];
  selectedRootCause: BarrierType | '';
  onFactorsChange: (factors: BarrierType[]) => void;
  onConfirm: (primary: BarrierType) => void;
  onBack: () => void;
}

const cards: Array<{ id: BarrierType; title: string; description: string; icon: React.ReactNode }> = [
  { id: 'housing', title: 'Housing', description: 'Landlord, moving, deposit, or pet restriction.', icon: <Home className="h-5 w-5" /> },
  { id: 'cost', title: 'Money', description: 'Costs are making care or housing difficult.', icon: <DollarSign className="h-5 w-5" /> },
  { id: 'behavior', title: 'Behavior', description: 'Noise, separation, conflict, or safety concern.', icon: <Activity className="h-5 w-5" /> },
  { id: 'medical', title: 'Health / veterinary', description: 'Veterinary care or an ongoing health need.', icon: <Stethoscope className="h-5 w-5" /> },
  { id: 'temporary_crisis', title: 'Temporary crisis', description: 'A short-term disruption affecting care.', icon: <Timer className="h-5 w-5" /> },
  { id: 'time_capacity', title: 'Time or caregiving capacity', description: 'Work or caregiving leaves too little time.', icon: <Users className="h-5 w-5" /> },
  { id: 'circumstances', title: 'Family or life changes', description: 'Illness, family change, or another transition.', icon: <Compass className="h-5 w-5" /> },
];

export const RootCauseScreen: React.FC<RootCauseScreenProps> = ({ petName, selectedFactors, selectedRootCause, onFactorsChange, onConfirm, onBack }) => {
  const [choosingContributors, setChoosingContributors] = useState(Boolean(selectedRootCause));
  const [primaryChoice, setPrimaryChoice] = useState<BarrierType | ''>(selectedRootCause || (selectedFactors.length === 1 ? selectedFactors[0] : ''));
  const displayName = petName.trim() || 'your pet';

  const toggleFactor = (factor: BarrierType) => {
    const next = selectedFactors.includes(factor) ? selectedFactors.filter((value) => value !== factor) : [...selectedFactors, factor];
    onFactorsChange(next);
  };
  const continueFromPrimary = () => {
    if (!primaryChoice) return;
    onFactorsChange([primaryChoice]);
    setChoosingContributors(true);
  };

  if (choosingContributors && primaryChoice) return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-14 md:px-8 md:py-16">
      <button type="button" onClick={() => setChoosingContributors(false)} className="mb-8 inline-flex items-center gap-1.5 rounded text-sm text-[#2D2D2D]/60 focus-visible:ring-2 focus-visible:ring-[#2E5440]"><ArrowLeft className="h-4 w-4" /> Back to main pressure</button>
      <h1 className="font-serif text-3xl text-[#2E5440] sm:text-4xl">Anything else making it harder?</h1>
      <p className="mt-3 text-[#2D2D2D]/80">Choose any contributing pressures, or continue with just {cards.find(({ id }) => id === primaryChoice)?.title}.</p>
      <fieldset className="mt-8 space-y-3">
        <legend className="sr-only">Contributing pressures</legend>
        {cards.filter(({ id }) => id !== primaryChoice).map((card) => <label key={card.id} className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#A7B89F]/45 bg-white/70 p-4 focus-within:ring-2 focus-within:ring-[#2E5440]"><input type="checkbox" checked={selectedFactors.includes(card.id)} onChange={() => toggleFactor(card.id)} /><span className="font-medium text-[#2D2D2D]">{card.title}</span></label>)}
      </fieldset>
      <Button type="button" onClick={() => onConfirm(primaryChoice)} className="mt-7 bg-[#2E5440] text-[#FAF7F2]">Continue</Button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-14 md:px-8 md:py-16">
      <button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-1.5 rounded text-sm text-[#2D2D2D]/60 focus-visible:ring-2 focus-visible:ring-[#2E5440]"><ArrowLeft className="h-4 w-4" /> Back to pet information</button>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#2E5440]/80">What’s going on?</p>
      <h1 className="font-serif text-3xl text-[#2E5440] sm:text-4xl md:text-5xl">What’s the main pressure right now?</h1>
      <p className="mt-3 text-base text-[#2D2D2D]/80 sm:text-lg">Choose the issue creating the most immediate risk of giving up {displayName}.</p>
      <fieldset className="mt-8 space-y-3">
        <legend className="sr-only">Factors making it difficult to keep your pet</legend>
        {cards.map((card) => {
          const selected = primaryChoice === card.id;
          return <label key={card.id} className={`choice-card brand-focus flex min-h-20 cursor-pointer items-start gap-4 rounded-2xl border p-5 ${selected ? 'border-[#2E5440] bg-[var(--sage)]/16' : 'border-[#A7B89F]/35 bg-white/80'}`}><input type="radio" name="primary-pressure" checked={selected} onChange={() => setPrimaryChoice(card.id)} className="mt-1 h-5 w-5 accent-[#2E5440]" /><span className="pointer-events-none rounded-lg bg-[#FAF7F2] p-2.5 text-[#2E5440]">{card.icon}</span><span className="pointer-events-none flex-1"><span className="block font-serif text-lg font-medium text-[#2D2D2D]">{card.title}</span><span className="mt-1 block text-sm text-[#2D2D2D]/75">{card.description}</span></span></label>;
        })}
      </fieldset>
      <Button type="button" disabled={!primaryChoice} onClick={continueFromPrimary} className="mt-5 bg-[#2E5440] text-[#FAF7F2]">Continue</Button>
    </div>
  );
};

export default RootCauseScreen;
