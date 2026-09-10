import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ZodType } from 'zod';

export const methodNotAllowed = (response: VercelResponse, allowed: string[]) => {
  response.setHeader('Allow', allowed.join(', '));
  return response.status(405).json({ error: 'Method not allowed' });
};

export const parseBody = <T>(request: VercelRequest, schema: ZodType<T>) => {
  try {
    let body: unknown = request.body;
    if (typeof body === 'string') body = JSON.parse(body);
    return schema.safeParse(body);
  } catch {
    return schema.safeParse(undefined);
  }
};

export const safeServerError = (response: VercelResponse) =>
  response.status(500).json({ error: 'Unable to complete the request' });
