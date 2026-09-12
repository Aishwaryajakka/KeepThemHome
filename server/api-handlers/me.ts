import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed } from '../http.js';
import { authDiagnosticLog, getAuthRequestId, safeErrorDetails } from '../auth/diagnostics.js';
import { getAuthenticatedIdentity } from '../auth/clerk.js';
import { resolveOrCreateAppUser, type AppUserResolver } from '../services/auth-service.js';

type FailureStage = 'CLERK_VERIFY_FAILED' | 'CLERK_USER_ID_MISSING' | 'DB_CONNECTION_FAILED' | 'USER_LOOKUP_FAILED' | 'USER_CREATE_FAILED' | 'USER_SCHEMA_MISMATCH' | 'UNKNOWN_SERVER_ERROR';

const databaseFailureStage = (error: unknown, operation: 'lookup' | 'create'): FailureStage => {
  const { code } = safeErrorDetails(error);
  if (code === '42P01' || code === '42703') return 'USER_SCHEMA_MISMATCH';
  if (code && ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', '57P01', '57P02', '57P03'].includes(code)) return 'DB_CONNECTION_FAILED';
  return operation === 'create' ? 'USER_CREATE_FAILED' : 'USER_LOOKUP_FAILED';
};

const accountLinkageFailure = (response: VercelResponse, requestId: string, status = 500) => {
  authDiagnosticLog(requestId, `response_status=${status}`);
  return response.status(status).json({ error: 'account_linkage_failed', requestId });
};

export const createMeHandler = (resolveUser?: AppUserResolver) => async (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET']);
  const requestId = getAuthRequestId(request);
  const authorizationValue = request.headers?.authorization;
  const authorization = Array.isArray(authorizationValue) ? authorizationValue[0] : authorizationValue;
  const bearerTokenPresent = Boolean(authorization?.startsWith('Bearer ') && authorization.slice(7).trim());
  authDiagnosticLog(requestId, 'request_received');
  authDiagnosticLog(requestId, `authorization_header_present=${Boolean(authorization)}`);
  authDiagnosticLog(requestId, `bearer_token_present=${bearerTokenPresent}`);
  if (!authorization) {
    authDiagnosticLog(requestId, 'failure_stage=NO_AUTH_HEADER');
    authDiagnosticLog(requestId, 'response_status=401');
    return response.status(401).json({ error: 'Authentication required' });
  }
  if (!bearerTokenPresent) {
    authDiagnosticLog(requestId, 'failure_stage=NO_BEARER_TOKEN');
    authDiagnosticLog(requestId, 'response_status=401');
    return response.status(401).json({ error: 'Authentication required' });
  }
  try {
    if (resolveUser) {
      const user = await resolveUser(request);
      authDiagnosticLog(requestId, `response_status=${user ? 200 : 401}`);
      return user ? response.status(200).json({ user: { id: user.id, clerkUserId: user.authSubject, email: user.email, createdAt: user.createdAt } }) : response.status(401).json({ error: 'Authentication required' });
    }

    let clerkVerificationStarted = false;
    let clerkVerificationSucceeded = false;
    let identity;
    try {
      identity = await getAuthenticatedIdentity(request, {
        verificationStarted: () => { clerkVerificationStarted = true; authDiagnosticLog(requestId, 'clerk_verification_started'); },
        verificationFinished: (success) => { clerkVerificationSucceeded = success; authDiagnosticLog(requestId, `clerk_verification_success=${success}`); },
        userIdResolved: (present) => authDiagnosticLog(requestId, `clerk_user_id_present=${present}`),
        tokenClaims: (claims) => {
          authDiagnosticLog(requestId, `token_iss=${claims.iss ?? 'missing'}`);
          authDiagnosticLog(requestId, `token_azp=${claims.azp ?? 'missing'}`);
          authDiagnosticLog(requestId, `token_aud=${claims.aud ? JSON.stringify(claims.aud) : 'missing'}`);
          authDiagnosticLog(requestId, `token_exp=${claims.exp ?? 'missing'}`);
          authDiagnosticLog(requestId, `token_nbf=${claims.nbf ?? 'missing'}`);
          authDiagnosticLog(requestId, `token_sub_present=${claims.subPresent}`);
          authDiagnosticLog(requestId, `token_sid_present=${claims.sidPresent}`);
        },
        configuration: (configuration) => {
          authDiagnosticLog(requestId, `authorized_parties_count=${configuration.authorizedParties.length}`);
          authDiagnosticLog(requestId, `authorized_parties=${JSON.stringify(configuration.authorizedParties)}`);
          authDiagnosticLog(requestId, `authorized_party_match=${configuration.authorizedPartyMatch}`);
          authDiagnosticLog(requestId, `frontend_publishable_fapi=${configuration.frontendFapi ?? 'unavailable'}`);
          authDiagnosticLog(requestId, `server_publishable_fapi=${configuration.serverFapi ?? 'unavailable'}`);
          authDiagnosticLog(requestId, `publishable_fapi_match=${configuration.publishableFapiMatch}`);
        },
        verificationErrorCode: (code) => { if (code) authDiagnosticLog(requestId, `clerk_error_code=${code}`); },
        serverConfiguration: (configuration) => {
          authDiagnosticLog(requestId, `clerk_secret_key_present=${configuration.secretKeyPresent}`);
          authDiagnosticLog(requestId, `clerk_secret_key_prefix=${configuration.secretKeyMode}`);
          authDiagnosticLog(requestId, `clerk_publishable_key_present=${configuration.publishableKeyPresent}`);
          authDiagnosticLog(requestId, `clerk_publishable_key_prefix=${configuration.publishableKeyMode}`);
          authDiagnosticLog(requestId, `clerk_authorized_parties_present=${configuration.authorizedPartiesPresent}`);
        },
      });
    } catch (error) {
      if (!clerkVerificationStarted) authDiagnosticLog(requestId, 'clerk_verification_started');
      authDiagnosticLog(requestId, 'clerk_verification_success=false');
      authDiagnosticLog(requestId, 'clerk_user_id_present=false');
      const details = safeErrorDetails(error);
      authDiagnosticLog(requestId, 'failure_stage=CLERK_VERIFY_FAILED');
      authDiagnosticLog(requestId, `error_name=${details.name}`);
      if (details.code) authDiagnosticLog(requestId, `error_code=${details.code}`);
      authDiagnosticLog(requestId, 'response_status=401');
      return response.status(401).json({ error: 'Authentication required' });
    }
    if (!identity) {
      authDiagnosticLog(requestId, `failure_stage=${clerkVerificationSucceeded ? 'CLERK_USER_ID_MISSING' : 'CLERK_VERIFY_FAILED'}`);
      authDiagnosticLog(requestId, 'response_status=401');
      return response.status(401).json({ error: 'Authentication required' });
    }

    let databaseStage: 'lookup' | 'create' = 'lookup';
    try {
      const user = await resolveOrCreateAppUser(identity, {
        lookupStarted: () => authDiagnosticLog(requestId, 'internal_user_lookup_started'),
        lookupFinished: (success) => authDiagnosticLog(requestId, `internal_user_lookup_success=${success}`),
        createStarted: (started) => { databaseStage = 'create'; authDiagnosticLog(requestId, `internal_user_create_started=${started}`); },
        createFinished: (success) => authDiagnosticLog(requestId, `internal_user_create_success=${success}`),
      });
      authDiagnosticLog(requestId, 'response_status=200');
      return response.status(200).json({ user: { id: user.id, clerkUserId: user.authSubject, email: user.email, createdAt: user.createdAt } });
    } catch (error) {
      const failureStage = databaseFailureStage(error, databaseStage);
      const details = safeErrorDetails(error);
      if (databaseStage === 'lookup') {
        authDiagnosticLog(requestId, 'internal_user_lookup_success=false');
        authDiagnosticLog(requestId, 'internal_user_create_started=false');
        authDiagnosticLog(requestId, 'internal_user_create_success=false');
      }
      else authDiagnosticLog(requestId, 'internal_user_create_success=false');
      authDiagnosticLog(requestId, `failure_stage=${failureStage}`);
      authDiagnosticLog(requestId, `error_name=${details.name}`);
      if (details.code) authDiagnosticLog(requestId, `error_code=${details.code}`);
      return accountLinkageFailure(response, requestId);
    }
  } catch (error) {
    const details = safeErrorDetails(error);
    authDiagnosticLog(requestId, 'failure_stage=UNKNOWN_SERVER_ERROR');
    authDiagnosticLog(requestId, `error_name=${details.name}`);
    if (details.code) authDiagnosticLog(requestId, `error_code=${details.code}`);
    return accountLinkageFailure(response, requestId);
  }
};
export default createMeHandler();
