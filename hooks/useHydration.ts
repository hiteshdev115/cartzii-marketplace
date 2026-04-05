import { useEffect, useState } from 'react';

/**
 * Returns true after the component has mounted on the client,
 * ensuring persisted Zustand stores have rehydrated from localStorage.
 * Use this to guard UI that depends on persisted store values
 * to prevent SSR hydration mismatches.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
