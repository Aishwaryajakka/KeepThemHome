import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    vi.spyOn(caseApi, 'getPathExplanation').mockRejectedValue(new Error('explanation unavailable'));
    vi.spyOn(caseApi, 'getRetentionPaths').mockResolvedValue({
      caseId: props.backendCaseId,
      facts: {
        primaryBarrier: 'housing', situation: props.situation, urgency: props.timing,
        goal: props.goal, behaviorContributor: true, costConstraint: 'Cannot afford trainer',
      },
      appliedChanges: [],
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

  it('adds an explanation asynchronously without replacing solver status', async () => {
    vi.spyOn(caseApi, 'getPlan').mockRejectedValue(new Error('plan unavailable'));
    vi.spyOn(caseApi, 'getRetentionPaths').mockResolvedValue({
      caseId: props.backendCaseId,
      facts: { primaryBarrier: 'housing', situation: props.situation, urgency: props.timing, goal: props.goal, behaviorContributor: true, costConstraint: null },
      appliedChanges: [],
      paths: [{
        key: 'move_with_pet', title: 'Move with your pet', objective: 'Relocate together.', status: 'BLOCKED',
        statusReason: 'A known fact conflicts.', reasonCodes: ['KNOWN_CONSTRAINT_CONFLICT'], rankScore: 100, friction: 3,
        blockers: [{ code: 'KNOWN_CONSTRAINT_CONFLICT', type: 'PRECONDITION', field: 'goalSupportsMove', currentValue: false, requiredCondition: 'Goal allows moving', status: 'KNOWN_CONFLICT', label: 'The stated goal does not allow moving.' }],
        steps: [],
      }],
    });
    vi.spyOn(caseApi, 'getPathExplanation').mockResolvedValue({
      source: 'generated', grounded: { pathKey: 'move_with_pet', status: 'BLOCKED', rank: 1, isHypothetical: false },
      explanation: {
        status: 'BLOCKED', isHypothetical: false, headline: 'Moving is currently blocked',
        summary: 'This path is blocked because your goal is to stay.',
        why: 'Pet-friendly housing and move requirements remain unknown, not available.',
        nextStep: 'The computed unlock can be explored as a hypothetical.', resourceNames: [],
      },
    });
    render(<HousingActionPlan {...props} />);
    expect(await screen.findByLabelText('Plain-language explanation for Move with your pet')).toBeInTheDocument();
    expect(screen.getByText('BLOCKED')).toBeInTheDocument();
    expect(screen.getByText(/remain unknown, not available/)).toBeInTheDocument();
  });

  it('shows unlock loading, applies hypothetical changes, and resets to actual facts', async () => {
    const user = userEvent.setup();
    vi.spyOn(caseApi, 'getPlan').mockRejectedValue(new Error('plan unavailable'));
    const path = (status: 'BLOCKED' | 'FEASIBLE') => ({
      key: 'move_with_pet', title: 'Move with your pet', objective: 'Relocate together.', status,
      statusReason: status === 'BLOCKED' ? 'A known fact conflicts.' : 'All requirements are met.',
      blockers: status === 'BLOCKED' ? [{
        code: 'KNOWN_CONSTRAINT_CONFLICT', type: 'PRECONDITION' as const, field: 'goalSupportsMove',
        currentValue: false as const, requiredCondition: 'Goal allows moving',
        status: 'KNOWN_CONFLICT' as const, label: 'The current goal does not allow relocation.',
      }] : [],
      reasonCodes: ['HOUSING_BARRIER'], rankScore: 100, friction: 3,
      steps: [{ key: 'move', title: 'Find housing', description: 'Investigate options.', resources: [] }],
    });
    const response = (status: 'BLOCKED' | 'FEASIBLE', appliedChanges: never[] = []) => ({
      caseId: props.backendCaseId,
      facts: {
        primaryBarrier: 'housing', situation: props.situation, urgency: props.timing,
        goal: props.goal, behaviorContributor: true as const, costConstraint: 'Cannot afford trainer',
      },
      appliedChanges,
      paths: [path(status)],
    });
    vi.spyOn(caseApi, 'getRetentionPaths')
      .mockResolvedValueOnce(response('BLOCKED'))
      .mockResolvedValueOnce(response('FEASIBLE'))
      .mockResolvedValueOnce(response('BLOCKED'));
    let resolveUnlock!: (value: Awaited<ReturnType<typeof caseApi.getSmallestUnlock>>) => void;
    vi.spyOn(caseApi, 'getSmallestUnlock').mockReturnValue(new Promise((resolve) => { resolveUnlock = resolve; }));

    render(<HousingActionPlan {...props} />);
    await user.click(await screen.findByRole('button', { name: 'What would unlock this?' }));
    expect(screen.getByRole('button', { name: 'Checking supported changes…' })).toBeDisabled();
    resolveUnlock({
      targetPathKey: 'move_with_pet', unlockNeeded: true, currentStatus: 'BLOCKED',
      currentBlockers: path('BLOCKED').blockers,
      smallestUnlock: {
        changes: [{
          code: 'ALLOW_STAY_OR_MOVE', field: 'goal', from: 'Stay where I am', to: 'Either could work',
          label: 'Become open to relocating.', burden: 3, source: 'supported_catalog',
        }, {
          code: 'CONFIRM_PET_FRIENDLY_HOUSING', field: 'petFriendlyHousingAvailable', from: 'unknown', to: true,
          label: 'Assume suitable housing is available.', burden: 4, source: 'supported_catalog',
        }, {
          code: 'CONFIRM_MOVE_REQUIREMENTS', field: 'moveRequirementsMet', from: 'unknown', to: true,
          label: 'Assume move requirements can be met.', burden: 4, source: 'supported_catalog',
        }],
        changeCount: 3, totalBurden: 11, resultingStatus: 'FEASIBLE', resultingPathEvaluation: path('FEASIBLE'),
      },
      alternatives: [], appliedChanges: [], appliedOverrides: {}, currentPathEvaluation: path('BLOCKED'),
    });
    expect(await screen.findByText('Smallest Unlock')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Apply Changes' }));
    expect(await screen.findByText('Viewing a hypothetical scenario. Your current case has not changed.')).toBeInTheDocument();
    expect(screen.getByText('FEASIBLE')).toBeInTheDocument();
    expect(caseApi.getRetentionPaths).toHaveBeenLastCalledWith(props.backendCaseId, [
      'ALLOW_STAY_OR_MOVE', 'CONFIRM_PET_FRIENDLY_HOUSING', 'CONFIRM_MOVE_REQUIREMENTS',
    ]);

    await user.click(screen.getByRole('button', { name: 'Reset to current situation' }));
    await waitFor(() => expect(caseApi.getRetentionPaths).toHaveBeenLastCalledWith(props.backendCaseId, []));
    expect(await screen.findByText('BLOCKED')).toBeInTheDocument();
    expect(screen.queryByText('Viewing a hypothetical scenario. Your current case has not changed.')).not.toBeInTheDocument();
  });

  it('renders deduplicated evidence citations as safe external links without replacing resources', async () => {
    vi.spyOn(caseApi, 'getPlan').mockRejectedValue(new Error('plan unavailable'));
    vi.spyOn(caseApi, 'getPathExplanation').mockRejectedValue(new Error('explanation unavailable'));
    vi.spyOn(caseApi, 'getRetentionPaths').mockResolvedValue({
      caseId: props.backendCaseId,
      facts: { primaryBarrier: 'housing', situation: props.situation, urgency: props.timing, goal: props.goal, behaviorContributor: true, costConstraint: 'Cannot afford behavior help' },
      appliedChanges: [],
      paths: [{
        key: 'remain_in_current_housing', title: 'Stay in current housing with your pet', objective: 'Remain together.',
        status: 'CONDITIONAL', statusReason: 'Requirements are unknown.', blockers: [], reasonCodes: [], rankScore: 1, friction: 1,
        steps: [{ key: 'clarify', title: 'Clarify restriction', description: 'Check the policy.', resources: [] }],
      }],
    });
    vi.spyOn(caseApi, 'getPathEvidence').mockResolvedValue({
      caseId: props.backendCaseId, pathKey: 'remain_in_current_housing',
      whyThisApproach: 'Housing, Behavior, Cost are all affecting this case.',
      evidence: [{
        id: 'aspca-housing', organization: 'ASPCA', title: 'Pet-Friendly Housing and Renters',
        url: 'https://www.aspca.org/example', publicationYear: null, sourceType: 'industry_guidance',
        summary: 'Curated source summary.', whyRelevant: 'Housing is the primary barrier in this case.',
        claims: [{ code: 'HOUSING_SURRENDER_DRIVER', label: 'Housing pressure', summary: 'Housing problems are documented contributors to rehoming.' }],
      }],
    });

    render(<HousingActionPlan {...props} />);
    const evidence = await screen.findByLabelText('Evidence for Stay in current housing with your pet');
    expect(within(evidence).getByText('ASPCA')).toBeInTheDocument();
    expect(within(evidence).getByText('Pet-Friendly Housing and Renters')).toBeInTheDocument();
    const source = within(evidence).getByRole('link', { name: 'View source' });
    expect(source).toHaveAttribute('href', 'https://www.aspca.org/example');
    expect(source).toHaveAttribute('target', '_blank');
    expect(source).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(/not a guarantee of eligibility, availability, or success/i)).toBeInTheDocument();
  });
});
