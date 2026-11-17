import express from 'express';

import { searchShows } from './tvmaze';

export const createApp = () => {
  const app = express();

  app.get('/api/shows', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';

    if (query === '') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    try {
      res.json(await searchShows(query));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`TVmaze upstream failed: ${reason}`);
      res.status(502).json({ error: `TVmaze request failed: ${reason}` });
    }
  });

  return app;
};
