import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthenticatedHome from '@/components/AuthenticatedHome';
import { caseApi } from '@/lib/case-api';

const savedLuna = {
  case: { id: 'case-1', petName: 'Luna', petType: 'dog', primaryBarrier: 'housing', urgency: 'This week', goal: 'Stay where I am', currentStatus: 'active', userId: 'user-1', petId: 'pet-1', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z' },
  pet: { id: 'pet-1', userId: 'user-1', name: 'Luna', type: 'dog', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z' },
  factors: [], latestOutcome: null,
};

describe('authenticated home', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows a useful signed-in empty state', async () => {
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([]);
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<AuthenticatedHome active onStart={onStart} onContinue={vi.fn()} onViewAll={vi.fn()} />);
    expect(await screen.findByRole('heading', { name: 'No saved plans yet.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Find options for my pet' }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('shows saved Luna and continues the server-backed case', async () => {
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([savedLuna] as never);
    vi.spyOn(caseApi, 'getRetentionPaths').mockResolvedValue({
      caseId: 'case-1', facts: { primaryBarrier: 'housing', situation: null, urgency: 'This week', goal: 'Stay where I am', behaviorContributor: false, costConstraint: null }, appliedChanges: [],
      paths: [{ key: 'remain_in_current_housing', title: 'Stay in current housing with your pet', objective: 'Stay together', status: 'CONDITIONAL', statusReason: 'One fact remains unknown.', blockers: [], reasonCodes: [], rankScore: 1, friction: 1, steps: [] }],
    });
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(<AuthenticatedHome active onStart={vi.fn()} onContinue={onContinue} onViewAll={vi.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument();
    expect(screen.getByText('Conditional')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue Luna’s plan' }));
    expect(onContinue).toHaveBeenCalledWith('case-1');
  });

  it('shows a keeping outcome as history rather than urgent work', async () => {
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([{ ...savedLuna, latestOutcome: { id: 'outcome-1', caseId: 'case-1', status: 'KEEPING_PET', unresolvedBarrier: null, notes: null, helpfulFactors: [], createdAt: '2026-09-12T00:00:00.000Z' } }] as never);
    vi.spyOn(caseApi, 'getRetentionPaths').mockResolvedValue({ caseId: 'case-1', facts: { primaryBarrier: 'housing', situation: null, urgency: null, goal: null, behaviorContributor: false, costConstraint: null }, appliedChanges: [], paths: [] });
    render(<AuthenticatedHome active onStart={vi.fn()} onContinue={vi.fn()} onViewAll={vi.fn()} />);
    expect(await screen.findByText('Luna is staying home')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View plan history/ })).toBeInTheDocument();
    expect(screen.queryByText('0 next steps')).not.toBeInTheDocument();
  });
});
