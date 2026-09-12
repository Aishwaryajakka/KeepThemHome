import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createMeHandler } from '../api-handlers/me.js';
import { createPetsHandler } from '../api-handlers/pets.js';
import { createPetHandler } from '../api-handlers/pets/[id].js';
import { createCasesHandler } from '../api-handlers/cases.js';
import { createCaseHandler } from '../api-handlers/cases/[id].js';
import { createFactorsHandler } from '../api-handlers/cases/[id]/factors.js';
import { createOutcomesHandler } from '../api-handlers/cases/[id]/outcomes.js';
import { createPathsHandler } from '../api-handlers/cases/[id]/paths.js';

const caseId = '550e8400-e29b-41d4-a716-446655440000';
const petId = '650e8400-e29b-41d4-a716-446655440000';
const userA = { id: '750e8400-e29b-41d4-a716-446655440000', authSubject: 'user_a', email: 'a@example.test', createdAt: new Date('2026-09-12T00:00:00.000Z') };
const responseDouble = () => {
  const json = vi.fn();
  const response = { setHeader: vi.fn(), status: vi.fn(() => response), json } as unknown as VercelResponse;
  return { response, json };
};
const request = (method: string, body: unknown = undefined, id = caseId) => ({
  method,
  query: { id },
  body,
  headers: { authorization: 'Bearer test-token' },
}) as unknown as VercelRequest;
const owned = vi.fn(async () => ({ status: 'ok' as const, user: userA, caseRecord: { id: caseId } } as never));
const foreign = vi.fn(async () => ({ status: 'not_found' as const }));
const signedOut = vi.fn(async () => null);

