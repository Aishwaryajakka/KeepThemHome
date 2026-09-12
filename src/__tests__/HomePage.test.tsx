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
import { MemoryRouter } from 'react-router-dom';
import { DemoModeProvider } from '@/demo/DemoModeProvider';

const signedOutAuth = () => ({ configured: true, loaded: true, signedIn: false, serverReady: false, status: 'SIGNED_OUT' as const, error: null, signingOut: false, openSignIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() });
let authState = signedOutAuth();
vi.mock('@/auth/AuthProvider', () => ({ useAppAuth: () => authState }));
vi.mock('@clerk/react', () => ({ UserButton: () => <button type="button">Account</button> }));

const backendCase: CaseResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  petName: 'Luna',
  petType: 'dog',
  primaryBarrier: null,
  urgency: null,
  goal: null,
  currentStatus: 'active',
  userId: '650e8400-e29b-41d4-a716-446655440000',
  petId: '750e8400-e29b-41d4-a716-446655440000',
  createdAt: '2026-09-10T00:00:00.000Z',
  updatedAt: '2026-09-10T00:00:00.000Z',
};

const renderHome = () => render(<MemoryRouter><DemoModeProvider><HomePage /></DemoModeProvider></MemoryRouter>);

const startAssessment = async () => {
  const user = userEvent.setup();
  renderHome();
  await user.click(screen.getAllByRole('button', { name: 'Find options for my pet' })[0]);
  return user;
};

const enterLuna = async () => {
  const user = await startAssessment();
  await user.click(screen.getByRole('button', { name: 'Prefer to answer step by step?' }));
  await user.type(screen.getByLabelText(/Pet name/), 'Luna');
  await user.click(screen.getByRole('radio', { name: 'Dog' }));
  return user;
};

const reachRootCause = async () => {
  const user = await enterLuna();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  return user;
};

