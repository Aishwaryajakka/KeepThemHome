import type { VercelRequest } from '@vercel/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authorizedPartyMatches, getAuthenticatedIdentity, normalizeAuthorizedParties } from '../auth/clerk.js';
import { getOrCreateAppUser } from '../services/auth-service.js';

describe('Clerk identity and internal user boundary', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('does not trust a browser-submitted identity when Clerk is unconfigured', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '');
    vi.stubEnv('CLERK_PUBLISHABLE_KEY', '');
    const identity = await getAuthenticatedIdentity({
      method: 'GET', url: '/api/me', headers: {}, body: { userId: 'user_spoofed', email: 'owner@example.test' },
    } as unknown as VercelRequest);
    expect(identity).toBeNull();
  });

  it('requires a Bearer token before invoking Clerk configuration', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '');
    vi.stubEnv('CLERK_PUBLISHABLE_KEY', '');
    await expect(getAuthenticatedIdentity({
      method: 'GET', url: '/api/me', headers: {},
    } as unknown as VercelRequest)).resolves.toBeNull();
  });

  it('reports an explicit configuration failure when CLERK_SECRET_KEY is missing', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '');
    vi.stubEnv('CLERK_PUBLISHABLE_KEY', 'pk_test_c3VtbWFyeS1lbXUtMjMxOS5jbGVyay5hY2NvdW50cy5kZXYk');
    await expect(getAuthenticatedIdentity({
      method: 'GET', url: '/api/me', headers: { authorization: 'Bearer header.payload.signature' },
    } as unknown as VercelRequest)).rejects.toMatchObject({
      name: 'ClerkConfigurationError',
      code: 'CLERK_SERVER_CONFIG_MISSING',
    });
  });

  it('normalizes production authorized parties and requires an exact token azp match', () => {
    const parties = normalizeAuthorizedParties('https://keep-them-home.vercel.app/');
    expect(parties).toEqual(['https://keep-them-home.vercel.app']);
    expect(authorizedPartyMatches('https://keep-them-home.vercel.app', parties)).toBe(true);
    expect(authorizedPartyMatches('http://localhost:3000', parties)).toBe(false);
  });

  it('upserts by stable auth subject so repeated or concurrent requests cannot create duplicate users', async () => {
    const returning = vi.fn(async () => [{ id: 'internal-a', authSubject: 'user_a', email: null }]);
    const onConflictDoUpdate = vi.fn(() => ({ returning }));
    const values = vi.fn(() => ({ onConflictDoUpdate }));
    const insert = vi.fn(() => ({ values }));
    const db = { insert } as never;
    const [first, second] = await Promise.all([
      getOrCreateAppUser({ subject: 'user_a' }, db),
      getOrCreateAppUser({ subject: 'user_a', email: 'new@example.test' }, db),
    ]);
    expect(first.id).toBe('internal-a');
    expect(second.id).toBe('internal-a');
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ authSubject: 'user_a' }));
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(2);
  });
});
