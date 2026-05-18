'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type BreadcrumbOverrides = Record<string, string>;

interface BreadcrumbContextValue {
  overrides: BreadcrumbOverrides;
  setOverride: (segment: string, title: string) => void;
  clearOverride: (segment: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  overrides: {},
  setOverride: () => {},
  clearOverride: () => {}
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<BreadcrumbOverrides>({});

  const setOverride = useCallback((segment: string, title: string) => {
    setOverrides((prev) => ({ ...prev, [segment]: title }));
  }, []);

  const clearOverride = useCallback((segment: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[segment];
      return next;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ overrides, setOverride, clearOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbOverrides() {
  return useContext(BreadcrumbContext);
}
