import { ASSESSMENT_SESSION_KEY } from '@/lib/assessment-session';
import { DEMO_MODE_KEY } from '@/demo/DemoModeProvider';
import { clearCaseApiClientCache } from '@/lib/case-api';

export const KEEP_THEM_HOME_SESSION_KEYS = [ASSESSMENT_SESSION_KEY, DEMO_MODE_KEY] as const;

export const clearClientSessionState = () => {
  for (const key of KEEP_THEM_HOME_SESSION_KEYS) {
    try { sessionStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
  }
  clearCaseApiClientCache();
};
