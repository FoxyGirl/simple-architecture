import { useEffect, useRef } from 'react';

import type { SearchRequest } from '../types';

/**
 * Re-issues the restored request once on mount when the shows Entity does
 * not hold its result (a fresh Entity with a persisted session). The
 * session and the stored result are written together, so the served page
 * identifies the result; the backend cache makes a re-fetch cheap. On a
 * normal in-session return the stored page matches and nothing is requested
 * again, and later searches never retrigger the restored request.
 */
export const useRestoredRequest = (
  request: SearchRequest | null,
  storedPage: number,
  runRequest: (request: SearchRequest) => Promise<void>,
) => {
  const restored = useRef(request);
  const used = useRef(false);

  useEffect(() => {
    if (used.current) return;
    used.current = true;

    const pending = restored.current;
    if (pending !== null && storedPage !== pending.page) {
      void runRequest(pending);
    }
  }, [runRequest, storedPage]);
};
