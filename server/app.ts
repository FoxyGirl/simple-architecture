import express from 'express';
import cors from 'cors';

import { authRouter, favoritesRouter, searchRouter } from './routes';

export const createApp = () => {
  const app = express();

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Requests without Origin (e.g. server-to-server or curl).
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  // Temporary logging of CORS decisions to help debug
  app.use(
    cors({
      origin: (origin, callback) => {
        console.log('[CORS]', {
          origin,
          allowedOrigins,
          allowed: !origin || allowedOrigins.includes(origin),
        });

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  // Temporary logging of HTTP properties
  app.use((req, _res, next) => {
    console.log('[HTTP]', {
      method: req.method,
      url: req.originalUrl,
      origin: req.headers.origin,
    });

    next();
  });

  // The favorites route is the app's first POST: it carries the show
  // snapshot as a JSON body, so parse it for every mounted route.
  app.use(express.json());

  // Every route lives in its own folder under routes/ and is mounted here;
  // app.ts stays the single composition point of the backend.
  app.use('/api', authRouter);
  app.use('/api', searchRouter);
  app.use('/api', favoritesRouter);

  return app;
};
