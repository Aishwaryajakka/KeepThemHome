import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '@/pages/HomePage';
import {
  ASSESSMENT_SESSION_KEY,
  ASSESSMENT_SESSION_VERSION,
  initialAssessmentCase,
} from '@/lib/assessment-session';
import { caseApi, type CaseResponse } from '@/lib/case-api';

const backendCase: CaseResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  petName: 'Luna',
  petType: 'dog',
  primaryBarrier: null,
  urgency: null,
  goal: null,
  currentStatus: 'active',
  createdAt: '2026-09-10T00:00:00.000Z',
  updatedAt: '2026-09-10T00:00:00.000Z',
};

const startAssessment = async () => {
  const user = userEvent.setup();
  render(<HomePage />);
  await user.click(screen.getByRole('button', { name: 'Find options for my pet' }));
  return user;
};

const enterLuna = async () => {
  const user = await startAssessment();
  await user.type(screen.getByLabelText(/Pet name/), 'Luna');
  await user.click(screen.getByRole('button', { name: 'Dog' }));
  return user;
};

const reachRootCause = async () => {
  const user = await enterLuna();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  return user;
};

const reachHousingPlan = async () => {
  const user = await reachRootCause();
  await user.click(screen.getByRole('button', { name: /HOUSING/ }));
  await user.click(screen.getByRole('button', { name: /My landlord or property says pets aren’t allowed/ }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: 'This week' }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: 'Stay where I am' }));
  await user.click(screen.getByRole('button', { name: 'See my options' }));
  expect(screen.getByText('ASSESSMENT COMPLETE')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  return user;
};

beforeEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.stubGlobal('scrollTo', vi.fn());
});

