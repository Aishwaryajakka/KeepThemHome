import { createClerkClient } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

export interface AuthenticatedIdentity {
  subject: string;
  email?: string;
}

export type IdentityResolver = (request: VercelRequest) => Promise<AuthenticatedIdentity | null>;

const requestUrl = (request: VercelRequest) => {
  const protocol = request.headers['x-forwarded-proto'] ?? 'https';
  const host = request.headers['x-forwarded-host'] ?? request.headers.host ?? 'localhost';
  return new URL(request.url ?? '/', `${Array.isArray(protocol) ? protocol[0] : protocol}://${Array.isArray(host) ? host[0] : host}`);
};

const requestHeaders = (request: VercelRequest) => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(',') : value);
  }
  return headers;
};

export const getAuthenticatedIdentity: IdentityResolver = async (request) => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) return null;
  const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES?.split(',').map((value) => value.trim()).filter(Boolean);
  const client = createClerkClient({ secretKey, publishableKey });
  const state = await client.authenticateRequest(new Request(requestUrl(request), {
    method: request.method,
    headers: requestHeaders(request),
  }), {
    acceptsToken: 'session_token',
    ...(authorizedParties?.length ? { authorizedParties } : {}),
  });
  if (!state.isAuthenticated) return null;
  const auth = state.toAuth();
  if (!auth.userId) return null;
  const emailClaim = auth.sessionClaims?.email;
  return { subject: auth.userId, ...(typeof emailClaim === 'string' ? { email: emailClaim } : {}) };
};
