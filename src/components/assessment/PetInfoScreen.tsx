import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Cat, Dog, LoaderCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChoiceCard } from '@/components/ui/choice-card';
import { extractOwnerStory, type IntakeResult } from '@/lib/intake-api';
import type { HousingGoal, PetType } from '@/types/assessment';

interface PetInfoScreenProps {
  petName: string;
  petType: PetType;
  demoStory?: string;
  demoFallback?: IntakeResult;
  onNameChange: (name: string) => void;
  onTypeSelect: (type: PetType) => void;
  onContinue: () => void;
  onBack: () => void;
  onIntakeConfirm: (result: IntakeResult, goal?: HousingGoal) => void;
}

const goalOptions: { value: Exclude<HousingGoal, ''>; label: string }[] = [
  { value: 'Stay where I am', label: 'I need to stay in my current home' },
  { value: 'Move', label: 'I’m open to moving with my pet' },
  { value: 'Either could work', label: 'I’m open to either' },
];

const factRows = (result: IntakeResult) => {
  const { extraction } = result;
  return [
    extraction.primaryBarrier === 'housing' ? 'Housing pressure' : extraction.primaryBarrier ? `${extraction.primaryBarrier[0].toUpperCase()}${extraction.primaryBarrier.slice(1)} pressure` : null,
    extraction.behaviorConcern === 'Barking or excessive noise' ? 'Barking while you’re away' : extraction.behaviorConcern,
    extraction.costConstraint ? 'Cost is limiting training options' : null,
    extraction.urgency === 'This week' ? 'Urgent — about 7 days' : extraction.urgency ? `Timeline — ${extraction.urgency}` : null,
  ].filter((value): value is string => Boolean(value));
};

