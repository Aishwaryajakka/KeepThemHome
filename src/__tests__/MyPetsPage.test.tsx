import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyPetsPage from '@/pages/MyPetsPage';
import { caseApi, SAVED_PLANS_CHANGED_EVENT } from '@/lib/case-api';

let authState = { configured: true, loaded: true, signedIn: true, openSignIn: vi.fn(), signOut: vi.fn() };

vi.mock('@/components/Header', () => ({ default: () => <header>Keep Them Home</header> }));
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

const renderPage = () => render(<MemoryRouter><MyPetsPage /></MemoryRouter>);

describe('My Pets continuation dashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authState = { configured: true, loaded: true, signedIn: true, openSignIn: vi.fn(), signOut: vi.fn() };
  });

  it('distinguishes signed-out and request-error states', async () => {
    authState = { ...authState, signedIn: false };
    const { unmount } = renderPage();
    expect(screen.getByRole('heading', { name: 'Your saved plans live here.' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to return to plans you’ve saved for your pets.')).toBeInTheDocument();
    unmount();

    authState = { ...authState, signedIn: true };
    vi.spyOn(caseApi, 'listCases').mockRejectedValue(new Error('Unauthorized'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load your saved plans.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows an intentional loading state', () => {
    vi.spyOn(caseApi, 'listCases').mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByRole('status', { name: 'Loading saved plans' })).toBeInTheDocument();
  });

  it('shows the warm empty state', async () => {
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'No saved plans yet.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find options for my pet' })).toBeInTheDocument();
  });

  it('refetches saved plans when a successful save invalidates My Pets', async () => {
    const listCases = vi.spyOn(caseApi, 'listCases').mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'No saved plans yet.' })).toBeInTheDocument();

    listCases.mockResolvedValue([savedLuna] as never);
    vi.spyOn(caseApi, 'getRetentionPaths').mockRejectedValue(new Error('Path unavailable'));
    window.dispatchEvent(new Event(SAVED_PLANS_CHANGED_EVENT));

    expect(await screen.findByRole('heading', { name: 'Luna' })).toBeInTheDocument();
    expect(listCases).toHaveBeenCalledTimes(2);
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
    expect(screen.getByRole('button', { name: /Continue Luna’s plan/ })).toBeInTheDocument();
  });

  it('shows a reported keeping outcome without presenting the case as urgent', async () => {
    vi.spyOn(caseApi, 'listCases').mockResolvedValue([{ ...savedLuna, case: { ...savedLuna.case, currentStatus: 'KEEPING_PET' }, latestOutcome: { id: 'outcome-1', caseId: savedLuna.case.id, status: 'KEEPING_PET', unresolvedBarrier: null, notes: null, helpfulFactors: ['HOUSING_RESOLUTION'], createdAt: '2026-09-12T00:00:00.000Z' } }] as never);
    vi.spyOn(caseApi, 'getRetentionPaths').mockRejectedValue(new Error('not needed'));
    renderPage();
    expect(await screen.findByText('Keeping pet')).toBeInTheDocument();
    expect(screen.getByText('Luna is staying home')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View plan history/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How are things with Luna?' })).toBeInTheDocument();
  });
});
