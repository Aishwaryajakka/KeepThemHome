import { afterEach, describe, expect, it, vi } from 'vitest';
import { caseApi, configureAuthTokenProvider } from '@/lib/case-api';

describe('authenticated case API client', () => {
  afterEach(() => {
    configureAuthTokenProvider(undefined);
    vi.unstubAllGlobals();
  });

  it('sends the Clerk session token as a Bearer token', async () => {
    configureAuthTokenProvider(async () => 'session-token');
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => new Response(JSON.stringify({ id: 'user-1', email: null }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await caseApi.getMe();
    expect(fetchMock).toHaveBeenCalledWith('/api/me', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer session-token' }),
    }));
  });

  it('rejects a failed atomic save instead of manufacturing a success', async () => {
    configureAuthTokenProvider(async () => 'session-token');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'Unable to complete the request' }), { status: 500 })));
    await expect(caseApi.saveAssessment({
      pet: { name: 'Luna', type: 'dog' },
      case: { primaryBarrier: 'housing' },
      factors: [{ factorType: 'primary_barrier', factorValue: 'housing', role: 'primary', source: 'structured' }],
    })).rejects.toThrow('status 500');
  });
});
