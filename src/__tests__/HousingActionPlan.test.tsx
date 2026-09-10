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
    vi.spyOn(caseApi, 'getPlan').mockRejectedValue(new Error('offline'));
    render(<HousingActionPlan {...props} />);
    await waitFor(() => expect(caseApi.getPlan).toHaveBeenCalled());
    expect(screen.getByText('Understand the exact housing restriction')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Visit resource' })).toHaveLength(3);
  });
});
