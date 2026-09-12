import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createExplainHandler } from '../api-handlers/cases/[id]/explain.js';

const caseId = '550e8400-e29b-41d4-a716-446655440000';
const owned = vi.fn(async () => ({ status: 'ok' as const, user: { id: 'user-a' }, caseRecord: { id: caseId } } as never));
const responseDouble = () => {
  const response = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() } as unknown as VercelResponse;
  vi.mocked(response.status).mockReturnValue(response);
  vi.mocked(response.json).mockReturnValue(response);
  return response;
};

describe('POST /api/cases/:id/explain', () => {
  it('rejects browser-supplied status, ranking, and blockers', async () => {
    const explain = vi.fn();
    const handler = createExplainHandler(explain, owned);
    for (const extra of [{ status: 'FEASIBLE' }, { rank: 1 }, { blockers: [] }]) {
      const response = responseDouble();
      await handler({
        method: 'POST', query: { id: caseId },
        body: { pathKey: 'move_with_pet', mode: 'PATH_SUMMARY', ...extra },
      } as unknown as VercelRequest, response);
      expect(response.status).toHaveBeenCalledWith(400);
    }
    expect(explain).not.toHaveBeenCalled();
  });

  it('passes only validated identifiers and supported what-if codes to recomputation', async () => {
    const result = { explanation: {}, source: 'generated', grounded: {} } as never;
    const explain = vi.fn().mockResolvedValue(result);
    const response = responseDouble();
    await createExplainHandler(explain, owned)({
      method: 'POST', query: { id: caseId },
      body: { pathKey: 'move_with_pet', mode: 'UNLOCK_EXPLANATION', appliedChanges: ['ALLOW_STAY_OR_MOVE'] },
    } as unknown as VercelRequest, response);
    expect(explain).toHaveBeenCalledWith(caseId, 'move_with_pet', 'UNLOCK_EXPLANATION', ['ALLOW_STAY_OR_MOVE']);
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('does not generate an explanation for a foreign case', async () => {
    const explain = vi.fn();
    const response = responseDouble();
    await createExplainHandler(explain, vi.fn(async () => ({ status: 'not_found' as const })))({
      method: 'POST', query: { id: caseId }, body: { pathKey: 'move_with_pet', mode: 'PATH_SUMMARY' },
    } as unknown as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(explain).not.toHaveBeenCalled();
  });
});
