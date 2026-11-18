import express from 'express';

import { searchRouter } from './routes';

export const createApp = () => {
  const app = express();

  // Every route lives in its own folder under routes/ and is mounted here;
  // app.ts stays the single composition point of the backend.
  app.use('/api', searchRouter);

  return app;
};
