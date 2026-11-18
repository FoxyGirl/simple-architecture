import { Router } from 'express';

import { getCachedShows } from '../../cache';
import { buildSearchPage } from './shows';

/**
 * `GET /api/search` — the show-search route. Mounted under `/api` by
 * `app.ts`, so it answers `GET /api/search?q=&genre=&page=`.
 */
export const searchRouter = Router();

searchRouter.get('/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q : '';

  if (query === '') {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }

  // genre and page are advisory: an absent or unparseable value falls back
  // to "no filter" and page 1, and the page is clamped into the filtered
  // result's [1, pageCount] range by buildSearchPage.
  const genre = typeof req.query.genre === 'string' ? req.query.genre : '';
  const requested = Number.parseInt(
    typeof req.query.page === 'string' ? req.query.page : '',
    10,
  );

  try {
    const shows = await getCachedShows(query);
    const page = Number.isNaN(requested) ? 1 : requested;

    res.json(buildSearchPage(shows, genre, page));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`TVmaze upstream failed: ${reason}`);
    res.status(502).json({ error: `TVmaze request failed: ${reason}` });
  }
});
