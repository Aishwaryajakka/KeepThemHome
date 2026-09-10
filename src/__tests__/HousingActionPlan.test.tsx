import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HousingActionPlan from '@/components/assessment/HousingActionPlan';
import { caseApi } from '@/lib/case-api';

const props = {
  backendCaseId: '550e8400-e29b-41d4-a716-446655440000',
  petName: 'Luna',
  situation: 'My landlord or property says pets aren’t allowed' as const,
  timing: 'This week' as const,
  goal: 'Stay where I am' as const,
  onTryPlan: vi.fn(),
  onBack: vi.fn(),
};

describe('HousingActionPlan backend fallback', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders a successful backend intervention plan', async () => {
    vi.spyOn(caseApi, 'getRetentionPaths').mockRejectedValue(new Error('paths unavailable'));
    vi.spyOn(caseApi, 'getPlan').mockResolvedValue({
      caseId: props.backendCaseId,
      interventions: [{
        key: 'server-ranked-intervention',
        title: 'Server-ranked housing action',
        description: 'A deterministic server result.',
        score: 15,
        reasons: ['GOAL_STAY'],
        resources: [],
      }],
    });
    render(<HousingActionPlan {...props} />);
    expect(await screen.findByText('Server-ranked housing action')).toBeInTheDocument();
    expect(screen.getByText(/goal is to stay where you are/i)).toBeInTheDocument();
  });

  it('keeps the Product Pass 3 plan when the plan API fails', async () => {
    vi.spyOn(caseApi, 'getRetentionPaths').mockRejectedValue(new Error('paths unavailable'));
    vi.spyOn(caseApi, 'getPlan').mockRejectedValue(new Error('offline'));
    render(<HousingActionPlan {...props} />);
    await waitFor(() => expect(caseApi.getPlan).toHaveBeenCalled());
    expect(screen.getByText('Understand the exact housing restriction')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Visit resource' })).toHaveLength(3);
  });

  it('renders retention paths with status, dependencies, and blockers', async () => {
    vi.spyOn(caseApi, 'getPlan').mockRejectedValue(new Error('plan unavailable'));
    vi.spyOn(caseApi, 'getRetentionPaths').mockResolvedValue({
      caseId: props.backendCaseId,
      facts: {
        primaryBarrier: 'housing', situation: props.situation, urgency: props.timing,
        goal: props.goal, behaviorContributor: true, costConstraint: 'Cannot afford trainer',
      },
      paths: [{
        key: 'remain_in_current_housing',
        title: 'Stay in current housing with your pet',
        objective: 'Address the complaint and remain together.',
        status: 'CONDITIONAL',
        statusReason: 'One or more required conditions are still unknown.',
        blockers: [{
          code: 'UNKNOWN_REQUIREMENT', type: 'PRECONDITION', field: 'housingResolutionPossible',
          currentValue: 'unknown', requiredCondition: 'Housing issue can be addressed',
          status: 'UNKNOWN', label: 'Resolution has not been confirmed.',
        }],
        reasonCodes: ['HOUSING_BARRIER', 'UNKNOWN_REQUIREMENT'],
        rankScore: 200,
        friction: 2,
        steps: [{
          key: 'clarify', title: 'Clarify the complaint', description: 'Confirm the exact issue.', resources: [],
        }],
      }],
    });
    render(<HousingActionPlan {...props} />);
    expect(await screen.findByRole('heading', { name: 'Possible paths to keeping Luna home' })).toBeInTheDocument();
    expect(screen.getByText('CONDITIONAL')).toBeInTheDocument();
    expect(screen.getByText('Clarify the complaint')).toBeInTheDocument();
    expect(screen.getByText('Resolution has not been confirmed.')).toBeInTheDocument();
  });
});
