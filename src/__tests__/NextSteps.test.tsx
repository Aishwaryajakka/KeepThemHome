import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import NextSteps from '@/components/assessment/NextSteps';
import type { NormalizedHousingCase } from '../../server/retention-paths/domain';

const facts: NormalizedHousingCase = { primaryBarrier: 'housing', contributingBarriers: [], situation: 'My landlord or property says pets aren’t allowed', urgency: 'This week', goal: 'Stay where I am', costConstraint: null, constraints: { goalSupportsStay: true, housingResolutionPossible: 'unknown' } };
const path = { key: 'remain_in_current_housing', title: 'Stay in current housing with your pet', objective: 'Stay', status: 'CONDITIONAL' as const, statusReason: 'Unknown', blockers: [{ code: 'UNKNOWN_REQUIREMENT', type: 'PRECONDITION' as const, field: 'housingResolutionPossible', currentValue: 'unknown' as const, requiredCondition: 'Resolved', status: 'UNKNOWN' as const, label: 'Unknown' }], reasonCodes: [], rankScore: 1, friction: 1, steps: [] };

describe('Next steps fact boundary', () => {
  it('does not mutate facts when an action is merely completed, then recomputes after explicit outcome confirmation', async () => {
    const recompute = vi.fn(); const user = userEvent.setup(); render(<NextSteps path={path} facts={facts} onRecompute={recompute} />);
    await user.click(screen.getByRole('button', { name: 'Add to my plan' }));
    await user.click(screen.getByRole('button', { name: 'Completed' }));
    expect(recompute).not.toHaveBeenCalled();
    expect(screen.getByText(/before any case fact changes/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'They agreed my pet can stay' }));
    expect(recompute).toHaveBeenCalledOnce();
    expect(recompute.mock.calls[0][0].find(({ key }: { key: string }) => key === path.key).status).toBe('FEASIBLE');
  });

  it('Not possible records a reason without recomputing facts', async () => {
    const recompute = vi.fn(); const user = userEvent.setup(); render(<NextSteps path={path} facts={facts} onRecompute={recompute} />);
    await user.click(screen.getByRole('button', { name: 'Add to my plan' })); await user.click(screen.getByRole('button', { name: 'Not possible' }));
    expect(screen.getByLabelText('What got in the way?')).toHaveValue('COST'); expect(recompute).not.toHaveBeenCalled();
  });
});
