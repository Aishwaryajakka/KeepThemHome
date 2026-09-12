import { createClerkClient } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

export interface AuthenticatedIdentity {
  subject: string;
  email?: string;
}

export type IdentityResolver = (request: VercelRequest) => Promise<AuthenticatedIdentity | null>;

export interface ClerkVerificationDiagnostics {
  verificationStarted: () => void;
  verificationFinished: (success: boolean) => void;
  userIdResolved: (present: boolean) => void;
  tokenClaims: (claims: {
    iss: string | null; azp: string | null; aud: string | string[] | null; exp: number | null; nbf: number | null;
    subPresent: boolean; sidPresent: boolean;
  }) => void;
  configuration: (configuration: {
    authorizedParties: string[]; authorizedPartyMatch: boolean; frontendFapi: string | null;
    serverFapi: string | null; publishableFapiMatch: boolean;
  }) => void;
  verificationErrorCode: (code: string | null) => void;
  serverConfiguration: (configuration: {
    secretKeyPresent: boolean; secretKeyMode: 'sk_test_' | 'sk_live_' | 'missing_or_invalid';
    publishableKeyPresent: boolean; publishableKeyMode: 'pk_test_' | 'pk_live_' | 'missing_or_invalid';
    authorizedPartiesPresent: boolean;
  }) => void;
}

type SafeTokenClaims = { iss?: unknown; azp?: unknown; aud?: unknown; exp?: unknown; nbf?: unknown; sub?: unknown; sid?: unknown };

const decodeTokenClaims = (token: string): SafeTokenClaims => {
  try {
    const payload = token.split('.')[1];
    return payload ? JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SafeTokenClaims : {};
  } catch {
    return {};
  }
};

export const decodePublishableKeyFapi = (key: string | undefined) => {
  if (!key) return null;
  try {
    const encoded = key.replace(/^pk_(test|live)_/, '');
    const decoded = Buffer.from(encoded, 'base64').toString('utf8').replace(/\$$/, '');
    return /^[a-z0-9.-]+$/i.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
};

export const normalizeAuthorizedParties = (value: string | undefined) => value?.split(',')
  .map((party) => party.trim())
  .filter(Boolean)
  .map((party) => {
    try { return new URL(party).origin; } catch { throw new ClerkConfigurationError('CLERK_AUTHORIZED_PARTY_INVALID'); }
  }) ?? [];

export const authorizedPartyMatches = (azp: string | null, authorizedParties: string[]) =>
  Boolean(azp && authorizedParties.includes(azp));

class ClerkConfigurationError extends Error {
  constructor(public readonly code: string) {
    super('Clerk server configuration validation failed');
    this.name = 'ClerkConfigurationError';
  }
}

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

export const getAuthenticatedIdentity = async (
  request: VercelRequest,
  diagnostics?: ClerkVerificationDiagnostics,
): Promise<AuthenticatedIdentity | null> => {
  const authorization = request.headers.authorization;
  const authHeader = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!authHeader?.startsWith('Bearer ') || !authHeader.slice(7).trim()) {
    if (process.env.NODE_ENV === 'development') console.info('[auth] header present: no; Clerk user resolved: no');
    return null;
  }
  diagnostics?.verificationStarted();
  const token = authHeader.slice(7).trim();
  const claims = decodeTokenClaims(token);
  const safeClaims = {
    iss: typeof claims.iss === 'string' ? claims.iss : null,
    azp: typeof claims.azp === 'string' ? claims.azp : null,
    aud: typeof claims.aud === 'string' || (Array.isArray(claims.aud) && claims.aud.every((item) => typeof item === 'string')) ? claims.aud as string | string[] : null,
    exp: typeof claims.exp === 'number' ? claims.exp : null,
    nbf: typeof claims.nbf === 'number' ? claims.nbf : null,
    subPresent: typeof claims.sub === 'string' && Boolean(claims.sub),
    sidPresent: typeof claims.sid === 'string' && Boolean(claims.sid),
  };
  diagnostics?.tokenClaims(safeClaims);
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  diagnostics?.serverConfiguration({
    secretKeyPresent: Boolean(secretKey),
    secretKeyMode: secretKey?.startsWith('sk_test_') ? 'sk_test_' : secretKey?.startsWith('sk_live_') ? 'sk_live_' : 'missing_or_invalid',
    publishableKeyPresent: Boolean(publishableKey),
    publishableKeyMode: publishableKey?.startsWith('pk_test_') ? 'pk_test_' : publishableKey?.startsWith('pk_live_') ? 'pk_live_' : 'missing_or_invalid',
    authorizedPartiesPresent: Boolean(process.env.CLERK_AUTHORIZED_PARTIES),
  });
  if (!secretKey || !publishableKey) throw new ClerkConfigurationError('CLERK_SERVER_CONFIG_MISSING');
  const secretMode = secretKey.startsWith('sk_live_') ? 'live' : secretKey.startsWith('sk_test_') ? 'test' : null;
  const publishableMode = publishableKey.startsWith('pk_live_') ? 'live' : publishableKey.startsWith('pk_test_') ? 'test' : null;
  if (!secretMode || !publishableMode || secretMode !== publishableMode) throw new ClerkConfigurationError('CLERK_KEY_MODE_MISMATCH');
  const browserPublishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  const frontendFapi = decodePublishableKeyFapi(browserPublishableKey);
  const serverFapi = decodePublishableKeyFapi(publishableKey);
  const authorizedParties = normalizeAuthorizedParties(process.env.CLERK_AUTHORIZED_PARTIES);
  diagnostics?.configuration({
    authorizedParties,
    authorizedPartyMatch: authorizedPartyMatches(safeClaims.azp, authorizedParties),
    frontendFapi,
    serverFapi,
    publishableFapiMatch: Boolean(frontendFapi && serverFapi && frontendFapi === serverFapi),
  });
  if (browserPublishableKey && browserPublishableKey !== publishableKey) throw new ClerkConfigurationError('CLERK_PUBLISHABLE_KEY_MISMATCH');
  const client = createClerkClient({ secretKey, publishableKey });
  const state = await client.authenticateRequest(new Request(requestUrl(request), {
    method: request.method,
    headers: requestHeaders(request),
  }), {
    acceptsToken: 'session_token',
    ...(authorizedParties.length ? { authorizedParties } : {}),
  });
  if (!state.isAuthenticated) {
    diagnostics?.verificationErrorCode(state.reason);
    diagnostics?.verificationFinished(false);
    diagnostics?.userIdResolved(false);
    if (process.env.NODE_ENV === 'development') console.info('[auth] header present: yes; Clerk user resolved: no');
    return null;
  }
  diagnostics?.verificationErrorCode(null);
  diagnostics?.verificationFinished(true);
  const auth = state.toAuth();
  diagnostics?.userIdResolved(Boolean(auth.userId));
  if (!auth.userId) return null;
  if (process.env.NODE_ENV === 'development') console.info('[auth] header present: yes; Clerk user resolved: yes');
  const emailClaim = auth.sessionClaims?.email;
  return { subject: auth.userId, ...(typeof emailClaim === 'string' ? { email: emailClaim } : {}) };
};