describe('Keep Them Home demo flows', () => {
  it('accepts Luna and Dog, then reaches the Housing pathway', async () => {
    const user = await enterLuna();

    expect(screen.getByLabelText(/Pet name/)).toHaveValue('Luna');
    expect(screen.getByRole('button', { name: 'Dog' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: /HOUSING/ }));

    expect(screen.getByRole('heading', { name: 'What’s happening with your housing?' })).toBeInTheDocument();
  });

  it('protects the Luna Housing golden path through the keeping outcome', async () => {
    const user = await reachHousingPlan();

    expect(screen.getByRole('heading', { name: 'Your Keep Luna Home Plan' })).toBeInTheDocument();
    const resourceLinks = screen.getAllByRole('link', { name: 'Visit resource' });
    expect(resourceLinks).toHaveLength(3);
    for (const link of resourceLinks) {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^https:\/\//));
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(screen.queryByText('Pet-Friendly Housing Directory')).not.toBeInTheDocument();
    expect(screen.queryByText('Pet Deposit Assistance')).not.toBeInTheDocument();
    expect(screen.queryByText('Temporary Foster Support')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /I’ll try this plan/ }));
    await user.click(screen.getByRole('button', { name: /We’re keeping Luna/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('heading', { name: 'Luna is staying home.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start another case' }));
    expect(screen.getByRole('heading', { name: /Before you give them up/ })).toBeInTheDocument();
    await waitFor(() => expect(sessionStorage.getItem(ASSESSMENT_SESSION_KEY)).toBeNull());
  });

  it('shows the immediate Behavior safety notice', async () => {
    const user = await reachRootCause();
    await user.click(screen.getByRole('button', { name: /BEHAVIOR/ }));
    await user.click(screen.getByRole('button', { name: 'Barking or excessive noise' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: /immediate safety concern/ }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Safety comes first.');
  });

  it('reaches Responsible Rehoming from the rehoming outcome', async () => {
    const user = await reachHousingPlan();
    await user.click(screen.getByRole('button', { name: /I’ll try this plan/ }));
    await user.click(screen.getByRole('button', { name: /We still need rehoming help/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Explore responsible rehoming' }));

    expect(screen.getByRole('heading', { name: 'Let’s find the safest next step for Luna.' })).toBeInTheDocument();
  });

  it('restores an active Luna Housing case and its selected answers', async () => {
    sessionStorage.setItem(ASSESSMENT_SESSION_KEY, JSON.stringify({
      version: ASSESSMENT_SESSION_VERSION,
      caseState: {
        ...initialAssessmentCase,
        petName: 'Luna',
        petType: 'dog',
        rootCause: 'housing',
        housing: {
          situation: 'My landlord or property says pets aren’t allowed',
          urgency: 'This week',
          goal: 'Stay where I am',
        },
        currentScreen: 'housing-3',
      },
    }));

    render(<HomePage />);

    expect(screen.getByRole('heading', { name: /stay where you are or move/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stay where I am' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Back to previous question' }));
    expect(screen.getByRole('button', { name: 'This week' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('discards invalid persisted state and starts safely at the homepage', () => {
    sessionStorage.setItem(ASSESSMENT_SESSION_KEY, '{not valid json');

    render(<HomePage />);

    expect(screen.getByRole('heading', { name: /Before you give them up/ })).toBeInTheDocument();
    expect(sessionStorage.getItem(ASSESSMENT_SESSION_KEY)).toBeNull();
  });

  it('records one logical transition for Root Cause selection', async () => {
    const user = await reachRootCause();
    const pushState = vi.spyOn(window.history, 'pushState');

    await user.click(screen.getByRole('button', { name: /HOUSING/ }));

    expect(pushState).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'What’s happening with your housing?' })).toBeInTheDocument();
  });

  it('moves backward and forward through logical screens with browser history', async () => {
    const user = await enterLuna();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: /What’s making it hard/ })).toBeInTheDocument();

    window.history.back();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'First, who are we helping?' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Pet name/)).toHaveValue('Luna');

    window.history.forward();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /What’s making it hard/ })).toBeInTheDocument();
    });
  });

  it('continues locally when backend case creation fails', async () => {
    vi.spyOn(caseApi, 'createCase').mockRejectedValue(new Error('API unavailable'));
    const user = await enterLuna();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('heading', { name: /What’s making it hard/ })).toBeInTheDocument();
  });

  it('retains a successful backend ID and avoids duplicate case creation', async () => {
    const createCase = vi.spyOn(caseApi, 'createCase').mockResolvedValue(backendCase);
    vi.spyOn(caseApi, 'updateCase').mockResolvedValue(backendCase);
    vi.spyOn(caseApi, 'recordFactors').mockResolvedValue({});
    const user = await enterLuna();

    await waitFor(() => {
      const stored = JSON.parse(sessionStorage.getItem(ASSESSMENT_SESSION_KEY) ?? '{}');
      expect(stored.caseState?.backendCaseId).toBe(backendCase.id);
    });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: /HOUSING/ }));

    expect(createCase).toHaveBeenCalledTimes(1);
  });

  it('continues navigation when backend case updates fail', async () => {
    vi.spyOn(caseApi, 'createCase').mockResolvedValue(backendCase);
    vi.spyOn(caseApi, 'updateCase').mockRejectedValue(new Error('API unavailable'));
    vi.spyOn(caseApi, 'recordFactors').mockRejectedValue(new Error('API unavailable'));
    const user = await enterLuna();
    await waitFor(() => expect(caseApi.updateCase).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: /HOUSING/ }));

    expect(screen.getByRole('heading', { name: 'What’s happening with your housing?' })).toBeInTheDocument();
  });

  it('attempts outcome synchronization without blocking the keeping flow', async () => {
    vi.spyOn(caseApi, 'createCase').mockResolvedValue(backendCase);
    vi.spyOn(caseApi, 'updateCase').mockResolvedValue(backendCase);
    vi.spyOn(caseApi, 'recordFactors').mockResolvedValue({});
    const recordOutcome = vi.spyOn(caseApi, 'recordOutcome').mockResolvedValue({});
    const user = await reachHousingPlan();
    await user.click(screen.getByRole('button', { name: /I’ll try this plan/ }));
    await user.click(screen.getByRole('button', { name: /We’re keeping Luna/ }));

    await waitFor(() => expect(recordOutcome).toHaveBeenCalledWith(backendCase.id, 'keeping'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'Luna is staying home.' })).toBeInTheDocument();
  });
});
