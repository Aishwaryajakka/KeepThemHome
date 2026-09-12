import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createActionsHandler } from '../api-handlers/cases/[id]/actions.js';
import { createActionHandler } from '../api-handlers/cases/[id]/actions/[actionId].js';
import { createActionOutcomeHandler } from '../api-handlers/cases/[id]/actions/[actionId]/outcome.js';

const caseId = '550e8400-e29b-41d4-a716-446655440000'; const actionId = '650e8400-e29b-41d4-a716-446655440000';
const response = () => { const json = vi.fn(); const value = { setHeader: vi.fn(), status: vi.fn(() => value), json } as unknown as VercelResponse; return { value, json }; };
const request = (method: string, body?: unknown) => ({ method, query: { id: caseId, actionId }, body }) as unknown as VercelRequest;
const owned = vi.fn(async () => ({ status: 'ok' as const } as never)); const foreign = vi.fn(async () => ({ status: 'not_found' as const }));

describe('action API', () => {
  it('creates only catalog-backed actions after ownership succeeds', async () => {
    const services = { addCaseAction: vi.fn(async () => ({ id: actionId })), listCaseActions: vi.fn(), listCaseEvents: vi.fn() };
    await createActionsHandler(owned, services as never)(request('POST', { pathKey: 'remain_in_current_housing', actionKey: 'contact_landlord' }), response().value);
    expect(services.addCaseAction).toHaveBeenCalledWith(caseId, 'remain_in_current_housing', 'contact_landlord');
  });
  it('requires a controlled reason for Not possible', async () => {
    const update = vi.fn(); const result = response(); await createActionHandler(owned, update)(request('PATCH', { status: 'NOT_POSSIBLE' }), result.value); expect(result.value.status).toHaveBeenCalledWith(400); expect(update).not.toHaveBeenCalled();
  });
  it('does not expose foreign actions', async () => {
    const update = vi.fn(); const result = response(); await createActionHandler(foreign, update)(request('PATCH', { status: 'COMPLETED' }), result.value); expect(result.value.status).toHaveBeenCalledWith(404); expect(update).not.toHaveBeenCalled();
  });
  it('accepts only controlled outcomes for completed owned actions', async () => {
    const record = vi.fn(async () => ({ status: 'ok' as const, changedFact: { field: 'housingResolutionPossible', value: true }, paths: [], transitions: [] })); const result = response(); await createActionOutcomeHandler(owned, record as never)(request('POST', { outcomeKey: 'LANDLORD_CONTACT_ALLOWED_STAY' }), result.value); expect(record).toHaveBeenCalledWith(caseId, actionId, 'LANDLORD_CONTACT_ALLOWED_STAY', undefined); expect(result.value.status).toHaveBeenCalledWith(200);
  });
});
