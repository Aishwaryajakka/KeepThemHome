import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import RootCauseScreen from '@/components/assessment/RootCauseScreen';
import BehaviorStep1 from '@/components/assessment/BehaviorStep1';
import type { BarrierType, BehaviorConcern } from '@/types/assessment';

describe('multi-factor selection', () => {
  it('selects, deselects, and explicitly assigns a primary barrier', async () => {
    const confirmed = vi.fn();
    const Harness = () => {
      const [factors, setFactors] = useState<BarrierType[]>([]);
      return <RootCauseScreen petName="Luna" selectedFactors={factors} selectedRootCause="" onFactorsChange={setFactors} onConfirm={confirmed} onBack={vi.fn()} />;
    };
    const user = userEvent.setup();
    render(<Harness />);
    const housing = screen.getByRole('checkbox', { name: /^Housing/ });
    const behavior = screen.getByRole('checkbox', { name: /^Behavior/ });
    const money = screen.getByRole('checkbox', { name: /^Money/ });
    await user.click(housing);
    await user.click(behavior);
    await user.click(money);
    expect(screen.getByText('You selected 3 factors.')).toBeInTheDocument();
    await user.click(money);
    expect(screen.getByText('You selected 2 factors.')).toBeInTheDocument();
    await user.click(money);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: /most immediate risk/ })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Housing' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(confirmed).toHaveBeenCalledWith('housing');
  });

  it('preserves an existing explicit primary when it remains selected', async () => {
    const confirmed = vi.fn();
    const user = userEvent.setup();
    render(<RootCauseScreen petName="Luna" selectedFactors={['housing', 'behavior', 'cost']} selectedRootCause="housing" onFactorsChange={vi.fn()} onConfirm={confirmed} onBack={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: /^Behavior/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(confirmed).toHaveBeenCalledWith('housing');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('makes a single selected factor primary without an extra choice', async () => {
    const confirmed = vi.fn();
    const user = userEvent.setup();
    render(<RootCauseScreen petName="Luna" selectedFactors={['behavior']} selectedRootCause="" onFactorsChange={vi.fn()} onConfirm={confirmed} onBack={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(confirmed).toHaveBeenCalledWith('behavior');
  });
});

describe('behavior depth', () => {
  it('captures and deduplicates multiple behavior concerns with checkbox semantics', async () => {
    const Harness = () => {
      const [concerns, setConcerns] = useState<Exclude<BehaviorConcern, ''>[]>([]);
      const toggle = (concern: Exclude<BehaviorConcern, ''>) => setConcerns((current) => current.includes(concern) ? current.filter((value) => value !== concern) : [...current, concern]);
      return <BehaviorStep1 petName="Luna" selectedConcerns={concerns} onToggleConcern={toggle} onContinue={vi.fn()} onBack={vi.fn()} />;
    };
    const user = userEvent.setup();
    render(<Harness />);
    const barking = screen.getByRole('checkbox', { name: 'Barking or excessive noise' });
    const separation = screen.getByRole('checkbox', { name: 'Separation-related behavior' });
    await user.click(barking);
    await user.click(separation);
    expect(barking).toBeChecked();
    expect(separation).toBeChecked();
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(2);
    await user.click(barking);
    expect(barking).not.toBeChecked();
  });
});