const reachHousingPlan = async () => {
  const user = await reachRootCause();
  await user.click(screen.getByRole('radio', { name: /^Housing/ }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('radio', { name: /My landlord or property says pets aren’t allowed/ }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('radio', { name: 'This week' }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('radio', { name: 'Stay where I am' }));
  await user.click(screen.getByRole('button', { name: 'See my options' }));
  expect(screen.getByText('Assessment complete')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Open decision workspace' }));
  return user;
};

beforeEach(() => {
  vi.restoreAllMocks();
  authState = signedOutAuth();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.stubGlobal('scrollTo', vi.fn());
});

describe('Keep Them Home demo flows', () => {
  it('shows Saved only after the atomic server save succeeds', async () => {
    authState = { ...authState, signedIn: true, serverReady: true, status: 'SIGNED_IN_READY' };
    let resolveSave: ((value: never) => void) | undefined;
    const pending = new Promise((resolve) => { resolveSave = resolve; });
    const save = vi.spyOn(caseApi, 'saveAssessment').mockReturnValue(pending as never);
    const user = await reachHousingPlan();
    await user.click(screen.getByRole('button', { name: 'Save Luna’s plan' }));
    expect(screen.getByRole('button', { name: 'Saving Luna’s plan…' })).toBeDisabled();
    expect(screen.queryByText('Luna’s plan is saved.')).not.toBeInTheDocument();
    resolveSave?.({ case: backendCase, pet: { id: backendCase.petId }, factors: [] } as never);
    expect(await screen.findByText('Luna’s plan is saved.')).toBeInTheDocument();
    expect(save).toHaveBeenCalledOnce();
  });

  it('never shows Saved when the atomic server save fails', async () => {
    authState = { ...authState, signedIn: true, serverReady: true, status: 'SIGNED_IN_READY' };
    vi.spyOn(caseApi, 'saveAssessment').mockRejectedValue(new Error('Server rejected save'));
    const user = await reachHousingPlan();
    await user.click(screen.getByRole('button', { name: 'Save Luna’s plan' }));
    expect(await screen.findByText('We couldn’t save Luna’s plan.')).toBeInTheDocument();
    expect(screen.queryByText('Luna’s plan is saved.')).not.toBeInTheDocument();
  });

  it('renders the owner-facing brand foundation and landing story', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: 'Before you give them up, let’s see what’s possible.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What Keep Them Home helps you understand' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Built to support decisions, not make them for you.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'People and pets belong together.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'See what’s possible for your pet.' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Find options for my pet' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Find options' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'How it works' })[0]).toHaveAttribute('href', '/#how-it-works');
    expect(screen.getAllByRole('link', { name: 'What we help' })[0]).toHaveAttribute('href', '/#what-we-help');
    expect(screen.getAllByRole('link', { name: 'Our promise' })[0]).toHaveAttribute('href', '/#our-promise');
    expect(screen.getByLabelText('Example of Keep Them Home path results')).toHaveTextContent('Example');
    expect(screen.getByRole('button', { name: 'Demo Mode' })).toBeInTheDocument();
    expect(screen.queryByText(/Usually takes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Elena/i)).not.toBeInTheDocument();
    expect(screen.getByAltText('A golden retriever and tabby cat resting together')).toHaveAttribute('src', '/images/pets-resting-hero.jpg');
    expect(screen.getByText(`© ${new Date().getFullYear()} Keep Them Home`)).toBeInTheDocument();
    expect(screen.queryByText(/AI understands/i)).not.toBeInTheDocument();
  });

  it('uses the focused Product Shell during an active assessment', async () => {
    const user = await startAssessment();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Footer navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Product footer navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exit case' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Exit case' }));
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
  });

  it('loads and resets the temporary Luna Demo Mode scenario', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Demo Mode' }));
    expect(await screen.findByLabelText('Demo scenario')).toHaveTextContent('Temporary demo');
    expect(screen.getByText('LUNA DEMO', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Meet Luna' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'See what Keep Them Home understands' }));
    expect(screen.getByRole('textbox', { name: 'Tell us what’s happening' })).toHaveValue('My landlord is threatening eviction because Luna barks while I’m at work. I have a week and can’t afford a trainer.');
    expect(screen.queryByText(/Landlord pressure · barking/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset demo' }));
    expect(await screen.findByRole('heading', { name: 'Before you give them up, let’s see what’s possible.' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Demo scenario')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Demo Mode' }));
    expect(await screen.findByRole('heading', { name: 'Meet Luna' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'See what Keep Them Home understands' }));
    expect(screen.getByRole('textbox', { name: 'Tell us what’s happening' })).toHaveValue('My landlord is threatening eviction because Luna barks while I’m at work. I have a week and can’t afford a trainer.');
    await user.click(screen.getByRole('button', { name: 'Reset demo' }));
    expect(await screen.findByRole('heading', { name: 'Before you give them up, let’s see what’s possible.' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Demo scenario')).not.toBeInTheDocument();
  });

  it('reaches the computed decision workspace from Demo Mode', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Demo Mode' }));
    await user.click(screen.getByRole('button', { name: 'See what Keep Them Home understands' }));
    await user.click(screen.getByRole('button', { name: 'See what we understood' }));
    expect(await screen.findByRole('heading', { name: 'Here’s what we understood.' })).toBeInTheDocument();
    expect(screen.getAllByText('From your story')).toHaveLength(4);
    expect(screen.getByText('We still need to know')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'I need to stay in my current home' }));
    await user.click(screen.getByRole('button', { name: 'See my options' }));
    expect(await screen.findByRole('heading', { name: 'We have enough to evaluate Luna’s options.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open decision workspace' }));
    expect(await screen.findByRole('heading', { name: 'Your Keep Luna Home Plan' })).toBeInTheDocument();
    expect(screen.getByLabelText('Luna case context')).toHaveTextContent('Housing');
    expect(screen.getByText('Stay in current housing with Luna')).toBeInTheDocument();
    expect(screen.getByText('Use a temporary-care bridge')).toBeInTheDocument();
    expect(screen.getByText('Move with Luna')).toBeInTheDocument();
  });
  it('clearly offers guided intake when automatic intake fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
    const user = await startAssessment();
    await user.type(screen.getByRole('textbox', { name: 'Tell us what’s happening' }), 'My landlord says Luna has to go.');
    await user.click(screen.getByRole('button', { name: 'See what we understood' }));
    expect(await screen.findByText(/couldn’t fully interpret that/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Answer step by step', exact: true })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Answer step by step' }));
    expect(screen.getByLabelText(/Pet name/)).toBeEnabled();
  });

  it('uses the Luna extraction, labels provenance, and asks only for the unresolved goal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      extraction: {
        petName: 'Luna', petType: 'dog', primaryBarrier: 'housing', contributingBarriers: ['behavior', 'cost'],
        housingSituation: 'My landlord or property says pets aren’t allowed', behaviorConcern: 'Barking or excessive noise',
        behaviorSeriousness: null, behaviorAlreadyTried: null, behaviorHelpBarrier: 'Cost',
        costConstraint: 'Cannot afford a trainer', urgency: 'This week', goal: null,
      },
      followUps: [{ field: 'goal', screen: 'housing-3', question: 'What are you open to right now?' }],
    }), { status: 200 })));
    const user = await startAssessment();
    await user.type(screen.getByRole('textbox', { name: 'Tell us what’s happening' }), 'My landlord is threatening eviction because Luna barks while I’m at work. I have a week and can’t afford a trainer.');
    await user.click(screen.getByRole('button', { name: 'See what we understood' }));
    expect(await screen.findByText('Housing pressure')).toBeInTheDocument();
    expect(screen.getByText('Barking while you’re away')).toBeInTheDocument();
    expect(screen.getByText('Cost is limiting training options')).toBeInTheDocument();
    expect(screen.getByText('Urgent — about 7 days')).toBeInTheDocument();
    expect(screen.getAllByText('From your story')).toHaveLength(4);
    expect(screen.getByRole('radio', { name: 'I need to stay in my current home' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'See my options' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'I need to stay in my current home' }));
    expect(screen.getByText('Confirmed by you')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'See my options' }));
    expect(await screen.findByRole('heading', { name: 'We have enough to evaluate Luna’s options.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open decision workspace' }));
    expect(await screen.findByRole('heading', { name: 'Your Keep Luna Home Plan' })).toBeInTheDocument();
    await waitFor(() => {
      const stored = JSON.parse(sessionStorage.getItem(ASSESSMENT_SESSION_KEY) ?? '{}');
      expect(stored.caseState?.selectedFactors).toEqual(['housing', 'behavior', 'cost']);
      expect(stored.caseState?.behavior.concerns).toEqual(['Barking or excessive noise']);
      expect(stored.caseState?.housing.goal).toBe('Stay where I am');
    });
  });

  it('completes the Luna Housing, Behavior, and Money multi-factor review', async () => {
    const user = await reachRootCause();
    await user.click(screen.getByRole('radio', { name: /^Housing/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('checkbox', { name: /^Behavior/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Money/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.click(screen.getByRole('radio', { name: /My landlord or property says pets aren’t allowed/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: 'This week' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: 'Stay where I am' }));
    await user.click(screen.getByRole('button', { name: 'See my options' }));

    expect(screen.getByText('Behavior, Cost')).toBeInTheDocument();
    expect(screen.getByText('Cost is affecting available options')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Stay where I am')).toBeInTheDocument();
  });

  it('accepts Luna and Dog, then reaches the Housing pathway', async () => {
    const user = await enterLuna();

    expect(screen.getByLabelText(/Pet name/)).toHaveValue('Luna');
    expect(screen.getByRole('radio', { name: 'Dog' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: /^Housing/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('heading', { name: 'What’s happening with your housing?' })).toBeInTheDocument();
  });

  it.each([
    ['Money', 'Cost'],
    ['Health / veterinary', 'Veterinary'],
    ['Temporary crisis', 'Temporary crisis'],
    ['Time or caregiving capacity', 'Time & capacity'],
    ['Family or life changes', 'Family or life change'],
  ])('routes the %s factor into an honest decision workspace', async (choice, expectedLabel) => {
    const user = await reachRootCause();
    await user.click(screen.getByRole('radio', { name: new RegExp(`^${choice}`) }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    for (const radio of screen.getAllByRole('radio', { name: 'Not sure' }).slice(0, 3)) await user.click(radio);
    await user.click(screen.getByRole('radio', { name: 'Within a month' }));
    await user.click(screen.getByRole('button', { name: 'See realistic paths' }));
    expect(screen.getByRole('heading', { name: 'Your Keep Luna Home Plan' })).toBeInTheDocument();
    expect(screen.getAllByText(expectedLabel).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Sign in to save Luna’s plan' })).toBeInTheDocument();
  });

  it('finishes the shortened Behavior pathway in the decision workspace', async () => {
    const user = await reachRootCause();
    await user.click(screen.getByRole('radio', { name: /^Behavior/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('checkbox', { name: 'Barking or excessive noise' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: 'Frustrating, but manageable' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    for (const radio of screen.getAllByRole('radio', { name: 'Not sure' }).slice(0, 3)) await user.click(radio);
    await user.click(screen.getByRole('radio', { name: 'Within a month' }));
    await user.click(screen.getByRole('button', { name: 'See realistic paths' }));
    expect(screen.getByRole('heading', { name: 'Your Keep Luna Home Plan' })).toBeInTheDocument();
    expect(screen.getAllByText('Behavior').length).toBeGreaterThan(0);
  });

  it('protects the Luna Housing golden path through the decision workspace', async () => {
    await reachHousingPlan();

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
    expect(screen.queryByRole('button', { name: /I’ll try this plan/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in to save Luna’s plan' })).toBeInTheDocument();
  });

  it('shows the immediate Behavior safety notice', async () => {
    const user = await reachRootCause();
    await user.click(screen.getByRole('radio', { name: /^Behavior/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('checkbox', { name: 'Barking or excessive noise' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: /immediate safety concern/ }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Safety comes first.');
  });

  it('shows the same safety notice for an already-structured immediate safety fact', () => {
    sessionStorage.setItem(ASSESSMENT_SESSION_KEY, JSON.stringify({
      version: ASSESSMENT_SESSION_VERSION,
      caseState: {
        ...initialAssessmentCase,
        petName: 'Luna', petType: 'dog', rootCause: 'behavior', selectedFactors: ['behavior'], currentScreen: 'behavior-2',
        behavior: { ...initialAssessmentCase.behavior, seriousness: 'There’s an immediate safety concern' },
      },
    }));
    renderHome();
    expect(screen.getByRole('dialog')).toHaveTextContent('Safety comes first.');
  });

  it('reaches Responsible Rehoming from the rehoming outcome', async () => {
    sessionStorage.setItem(ASSESSMENT_SESSION_KEY, JSON.stringify({
      version: ASSESSMENT_SESSION_VERSION,
      caseState: {
        ...initialAssessmentCase,
        petName: 'Luna', petType: 'dog', rootCause: 'housing', selectedFactors: ['housing'],
        housing: { situation: 'My landlord or property says pets aren’t allowed', urgency: 'This week', goal: 'Stay where I am' },
        outcome: 'rehomingHelp', currentScreen: 'outcome-rehoming',
      },
    }));
    const user = userEvent.setup();
    renderHome();
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
        selectedFactors: ['housing'],
        housing: {
          situation: 'My landlord or property says pets aren’t allowed',
          urgency: 'This week',
          goal: 'Stay where I am',
        },
        currentScreen: 'housing-3',
      },
    }));

    renderHome();

    expect(screen.getByRole('heading', { name: /stay where you are or move/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Stay where I am' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Back to previous question' }));
    expect(screen.getByRole('radio', { name: 'This week' })).toBeChecked();
  });

  it('discards invalid persisted state and starts safely at the homepage', () => {
    sessionStorage.setItem(ASSESSMENT_SESSION_KEY, '{not valid json');

    renderHome();

    expect(screen.getByRole('heading', { name: /Before you give them up/ })).toBeInTheDocument();
    expect(sessionStorage.getItem(ASSESSMENT_SESSION_KEY)).toBeNull();
  });

  it('records one logical transition for Root Cause selection', async () => {
    const user = await reachRootCause();
    const pushState = vi.spyOn(window.history, 'pushState');

    await user.click(screen.getByRole('radio', { name: /^Housing/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(pushState).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'What’s happening with your housing?' })).toBeInTheDocument();
  });

  it('moves backward and forward through logical screens with browser history', async () => {
    const user = await enterLuna();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: /main pressure/ })).toBeInTheDocument();

    window.history.back();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tell us what’s happening.' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Prefer to answer step by step?' }));
    expect(screen.getByLabelText(/Pet name/)).toHaveValue('Luna');

    window.history.forward();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /main pressure/ })).toBeInTheDocument();
    });
  });

  it('continues locally when backend case creation fails', async () => {
    vi.spyOn(caseApi, 'createCase').mockRejectedValue(new Error('API unavailable'));
    const user = await enterLuna();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('heading', { name: /main pressure/ })).toBeInTheDocument();
  });

  it('keeps anonymous assessment local instead of creating a claimable backend case', async () => {
    const createCase = vi.spyOn(caseApi, 'createCase').mockResolvedValue(backendCase);
    const user = await enterLuna();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: /^Housing/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const stored = JSON.parse(sessionStorage.getItem(ASSESSMENT_SESSION_KEY) ?? '{}');
    expect(stored.caseState?.petName).toBe('Luna');
    expect(stored.caseState?.backendCaseId).toBeUndefined();
    expect(createCase).not.toHaveBeenCalled();
  });

  it('continues navigation without private API updates for an unsaved assessment', async () => {
    const update = vi.spyOn(caseApi, 'updateCase').mockRejectedValue(new Error('API unavailable'));
    const user = await enterLuna();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: /^Housing/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('heading', { name: 'What’s happening with your housing?' })).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it('does not expose premature outcome tracking or write a private case', async () => {
    const recordOutcome = vi.spyOn(caseApi, 'recordOutcome').mockResolvedValue({});
    await reachHousingPlan();

    expect(screen.queryByRole('button', { name: /I’ll try this plan/ })).not.toBeInTheDocument();
    expect(recordOutcome).not.toHaveBeenCalled();
  });
});
