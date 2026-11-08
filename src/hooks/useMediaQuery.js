import { useCallback, useSyncExternalStore } from 'react';

/**
 * Tracks a CSS media query.
 *
 * Used to swap between the mobile list card and the desktop grid card, so
 * only the variant that is actually visible is mounted and its poster
 * images are fetched.
 */
export const useMediaQuery = (query) => {
  const subscribe = useCallback(
    (onChange) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', onChange);

      return () => mediaQuery.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};
