import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSearchSession } from '@store';

import { restoredSnapshot, sessionRequest } from './searchSession';

/**
 * The session persisted by the last successful search, frozen at mount:
 * restoration is a mount concern, so later saves never rewrite the
 * snapshot, request or input text the Presenter already seeded. A fresh
 * app start has no session and starts IDLE with an empty input.
 */
export const useRestoredSession = () => {
  const session = useSelector(selectSearchSession);

  const [restored] = useState(() => ({
    initialSnapshot: restoredSnapshot(session),
    initialRequest: session === null ? null : sessionRequest(session),
    initialQuery: session?.query ?? '',
  }));

  return restored;
};
