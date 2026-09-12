import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BarrierType, HousingTiming, TriStateAnswer } from '@/types/assessment';
import { factorLabel } from '@/lib/presentation';

export interface DomainAnswers {
  primarySupportPossible: TriStateAnswer;
  bridgeAvailable: TriStateAnswer;
  alternativeAvailable: TriStateAnswer;
  urgency: HousingTiming;
}

interface Props {
  petName: string;
  primaryBarrier: BarrierType;
  value: DomainAnswers;
  onChange: (value: DomainAnswers) => void;
  onContinue: () => void;
  onBack: () => void;
}

const questions: Record<Exclude<BarrierType, 'housing'>, [string, string, string]> = {
  behavior: ['Could a safe management plan at home work right now?', 'Is a safe temporary separation or support option available?', 'Can you access qualified behavior or veterinary behavior support?'],
  cost: ['Could the immediate expense be reduced or spread out?', 'Is any short-term financial help available?', 'Is there an appropriate lower-cost service or care option?'],
  medical: ['Can you access appropriate veterinary care?', 'Is short-term veterinary cost support available?', 'Could transport, routine, or caregiving support reduce the treatment burden?'],
  temporary_crisis: ['Is appropriate temporary care available?', 'Could a trusted person help during this disruption?', 'Could short-term support let you and your pet remain together?'],
  time_capacity: ['Could the daily care workload be reduced?', 'Is shared or temporary caregiving available?', 'Could the care routine be changed in a workable way?'],
  circumstances: ['Could your household adapt around this change?', 'Is a temporary bridge available during the transition?', 'Is a living arrangement that includes your pet possible?'],
};

const answerOptions: Array<{ value: Exclude<TriStateAnswer, ''>; label: string }> = [
  { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Not sure' },
];
const urgencyOptions: HousingTiming[] = ['Today or within 48 hours', 'This week', 'Within a month', 'I’m planning ahead'];

export default function DomainDetailsScreen({ petName, primaryBarrier, value, onChange, onContinue, onBack }: Props) {
  const prompts = questions[primaryBarrier as Exclude<BarrierType, 'housing'>];
  const fields = ['primarySupportPossible', 'bridgeAvailable', 'alternativeAvailable'] as const;
  const complete = fields.every((field) => value[field]) && value.urgency;
  return <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-14">
    <button type="button" onClick={onBack} className="brand-focus mb-7 inline-flex items-center gap-2 rounded text-sm text-[var(--text-muted)]"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back</button>
    <p className="text-sm font-semibold uppercase tracking-wider text-[var(--forest)]">{factorLabel(primaryBarrier)} details</p>
    <h1 className="mt-3 font-serif text-4xl text-[var(--forest)] sm:text-5xl">A few details about what could help {petName.trim() || 'your pet'}</h1>
    <p className="mt-4 text-[var(--text-muted)]">Choose what is true today. “Not sure” is a valid answer and will remain visible as something to confirm.</p>
    <div className="mt-8 space-y-7">
      {fields.map((field, index) => <fieldset key={field}><legend className="text-lg font-bold text-[var(--charcoal)]">{prompts[index]}</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{answerOptions.map((option) => <label key={option.value} className={`brand-focus cursor-pointer rounded-xl border p-4 ${value[field] === option.value ? 'border-[var(--forest)] bg-[var(--sage)]/15' : 'border-[var(--border-warm)] bg-white'}`}><input type="radio" name={field} value={option.value} checked={value[field] === option.value} onChange={() => onChange({ ...value, [field]: option.value })} className="mr-3 accent-[var(--forest)]" />{option.label}</label>)}</div></fieldset>)}
      <fieldset><legend className="text-lg font-bold text-[var(--charcoal)]">How soon do you need a workable next step?</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{urgencyOptions.map((option) => <label key={option} className={`brand-focus cursor-pointer rounded-xl border p-4 ${value.urgency === option ? 'border-[var(--forest)] bg-[var(--sage)]/15' : 'border-[var(--border-warm)] bg-white'}`}><input type="radio" name="domain-urgency" checked={value.urgency === option} onChange={() => onChange({ ...value, urgency: option })} className="mr-3 accent-[var(--forest)]" />{option}</label>)}</div></fieldset>
    </div>
    <Button type="button" disabled={!complete} onClick={onContinue} className="mt-8 bg-[var(--forest)] text-white">See realistic paths</Button>
  </div>;
}
