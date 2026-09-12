import { randomUUID } from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

type DiagnosticRequest = VercelRequest & { authDiagnosticRequestId?: string };

export const getAuthRequestId = (request: VercelRequest) => {
  const diagnosticRequest = request as DiagnosticRequest;
  diagnosticRequest.authDiagnosticRequestId ??= randomUUID().slice(0, 8);
  return diagnosticRequest.authDiagnosticRequestId;
};

export const authDiagnosticLog = (requestId: string, message: string) => {
  console.info(`[auth:${requestId}] ${message}`);
};

export const safeErrorDetails = (error: unknown) => {
  if (!(error instanceof Error)) return { name: 'UnknownError', code: undefined };
  const candidate = error as Error & { code?: unknown; reason?: unknown; errors?: Array<{ code?: unknown }> };
  const nestedCode = candidate.errors?.find((item) => typeof item.code === 'string' || typeof item.code === 'number')?.code;
  const safeCode = candidate.code ?? candidate.reason ?? nestedCode;
  return {
    name: error.name || 'Error',
    code: typeof safeCode === 'string' || typeof safeCode === 'number'
      ? String(safeCode).slice(0, 64)
      : undefined,
  };
};
