import React, { useState } from 'react';
import { Activity, AlertCircle, ArrowLeft, Check, Compass, DollarSign, Home, Stethoscope, Timer, Users } from 'lucide-react';
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

const cards: Array<{ id: BarrierType; title: string; description: string; icon: React.ReactNode; deepSupport: boolean }> = [
  { id: 'housing', title: 'Housing', description: 'Landlord, moving, deposits, or pet restrictions.', icon: <Home className="h-5 w-5" />, deepSupport: true },
  { id: 'cost', title: 'Money / financial strain', description: 'Behavior help, deposits, veterinary care, moving, or general costs.', icon: <DollarSign className="h-5 w-5" />, deepSupport: false },
  { id: 'behavior', title: 'Behavior', description: 'Noise, destruction, separation, conflict, or safety concerns.', icon: <Activity className="h-5 w-5" />, deepSupport: true },
  { id: 'medical', title: 'Veterinary / pet health', description: 'Veterinary costs or ongoing care needs.', icon: <Stethoscope className="h-5 w-5" />, deepSupport: false },
  { id: 'temporary_crisis', title: 'Temporary crisis', description: 'A short-term disruption affecting care or housing.', icon: <Timer className="h-5 w-5" />, deepSupport: false },
  { id: 'time_capacity', title: 'Time / capacity', description: 'Work, caregiving, or limited time for pet care.', icon: <Users className="h-5 w-5" />, deepSupport: false },
  { id: 'circumstances', title: 'Family / life change', description: 'Illness, family changes, or another life transition.', icon: <Compass className="h-5 w-5" />, deepSupport: false },
];

export const RootCauseScreen: React.FC<RootCauseScreenProps> = ({ petName, selectedFactors, selectedRootCause, onFactorsChange, onConfirm, onBack }) => {
  const [choosingPrimary, setChoosingPrimary] = useState(false);
  const [primaryChoice, setPrimaryChoice] = useState<BarrierType | ''>(selectedRootCause && selectedFactors.includes(selectedRootCause) ? selectedRootCause : '');
  const displayName = petName.trim() || 'your pet';

  const toggleFactor = (factor: BarrierType) => {
    const next = selectedFactors.includes(factor) ? selectedFactors.filter((value) => value !== factor) : [...selectedFactors, factor];
    onFactorsChange(next);
    if (primaryChoice && !next.includes(primaryChoice)) setPrimaryChoice('');
  };
  const continueFromFactors = () => {
    if (selectedFactors.length === 1) return onConfirm(selectedFactors[0]);
    if (selectedRootCause && selectedFactors.includes(selectedRootCause)) return onConfirm(selectedRootCause);
    setChoosingPrimary(true);
  };

  if (choosingPrimary) return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-14 md:px-8 md:py-20">
      <button type="button" onClick={() => setChoosingPrimary(false)} className="mb-8 inline-flex items-center gap-1.5 rounded text-sm text-[#2D2D2D]/60 focus-visible:ring-2 focus-visible:ring-[#2E5440]"><ArrowLeft className="h-4 w-4" /> Back to selected factors</button>
      <h1 className="font-serif text-3xl text-[#2E5440] sm:text-4xl">Which is creating the most immediate risk of giving up {displayName}?</h1>
      <p className="mt-3 text-[#2D2D2D]/80">Choose one primary issue. The others will remain contributing factors.</p>
      <fieldset className="mt-8 space-y-3">
        <legend className="sr-only">Primary issue</legend>
        {selectedFactors.map((factor) => {
          const card = cards.find(({ id }) => id === factor)!;
          return <label key={factor} className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#A7B89F]/45 bg-white/70 p-4 focus-within:ring-2 focus-within:ring-[#2E5440]"><input type="radio" name="primary-factor" checked={primaryChoice === factor} onChange={() => setPrimaryChoice(factor)} /><span className="font-medium text-[#2D2D2D]">{card.title}</span></label>;
        })}
      </fieldset>
      <Button type="button" disabled={!primaryChoice} onClick={() => primaryChoice && onConfirm(primaryChoice)} className="mt-7 bg-[#2E5440] text-[#FAF7F2]">Continue</Button>
    </div>
  );

  const unsupportedPrimary = selectedRootCause ? cards.find(({ id }) => id === selectedRootCause)?.deepSupport === false : false;
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-14 md:px-8 md:py-20">
      <button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-1.5 rounded text-sm text-[#2D2D2D]/60 focus-visible:ring-2 focus-visible:ring-[#2E5440]"><ArrowLeft className="h-4 w-4" /> Back to pet information</button>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#2E5440]/80">What’s going on?</p>
      <h1 className="font-serif text-3xl text-[#2E5440] sm:text-4xl md:text-5xl">What’s making it difficult to keep {displayName}?</h1>
      <p className="mt-3 text-base text-[#2D2D2D]/80 sm:text-lg">Select all that apply. You can change these choices before continuing.</p>
      {unsupportedPrimary && <div className="mt-6 flex gap-3 rounded-xl border border-[#E3C9B2] bg-[#FAF7F2] p-5" role="status"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#2E5440]" /><p className="text-sm text-[#2D2D2D]/75">This factor will be saved as case context, but its deeper support pathway is still being built.</p></div>}
      <fieldset className="mt-8 space-y-3">
        <legend className="sr-only">Factors making it difficult to keep your pet</legend>
        {cards.map((card) => {
          const selected = selectedFactors.includes(card.id);
          return <label key={card.id} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 focus-within:ring-2 focus-within:ring-[#2E5440] ${selected ? 'border-[#2E5440] bg-[#E3C9B2]/25' : 'border-[#A7B89F]/35 bg-white/70'}`}><input type="checkbox" checked={selected} onChange={() => toggleFactor(card.id)} className="mt-1 h-5 w-5 accent-[#2E5440]" /><span className="rounded-lg bg-[#FAF7F2] p-2.5 text-[#2E5440]">{card.icon}</span><span className="flex-1"><span className="block font-serif text-lg font-medium text-[#2D2D2D]">{card.title}</span><span className="mt-1 block text-sm text-[#2D2D2D]/75">{card.description}</span></span>{selected && <Check className="mt-1 h-5 w-5 text-[#2E5440]" aria-hidden="true" />}</label>;
        })}
      </fieldset>
      <p className="mt-5 text-sm text-[#2D2D2D]/65" aria-live="polite">You selected {selectedFactors.length} {selectedFactors.length === 1 ? 'factor' : 'factors'}.</p>
      <Button type="button" disabled={selectedFactors.length === 0} onClick={continueFromFactors} className="mt-5 bg-[#2E5440] text-[#FAF7F2]">Continue</Button>
    </div>
  );
};

export default RootCauseScreen;
