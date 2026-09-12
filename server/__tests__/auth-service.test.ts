import type { VercelRequest } from '@vercel/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthenticatedIdentity } from '../auth/clerk.js';
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
