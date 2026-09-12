import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import { createIntakeHandler } from '../api-handlers/intake/extract.js';
import { ExtractionFailedError } from '../intake/groq.js';
import { lunaExtraction } from './intake.test.js';

const responseDouble = () => {
  const response = {
    status: vi.fn(), json: vi.fn(), setHeader: vi.fn(),
  } as unknown as VercelResponse;
  vi.mocked(response.status).mockReturnValue(response);
  vi.mocked(response.json).mockReturnValue(response);
  return response;
};

describe('POST /api/intake/extract', () => {
  it('validates the request before calling Groq', async () => {
    const extract = vi.fn();
    const response = responseDouble();
    await createIntakeHandler(extract)({ method: 'POST', body: { text: '' } } as VercelRequest, response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(extract).not.toHaveBeenCalled();
  });

  it('returns extraction and deterministic follow-ups', async () => {
    const response = responseDouble();
    await createIntakeHandler(vi.fn().mockResolvedValue(lunaExtraction))(
      { method: 'POST', body: { text: 'Luna story' } } as VercelRequest,
      response,
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ extraction: lunaExtraction }));
  });

  it('returns a safe fallback and no partial response on provider failure', async () => {
    const response = responseDouble();
    await createIntakeHandler(vi.fn().mockRejectedValue(new ExtractionFailedError('raw provider detail')))(
      { method: 'POST', body: { text: 'private owner story' } } as VercelRequest,
      response,
    );
    expect(response.status).toHaveBeenCalledWith(502);
    const payload = vi.mocked(response.json).mock.calls[0][0];
    expect(payload).not.toHaveProperty('extraction');
    expect(JSON.stringify(payload)).not.toContain('raw provider detail');
    expect(JSON.stringify(payload)).not.toContain('private owner story');
  });
});
