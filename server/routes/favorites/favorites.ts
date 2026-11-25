import { Router, type Request, type Response } from 'express';

import { parseSessionCookie, resolveSessionEmail } from '@server/auth';
import type { Show } from '@server/types';

import {
  addFavorite,
  getFavoritesListPage,
  getFavoritesSummary,
  removeFavorite,
} from './storage';

/**
 * Favorites routes. Mounted under `/api` by `app.ts`, so they answer
 * `POST /api/favorites`, `DELETE /api/favorites/:id`,
 * `GET /api/favorites/count` and `GET /api/favorites?page=`. Every endpoint
 * requires the session cookie and operates only on that email's own
 * in-memory list — reads included; serving favorites never calls TVmaze.
 * Add and remove answer with the email's updated `{ count, ids }` summary so
 * clients sync without refetching.
 */
export const favoritesRouter = Router();

/**
 * The route guard: resolves the session email or answers 401 `{ error }` and
 * short-circuits with `null`. Runs before body/query validation, so an
 * unauthenticated request can never touch a list.
 */
const requireEmail = (req: Request, res: Response): string | null => {
  const email = resolveSessionEmail(parseSessionCookie(req.headers.cookie));

  if (email === null) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  return email;
};

// Page is advisory: an absent or unparseable value falls back to page 1,
// and the storage helper clamps it into [1, pageCount] — the search
// route's pattern.
const parsePage = (value: unknown): number => {
  const requested = Number.parseInt(typeof value === 'string' ? value : '', 10);

  return Number.isNaN(requested) ? 1 : requested;
};

// Recorded decision: the accepted snapshot is validated by identity — a
// finite numeric `id` and a non-empty `name`. TVmaze shows carry many
// more fields and the backend stores the received snapshot as-is.
const isShowSnapshot = (value: unknown): value is Show => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as { id?: unknown; name?: unknown };

  return (
    typeof candidate.id === 'number' &&
    Number.isFinite(candidate.id) &&
    typeof candidate.name === 'string' &&
    candidate.name !== ''
  );
};

favoritesRouter.post('/favorites', (req, res) => {
  const email = requireEmail(req, res);
  if (email === null) return;

  const { show } = (req.body ?? {}) as { show?: unknown };

  if (!isShowSnapshot(show)) {
    res.status(400).json({ error: 'Request body must carry a valid "show"' });
    return;
  }

  addFavorite(email, show);
  res.json(getFavoritesSummary(email));
});

favoritesRouter.get('/favorites/count', (req, res) => {
  const email = requireEmail(req, res);
  if (email === null) return;

  res.json(getFavoritesSummary(email));
});

favoritesRouter.get('/favorites', (req, res) => {
  const email = requireEmail(req, res);
  if (email === null) return;

  res.json(getFavoritesListPage(email, parsePage(req.query.page)));
});

favoritesRouter.delete('/favorites/:id', (req, res) => {
  const email = requireEmail(req, res);
  if (email === null) return;

  const raw = req.params.id;

  // Only canonical integer ids parse — anything else (also '1.5', hex or
  // whitespace, which Number() would accept) answers with a 400.
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    res.status(400).json({ error: 'Route parameter "id" must be numeric' });
    return;
  }

  // Recorded decision: an unknown id removes nothing — a 200 with the
  // unchanged summary, because the desired end state already holds.
  removeFavorite(email, Number(raw));
  res.json(getFavoritesSummary(email));
});
