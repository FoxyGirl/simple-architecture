import { useSyncExternalStore } from 'react';

const DESKTOP_QUERY = '(min-width: 1024px)';

const subscribe = (onChange) => {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);

  mediaQuery.addEventListener('change', onChange);

  return () => mediaQuery.removeEventListener('change', onChange);
};

const getSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches;

const getServerSnapshot = () => false;

/**
 * Tracks the desktop breakpoint.
 *
 * Used to swap between the mobile list card and the desktop grid card, so
 * only the variant that is actually visible is mounted and its poster
 * images are fetched.
 *
 * @returns {{ isDesktop: boolean }} `isDesktop` is true on viewports of
 * 1024px and wider.
 */
export const useMediaQuery = () => {
  const isDesktop = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return { isDesktop };
};
