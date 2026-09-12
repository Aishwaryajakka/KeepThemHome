import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export const DEMO_MODE_KEY = 'keep-them-home:demo-mode';

interface DemoModeContextValue {
  active: boolean;
  enable: () => void;
  reset: () => void;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  active: false,
  enable: () => undefined,
  reset: () => undefined,
});

const initialDemoMode = () => {
  try {
    return sessionStorage.getItem(DEMO_MODE_KEY) === 'active';
  } catch {
    return false;
  }
};

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const [active, setActive] = useState(initialDemoMode);
  const value = useMemo<DemoModeContextValue>(() => ({
    active,
    enable: () => {
      try { sessionStorage.setItem(DEMO_MODE_KEY, 'active'); } catch { /* Keep the in-memory demo available. */ }
      setActive(true);
    },
    reset: () => {
      try { sessionStorage.removeItem(DEMO_MODE_KEY); } catch { /* Keep the in-memory reset available. */ }
      setActive(false);
    },
  }), [active]);

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
};

export const useDemoMode = () => useContext(DemoModeContext);
