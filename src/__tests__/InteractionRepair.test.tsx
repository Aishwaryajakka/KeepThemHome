import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import PetInfoScreen from '@/components/assessment/PetInfoScreen';
import { ChoiceCard } from '@/components/ui/choice-card';

describe('core intake interactions', () => {
  it('accepts edits and paste, then submits the exact current story value', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      extraction: { petName: null, petType: null, primaryBarrier: null, contributingBarriers: [], housingSituation: null, behaviorConcern: null, behaviorSeriousness: null, behaviorAlreadyTried: null, behaviorHelpBarrier: null, costConstraint: null, urgency: null, goal: null },
      followUps: [],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<PetInfoScreen petName="" petType="" onNameChange={vi.fn()} onTypeSelect={vi.fn()} onContinue={vi.fn()} onBack={vi.fn()} onIntakeConfirm={vi.fn()} />);
    const story = screen.getByRole('textbox', { name: 'Tell us what’s happening' });
    await user.click(story);
    await user.type(story, 'Luna needs help.');
    await user.keyboard('{Backspace}');
    await user.paste(' Now');
    expect(story).toHaveFocus();
    expect(story).toHaveValue('Luna needs help Now');
    await user.click(screen.getByRole('button', { name: 'See what we understood' }));
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ text: 'Luna needs help Now' });
    expect(await screen.findByText('We still need to understand the main issue before comparing options. Answer step by step to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'See my options' })).toBeDisabled();
  });

  it('activates a choice from its text, card whitespace, and keyboard', async () => {
    const Harness = () => { const [choice, setChoice] = useState(''); return <div><ChoiceCard name="test-choice" checked={choice === 'text'} onChange={() => setChoice('text')}>Text choice</ChoiceCard><ChoiceCard name="test-choice" checked={choice === 'card'} onChange={() => setChoice('card')}>Card choice</ChoiceCard><ChoiceCard name="test-choice" checked={choice === 'keyboard'} onChange={() => setChoice('keyboard')}>Keyboard choice</ChoiceCard></div>; };
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('Text choice'));
    expect(screen.getByRole('radio', { name: 'Text choice' })).toBeChecked();
    const cardRadio = screen.getByRole('radio', { name: 'Card choice' });
    await user.click(cardRadio.closest('label')!, { position: { x: 8, y: 8 } });
    expect(cardRadio).toBeChecked();
    const radio = screen.getByRole('radio', { name: 'Keyboard choice' });
    radio.focus();
    await user.keyboard(' ');
    expect(radio).toBeChecked();
  });

  it('leaves unresolved guided choices unselected', async () => {
    const user = userEvent.setup();
    render(<PetInfoScreen petName="" petType="" onNameChange={vi.fn()} onTypeSelect={vi.fn()} onContinue={vi.fn()} onBack={vi.fn()} onIntakeConfirm={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Prefer to answer step by step?' }));
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getAllByRole('radio').every((choice) => !(choice as HTMLInputElement).checked)).toBe(true);
  });

  it('shows provider failure as a guided fallback rather than an empty successful extraction', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'intake_extraction_unavailable' }), { status: 503 })));
    const user = userEvent.setup();
    render(<PetInfoScreen petName="" petType="" onNameChange={vi.fn()} onTypeSelect={vi.fn()} onContinue={vi.fn()} onBack={vi.fn()} onIntakeConfirm={vi.fn()} />);
    await user.type(screen.getByRole('textbox', { name: 'Tell us what’s happening' }), 'Luna needs help.');
    await user.click(screen.getByRole('button', { name: 'See what we understood' }));
    expect(await screen.findByText('We couldn’t fully interpret that. You can answer a few questions instead.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tell us what’s happening' })).toHaveValue('Luna needs help.');
    await user.click(screen.getByRole('button', { name: 'Answer step by step' }));
    expect(screen.getByLabelText(/Pet name/)).toBeEnabled();
    expect(screen.queryByRole('heading', { name: 'Here’s what we understood.' })).not.toBeInTheDocument();
  });
});