export const PetInfoScreen: React.FC<PetInfoScreenProps> = ({
  petName, petType, demoStory, demoFallback, onNameChange, onTypeSelect, onContinue, onBack, onIntakeConfirm,
}) => {
  const [story, setStory] = useState(demoStory ?? '');
  const [isExtracting, setIsExtracting] = useState(false);
  const [intakeResult, setIntakeResult] = useState<IntakeResult | null>(null);
  const [intakeFailed, setIntakeFailed] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [goal, setGoal] = useState<HousingGoal>('');
  const [showDemoIntro, setShowDemoIntro] = useState(Boolean(demoStory));
  const isContinueEnabled = petName.trim().length > 0 && petType !== '';

  useEffect(() => {
    setStory(demoStory ?? '');
    setIntakeResult(null);
    setIntakeFailed(false);
    setGuidedOpen(false);
    setGoal('');
    setShowDemoIntro(Boolean(demoStory));
  }, [demoStory]);

  const handleStorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!story.trim() || isExtracting) return;
    setIsExtracting(true);
    setIntakeFailed(false);
    setIntakeResult(null);
    try {
      setIntakeResult(await extractOwnerStory(story));
    } catch {
      if (demoFallback) setIntakeResult(demoFallback);
      else setIntakeFailed(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const needsGoal = Boolean(intakeResult?.followUps.some(({ field }) => field === 'goal'));
  const canConfirm = Boolean(intakeResult && (!needsGoal || goal));
  const petLabel = intakeResult?.extraction.petName ?? 'your pet';

  if (showDemoIntro) return <div className="mx-auto flex w-full max-w-4xl flex-1 items-center px-4 py-12 sm:px-6 md:px-8"><section className="w-full rounded-3xl border border-[var(--sage)]/45 bg-white/80 p-7 shadow-[0_22px_65px_rgba(46,84,64,.09)] sm:p-12" aria-labelledby="meet-luna-heading"><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--forest)]/65">Luna demo</p><h1 id="meet-luna-heading" className="mt-3 font-serif text-5xl text-[var(--forest)] sm:text-6xl">Meet Luna</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--charcoal)]/80 sm:text-xl">Luna’s landlord is threatening eviction because she barks while her owner is at work. They have about a week and cannot afford a trainer.</p><Button type="button" onClick={() => setShowDemoIntro(false)} className="brand-focus mt-8 min-h-12 rounded-full bg-[var(--forest)] px-7 text-[var(--cream)]">See what Keep Them Home understands <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button></section></div>;

  return <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-14 md:px-8 md:py-16">
    <button type="button" onClick={onBack} className="brand-focus mb-8 -ml-1 inline-flex items-center gap-1.5 rounded px-1 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--forest)]"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to homepage</button>
    <div className="mb-8"><p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--forest)]/70">Your situation</p><h1 className="text-balance font-serif text-4xl leading-tight text-[var(--forest)] sm:text-5xl">Tell us what’s happening.</h1><p className="mt-4 text-lg leading-relaxed text-[var(--charcoal)]/75">Share the situation in your own words. We’ll only ask about what we still need to understand.</p></div>

    <section className="rounded-2xl border border-[var(--sage)]/45 bg-white/70 p-5 sm:p-7" aria-label="Tell your story">
      <form onSubmit={handleStorySubmit} className="space-y-4">
        <Label htmlFor="owner-story" className="sr-only">Tell us what’s happening</Label>
        <Textarea id="owner-story" value={story} onChange={(event) => setStory(event.target.value)} maxLength={3000} rows={7} placeholder="Tell us what’s making it difficult to keep your pet right now…" className="min-h-[180px] resize-y rounded-2xl border-[var(--border-warm)] bg-white p-5 text-base leading-relaxed text-[var(--charcoal)] focus-visible:ring-2 focus-visible:ring-[var(--forest)] sm:text-lg" />
        <Button type="submit" disabled={!story.trim() || isExtracting} aria-describedby={!story.trim() ? 'story-requirement' : undefined} className="brand-focus min-h-12 rounded-full bg-[var(--forest)] px-7 text-[var(--cream)] hover:bg-[var(--forest-deep)] disabled:border disabled:border-[var(--border-warm)] disabled:bg-[var(--surface-soft)] disabled:text-[var(--text-muted)]">{isExtracting && <LoaderCircle className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}{isExtracting ? 'Understanding your story…' : 'See what we understood'}<ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
        {!story.trim() && <p id="story-requirement" className="text-sm text-[var(--text-muted)]">Describe what’s happening to continue.</p>}
      </form>

      {intakeFailed && <div className="mt-5 rounded-lg bg-[var(--warm-sand)]/25 p-4" role="status"><p className="text-sm text-[var(--charcoal)]">We couldn’t fully interpret that. You can answer a few questions instead.</p><button type="button" onClick={() => setGuidedOpen(true)} className="brand-focus mt-2 rounded text-sm font-semibold text-[var(--forest)] underline underline-offset-4">Answer step by step</button></div>}

      {intakeResult && <div className="mt-6 border-t border-[var(--border-warm)] pt-6" aria-live="polite">
        <h2 className="font-serif text-3xl text-[var(--forest)]">Here’s what we understood.</h2><p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--text-muted)]">We pulled out the pressures that seem to matter most. You can correct anything that doesn’t look right.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">{factRows(intakeResult).map((fact) => <li key={fact} className="rounded-xl border border-[var(--sage)]/40 bg-[var(--sage)]/10 p-4"><p className="font-medium text-[var(--charcoal)]">{fact}</p><p className="mt-1 text-sm font-semibold text-[var(--forest)]">From your story</p></li>)}</ul>
        {needsGoal && <fieldset className="mt-8">
          <legend className="text-sm font-bold text-[var(--forest)]">One thing we still need to know</legend><p className="mt-3 font-serif text-2xl text-[var(--charcoal)]">What are you open to right now?</p><p className="mt-1 text-sm text-[var(--text-muted)]">This helps us evaluate which paths are actually possible.</p>
          <div className="mt-4 space-y-3">{goalOptions.map((option) => { const selected = goal === option.value; const label = option.value === 'Move' ? `I’m open to moving with ${petLabel}` : option.label; return <ChoiceCard key={option.value} name="intake-goal" checked={selected} onChange={() => setGoal(option.value)}>{label}</ChoiceCard>; })}</div>
          <p className="mt-3 text-sm font-semibold text-[var(--text-muted)]">{goal ? 'Confirmed by you' : 'We still need to know'}</p>
        </fieldset>}
        <Button type="button" disabled={!canConfirm} onClick={() => onIntakeConfirm(intakeResult, goal || undefined)} className="brand-focus mt-7 bg-[var(--forest)] text-[var(--cream)] hover:bg-[var(--forest-deep)]">See my options <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
      </div>}
    </section>

    {!guidedOpen && !intakeResult && !intakeFailed && <button type="button" onClick={() => setGuidedOpen(true)} className="brand-focus mt-6 rounded text-sm font-semibold text-[var(--forest)] underline underline-offset-4">Prefer to answer step by step?</button>}
    {guidedOpen && <form onSubmit={(event) => { event.preventDefault(); if (isContinueEnabled) onContinue(); }} className="mt-8 space-y-7 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface)] p-5 sm:p-7">
      <h2 className="font-serif text-2xl text-[var(--forest)]">About your pet</h2><div className="space-y-2"><Label htmlFor="pet-name">Pet name</Label><Input id="pet-name" value={petName} onChange={(event) => onNameChange(event.target.value)} required /></div>
      <fieldset><legend className="text-sm font-medium">Pet type</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{([{ type: 'dog', label: 'Dog', icon: Dog }, { type: 'cat', label: 'Cat', icon: Cat }, { type: 'other', label: 'Other', icon: Sparkles }] as const).map(({ type, label, icon: Icon }) => { const selected = petType === type; return <ChoiceCard key={type} name="pet-type" checked={selected} onChange={() => onTypeSelect(type)} icon={<Icon className="h-5 w-5" aria-hidden="true" />}>{label}</ChoiceCard>; })}</div></fieldset>
      <Button type="submit" disabled={!isContinueEnabled} className="bg-[var(--forest)] text-[var(--cream)]">Continue <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
    </form>}
  </div>;
};

export default PetInfoScreen;
