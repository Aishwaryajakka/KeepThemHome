import { beforeEach, describe, expect, it } from 'vitest';
import { ASSESSMENT_SESSION_KEY } from '@/lib/assessment-session';
import { clearClientSessionState, KEEP_THEM_HOME_SESSION_KEYS } from '@/lib/client-session';
import { DEMO_MODE_KEY } from '@/demo/DemoModeProvider';

describe('client session cleanup', () => {
  beforeEach(() => sessionStorage.clear());

  it('clears only Keep Them Home session keys on sign-out', () => {
    sessionStorage.setItem(ASSESSMENT_SESSION_KEY, 'active case');
    sessionStorage.setItem(DEMO_MODE_KEY, 'true');
    sessionStorage.setItem('unrelated-app:key', 'preserve me');

    clearClientSessionState();

    expect(KEEP_THEM_HOME_SESSION_KEYS).toEqual([ASSESSMENT_SESSION_KEY, DEMO_MODE_KEY]);
    expect(sessionStorage.getItem(ASSESSMENT_SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(DEMO_MODE_KEY)).toBeNull();
    expect(sessionStorage.getItem('unrelated-app:key')).toBe('preserve me');
  });
});
