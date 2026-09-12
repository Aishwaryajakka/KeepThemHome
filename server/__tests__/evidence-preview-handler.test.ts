import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import handler from '../api-handlers/evidence/preview.js';

const responseDouble = () => {
  const json = vi.fn();
  const response = { status: vi.fn(() => response), json, setHeader: vi.fn() } as unknown as VercelResponse;
  return { response, json };
};

describe('evidence preview requests', () => {
  it('accepts modeled non-housing path keys used by the normal workspace', async () => {
    const { response } = responseDouble();
    await handler({ method: 'POST', body: {
      pathKey: 'manage_behavior_at_home',
      primaryBarrier: 'behavior',
      situation: null,
      urgency: 'This week',
      goal: null,
      behaviorContributor: false,
      costConstraint: null,
      contributingBarriers: [],
    } } as unknown as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.status).not.toHaveBeenCalledWith(400);
  });

  it('rejects malformed path keys before evidence selection', async () => {
    const { response } = responseDouble();
    await handler({ method: 'POST', body: {
      pathKey: '../not-a-path', primaryBarrier: 'behavior', situation: null, urgency: null, goal: null,
      behaviorContributor: false, costConstraint: null, contributingBarriers: [],
    } } as unknown as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(400);
  });
});
