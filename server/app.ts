import express from 'express';

import { favoritesRouter, searchRouter } from './routes';

export const createApp = () => {
  const app = express();

  // The favorites route is the app's first POST: it carries the show
  // snapshot as a JSON body, so parse it for every mounted route.
  app.use(express.json());

  // Every route lives in its own folder under routes/ and is mounted here;
  // app.ts stays the single composition point of the backend.
  app.use('/api', searchRouter);
  app.use('/api', favoritesRouter);

  return app;
};
