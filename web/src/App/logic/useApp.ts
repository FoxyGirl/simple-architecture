import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsAuthenticated } from '~/store';

import { restoreSession } from './tasks/restoreSession';

/**
 * The App presenter: it restores the session once on boot and exposes the
 * prepared flags the routes guard on. The restore's in-flight status is local
 * operation state, never Entity data; `isSessionReady` tells the routes when
 * the answer has landed, `isAuthenticated` is the prepared session flag.
 * Signing in or out keeps the same prepared flags — the session Entity is
 * the single source. The StrictMode double-mount restores only once.
 */
export const useApp = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    void restoreSession().then(() => setIsSessionReady(true));
  }, []);

  return {
    isSessionReady,
    isAuthenticated,
  };
};
