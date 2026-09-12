import { describe, expect, it, vi } from 'vitest';
import { resolveClerkUserByUsername } from '../services/demo-user-seed-service.js';

describe('demo user seed identity resolution', () => {
  it('resolves the exact Clerk username without using credentials or a hardcoded user ID', async () => {
    const getUsers = vi.fn().mockResolvedValue([
      { id: 'user_demo', username: 'demouser' },
      { id: 'user_partial', username: 'demouser-two' },
    ]);
    await expect(resolveClerkUserByUsername('demouser', undefined, getUsers)).resolves.toEqual({ id: 'user_demo', username: 'demouser' });
    expect(getUsers).toHaveBeenCalledWith('demouser');
  });

  it('fails closed when Clerk does not return exactly one matching user', async () => {
    await expect(resolveClerkUserByUsername('demouser', undefined, async () => [])).rejects.toThrow('found 0');
  });
});