describe('authenticated application boundary', () => {
  it('returns 401 before user resolution when the Authorization header is missing', async () => {
    const resolver = vi.fn();
    const { response } = responseDouble();
    await createMeHandler(resolver)({ method: 'GET', query: {}, headers: {} } as unknown as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(resolver).not.toHaveBeenCalled();
  });

  it('returns 401 before user resolution when the header is not a Bearer token', async () => {
    const resolver = vi.fn();
    const { response } = responseDouble();
    await createMeHandler(resolver)({ method: 'GET', query: {}, headers: { authorization: 'Basic credentials' } } as unknown as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(resolver).not.toHaveBeenCalled();
  });

  it('returns 401 for a signed-out protected request', async () => {
    const { response } = responseDouble();
    await createMeHandler(signedOut)(request('GET'), response);
    expect(response.status).toHaveBeenCalledWith(401);
  });

  it('returns only normalized internal identity, never Clerk authority fields', async () => {
    const { response, json } = responseDouble();
    await createMeHandler(vi.fn(async () => userA as never))(request('GET'), response);
    expect(json).toHaveBeenCalledWith({ user: { id: userA.id, clerkUserId: userA.authSubject, email: userA.email, createdAt: userA.createdAt } });
  });

  it('returns a controlled 500 when authenticated user linkage fails', async () => {
    const { response, json } = responseDouble();
    await createMeHandler(vi.fn(async () => { throw new Error('database unavailable'); }))(request('GET'), response);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'account_linkage_failed', requestId: expect.any(String) }));
  });

  it('scopes pet creation and listing to the authenticated internal user', async () => {
    const services = { createOwnedPet: vi.fn(async () => ({ id: petId } as never)), listOwnedPets: vi.fn(async () => []) };
    const handler = createPetsHandler(vi.fn(async () => userA as never), services as never);
    await handler(request('POST', { name: 'Luna', type: 'dog' }), responseDouble().response);
    expect(services.createOwnedPet).toHaveBeenCalledWith(userA.id, { name: 'Luna', type: 'dog' });
    await handler(request('GET'), responseDouble().response);
    expect(services.listOwnedPets).toHaveBeenCalledWith(userA.id);
  });

  it('rejects browser-spoofed pet ownership fields', async () => {
    const services = { createOwnedPet: vi.fn(), listOwnedPets: vi.fn() };
    const { response } = responseDouble();
    await createPetsHandler(vi.fn(async () => userA as never), services as never)(request('POST', { name: 'Luna', type: 'dog', userId: 'user-b' }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(services.createOwnedPet).not.toHaveBeenCalled();
  });

  it('uses privacy-preserving 404 for another user pet and scopes updates', async () => {
    const services = { getOwnedPet: vi.fn(async () => undefined), updateOwnedPet: vi.fn() };
    const { response } = responseDouble();
    await createPetHandler(vi.fn(async () => userA as never), services as never)(request('GET', undefined, petId), response);
    expect(services.getOwnedPet).toHaveBeenCalledWith(userA.id, petId);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it('creates a case only for a pet already scoped to the authenticated user', async () => {
    const pet = { id: petId, userId: userA.id, name: 'Luna', type: 'dog' };
    const services = { getOwnedPet: vi.fn(async () => pet as never), createOwnedCase: vi.fn(async () => ({ id: caseId } as never)), listOwnedCases: vi.fn() };
    await createCasesHandler(vi.fn(async () => userA as never), services as never)(request('POST', { petId, primaryBarrier: 'housing' }), responseDouble().response);
    expect(services.getOwnedPet).toHaveBeenCalledWith(userA.id, petId);
    expect(services.createOwnedCase).toHaveBeenCalledWith(userA.id, pet, { petId, primaryBarrier: 'housing' });
  });

  it('cannot attach a case to another user pet', async () => {
    const services = { getOwnedPet: vi.fn(async () => undefined), createOwnedCase: vi.fn(), listOwnedCases: vi.fn() };
    const { response } = responseDouble();
    await createCasesHandler(vi.fn(async () => userA as never), services as never)(request('POST', { petId }), response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(services.createOwnedCase).not.toHaveBeenCalled();
  });

  it('rejects browser-supplied case ownership fields', async () => {
    const services = { getOwnedPet: vi.fn(), createOwnedCase: vi.fn(), listOwnedCases: vi.fn() };
    const { response } = responseDouble();
    await createCasesHandler(vi.fn(async () => userA as never), services as never)(request('POST', { petId, userId: 'user-b' }), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it('lists cases using authenticated scope only', async () => {
    const services = { getOwnedPet: vi.fn(), createOwnedCase: vi.fn(), listOwnedCases: vi.fn(async () => []) };
    await createCasesHandler(vi.fn(async () => userA as never), services as never)(request('GET'), responseDouble().response);
    expect(services.listOwnedCases).toHaveBeenCalledWith(userA.id);
  });

  it('returns 404 for a foreign case without loading factors or outcomes', async () => {
    const services = { getOwnedCase: vi.fn(async () => undefined), getOwnedPet: vi.fn(), getCaseFactors: vi.fn(), getOutcomes: vi.fn(), updateOwnedCase: vi.fn() };
    const { response } = responseDouble();
    await createCaseHandler(vi.fn(async () => userA as never), services as never)(request('GET'), response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(services.getCaseFactors).not.toHaveBeenCalled();
  });

  it('prevents ownership columns from being patched', async () => {
    const services = { getOwnedCase: vi.fn(async () => ({ id: caseId } as never)), getOwnedPet: vi.fn(), getCaseFactors: vi.fn(), getOutcomes: vi.fn(), updateOwnedCase: vi.fn() };
    const { response } = responseDouble();
    await createCaseHandler(vi.fn(async () => userA as never), services as never)(request('PATCH', { userId: 'user-b', petId }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(services.updateOwnedCase).not.toHaveBeenCalled();
  });

  it('requires ownership for factors and outcomes', async () => {
    const factorResponse = responseDouble();
    await createFactorsHandler(foreign)(request('GET'), factorResponse.response);
    expect(factorResponse.response.status).toHaveBeenCalledWith(404);
    const outcomeResponse = responseDouble();
    await createOutcomesHandler(foreign)(request('POST', { status: 'keeping' }), outcomeResponse.response);
    expect(outcomeResponse.response.status).toHaveBeenCalledWith(404);
  });

  it('blocks solver execution before computation for a foreign case', async () => {
    const solver = vi.fn();
    const { response } = responseDouble();
    await createPathsHandler(solver, foreign)(request('POST', {}), response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(solver).not.toHaveBeenCalled();
  });

  it('allows solver execution after ownership succeeds without changing its result', async () => {
    const result = { caseId, paths: [{ key: 'trusted', status: 'CONDITIONAL', blockers: ['unknown'] }] };
    const solver = vi.fn(async () => result as never);
    const { json } = responseDouble();
    await createPathsHandler(solver, owned)(request('POST', {}), { status: vi.fn(() => ({ json })), json } as never);
    expect(solver).toHaveBeenCalledWith(caseId, []);
    expect(json).toHaveBeenCalledWith(result);
  });
});
