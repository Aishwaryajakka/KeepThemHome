import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyPetsPage from '@/pages/MyPetsPage';
import { caseApi, SAVED_PLANS_CHANGED_EVENT } from '@/lib/case-api';

const signedInAuth = () => ({ configured: true, loaded: true, signedIn: true, serverReady: true, status: 'SIGNED_IN_READY' as const, error: null, signingOut: false, openSignIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() });
let authState = signedInAuth();

vi.mock('@/components/Header', () => ({ default: () => <header>Keep Them Home</header> }));
vi.mock('@/components/AppHeader', () => ({ default: () => <header>Keep Them Home app</header> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer>People and pets belong together.</footer> }));
vi.mock('@/auth/AuthProvider', () => ({
  useAppAuth: () => authState,
}));

const savedLuna = {
  case: {
    id: '550e8400-e29b-41d4-a716-446655440000', petName: 'Luna', petType: 'dog', primaryBarrier: 'housing',
    urgency: 'This week', goal: 'Stay where I am', currentStatus: 'active', userId: 'user-1', petId: 'pet-1',
    createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z',
  },
  pet: { id: 'pet-1', userId: 'user-1', name: 'Luna', type: 'dog', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z' },
  factors: [{ id: 'factor-1', caseId: '550e8400-e29b-41d4-a716-446655440000', factorType: 'behavior_contributor', factorValue: 'behavior', role: 'contributing', source: 'structured', confidence: null, createdAt: '2026-09-01T00:00:00.000Z' }],
  latestOutcome: null,
};

const Location = () => <output aria-label="Current location">{useLocation().pathname}{useLocation().search}</output>;
const renderPage = () => render(<MemoryRouter><MyPetsPage /><Location /></MemoryRouter>);

describe('My Pets continuation dashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authState = signedInAuth();
    vi.spyOn(caseApi, 'listPets').mockResolvedValue([savedLuna.pet] as never);
  });

  it('distinguishes signed-out and request-error states', async () => {
    authState = { ...authState, signedIn: false, serverReady: false, status: 'SIGNED_OUT' };
    const { unmount } = renderPage();
    expect(screen.getByRole('heading', { name: 'Sign in to see your pets.' })).toBeInTheDocument();
    expect(screen.getByText('Your pets, cases, and actions are securely connected to your account.')).toBeInTheDocument();
    unmount();

    authState = signedInAuth();
    vi.spyOn(caseApi, 'listCases').mockRejectedValue(new Error('Unauthorized'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load your pets right now.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('does not collapse a Clerk session with a failed server check into signed out', () => {
    const retry = vi.fn();
    authState = { ...signedInAuth(), serverReady: false, status: 'AUTH_ERROR', error: 'We’re signed in, but couldn’t connect your account.', retry };
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('We’re signed in, but couldn’t connect your account.');
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows an intentional loading state', () => {
    vi.spyOn(caseApi, 'listCases').mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByRole('status', { name: 'Loading pets' })).toBeInTheDocument();
  });

  it('shows the warm empty state', async () => {
    vi.spyOn(caseApi, 'listPets').mockResolvedValue([]);
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'You haven’t started a case yet.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tell us what’s happening' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Luna Demo' })).toBeInTheDocument();
  });

  it('refetches saved plans when a successful save invalidates My Pets', async () => {
    const listPets = vi.spyOn(caseApi, 'listPets').mockResolvedValue([]);
    const listCases = vi.spyOn(caseApi, 'listCases').mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'You haven’t started a case yet.' })).toBeInTheDocument();

    listCases.mockResolvedValue([savedLuna] as never);
    listPets.mockResolvedValue([savedLuna.pet] as never);
    vi.spyOn(caseApi, 'getRetentionPaths').mockRejectedValue(new Error('Path unavailable'));
    window.dispatchEvent(new Event(SAVED_PLANS_CHANGED_EVENT));

    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument();
    expect(listCases).toHaveBeenCalledTimes(2);
    expect(listPets).toHaveBeenCalledTimes(2);
  });

  it('treats a pets request failure as an error instead of an empty account', async () => {
    vi.spyOn(caseApi, 'listPets').mockRejectedValue(new Error('Method not allowed'));
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load your pets right now.');
  });

  it('creates a pet through the authenticated API and refreshes server data', async () => {
    const user = userEvent.setup();
    const listPets = vi.spyOn(caseApi, 'listPets').mockResolvedValue([]);
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([]);
    const createPet = vi.spyOn(caseApi, 'createPet').mockResolvedValue({ ...savedLuna.pet, id: 'pet-milo', name: 'Milo' } as never);
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Add Pet' }));
    await user.type(screen.getByRole('textbox', { name: 'Pet name' }), 'Milo');
    await user.click(screen.getByRole('button', { name: 'Save Pet' }));
    expect(createPet).toHaveBeenCalledWith({ name: 'Milo', type: 'dog' });
    expect(listPets).toHaveBeenCalledTimes(2);
  });

  it('starts a case for an existing pet without creating a duplicate pet', async () => {
    const user = userEvent.setup();
    vi.spyOn(caseApi, 'listPets').mockResolvedValue([savedLuna.pet] as never);
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([]);
    const createCase = vi.spyOn(caseApi, 'createCase').mockResolvedValue(savedLuna.case as never);
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Start a case' }));
    expect(createCase).toHaveBeenCalledWith({ petId: 'pet-1', primaryBarrier: null, urgency: null, goal: null, currentStatus: 'ACTIVE' });
    expect(screen.getByRole('status', { name: 'Current location' })).toHaveTextContent(`/pets/pet-1/cases/${savedLuna.case.id}`);
  });

  it('confirms before deleting a pet and refetches server state after success', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([savedLuna] as never);
    vi.spyOn(caseApi, 'getRetentionPaths').mockRejectedValue(new Error('not needed'));
    const deletePet = vi.spyOn(caseApi, 'deletePet').mockResolvedValue({ deleted: true, petId: 'pet-1' });
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit Pet' }));
    await user.click(screen.getByRole('button', { name: 'Delete Luna' }));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("delete Luna's saved cases and progress"));
    expect(deletePet).toHaveBeenCalledWith('pet-1');
  });

  it('shows a saved pet with its trusted current path and blockers', async () => {
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([savedLuna] as never);
    vi.spyOn(caseApi, 'getRetentionPaths').mockResolvedValue({
      caseId: savedLuna.case.id,
      facts: { primaryBarrier: 'housing', situation: null, urgency: 'This week', goal: 'Stay where I am', behaviorContributor: true, costConstraint: null },
      appliedChanges: [],
      paths: [{
        key: 'remain_in_current_housing', title: 'Stay in current housing with your pet', objective: 'Remain together',
        status: 'CONDITIONAL', statusReason: 'Two facts need confirmation.', reasonCodes: [], rankScore: 10, friction: 1,
        blockers: [
          { code: 'UNKNOWN_PRECONDITION', type: 'PRECONDITION', field: 'housingResolutionPossible', currentValue: 'unknown', requiredCondition: 'Housing can be resolved', status: 'UNKNOWN', label: 'Housing resolution is not confirmed.' },
          { code: 'UNKNOWN_PRECONDITION', type: 'PRECONDITION', field: 'behaviorMitigationAvailable', currentValue: 'unknown', requiredCondition: 'Behavior support exists', status: 'UNKNOWN', label: 'Behavior support is not confirmed.' },
        ],
        steps: [],
      }],
    });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument();
    expect(screen.getByText('Stay in current housing with your pet')).toBeInTheDocument();
    expect(screen.getByText('Conditional')).toBeInTheDocument();
    expect(screen.getByText('2 blockers remaining')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue Luna’s case/ })).toBeInTheDocument();
  });

  it('shows persisted actions and continues with the persisted pet and case IDs', async () => {
    const user = userEvent.setup();
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([savedLuna] as never);
    vi.spyOn(caseApi, 'getRetentionPaths').mockRejectedValue(new Error('Path unavailable'));
    vi.spyOn(caseApi, 'getActions').mockResolvedValue({ actions: [{ id: 'action-1', caseId: savedLuna.case.id, pathKey: 'remain_in_current_housing', actionKey: 'contact_landlord', interventionKey: null, relatedFact: 'housingResolutionPossible', title: 'Contact landlord', description: 'Confirm the terms.', status: 'IN_PROGRESS', notPossibleReason: null, resultNote: null, outcomeKey: null, createdAt: '2026-09-10T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z', completedAt: null }], events: [], recommended: [] });
    renderPage();
    expect(await screen.findByText('Contact landlord')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Continue Luna’s case/ }));
    expect(screen.getByRole('status', { name: 'Current location' })).toHaveTextContent(`/pets/pet-1/cases/${savedLuna.case.id}`);
  });

  it('shows a reported keeping outcome without presenting the case as urgent', async () => {
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([{ ...savedLuna, case: { ...savedLuna.case, currentStatus: 'KEEPING_PET' }, latestOutcome: { id: 'outcome-1', caseId: savedLuna.case.id, status: 'KEEPING_PET', unresolvedBarrier: null, notes: null, helpfulFactors: ['HOUSING_RESOLUTION'], createdAt: '2026-09-12T00:00:00.000Z' } }] as never);
    vi.spyOn(caseApi, 'getRetentionPaths').mockRejectedValue(new Error('not needed'));
    renderPage();
    expect(await screen.findByText('Keeping pet')).toBeInTheDocument();
    expect(screen.getByText('Luna is staying home')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View case history/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How are things with Luna?' })).toBeInTheDocument();
  });
});
