import express from 'express';
import cors from 'cors';

import { authRouter, favoritesRouter, searchRouter } from './routes';

/**
 * Origins of the local Vite dev server. In dev the browser talks to the
 * backend through the Vite proxy (same-origin), but the proxy forwards the
 * browser's `Origin` header verbatim, so these origins are always trusted:
 * production CORS enforcement must never break local development.
 */
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export const createApp = () => {
  const app = express();

  // Temporary logging of the `ALLOWED_ORIGINS` environment variable to debug
  console.log('[ENV]', {
    allowedOrigins: process.env.ALLOWED_ORIGINS,
  });

  const allowedOrigins = [
    ...DEV_ORIGINS,
    ...(process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];
  // Temporary logging of the `ALLOWED_ORIGINS` environment variable to debug

  console.log(`RESULT allowedOrigins = ${allowedOrigins}`);

  const isOriginAllowed = (origin: string | undefined): boolean =>
    origin === undefined || allowedOrigins.includes(origin);

  app.use(
    cors({
      origin: (origin, callback) => {
        // A denied origin simply gets no CORS headers; the enforcement
        // middleware below answers it with 403 before any route runs.
        // Passing an Error here instead would make Express answer every
        // denied request with an unhandled 500.
        callback(null, isOriginAllowed(origin));
      },
      credentials: true,
    }),
  );

  // Temporary logging of CORS decisions and HTTP properties to debug the
  // Railway deployment; remove once the production setup is verified.
  app.use((req, _res, next) => {
    const origin = req.headers.origin;

    console.log('[CORS]', {
      origin,
      allowedOrigins,
      allowed: isOriginAllowed(origin),
    });
    console.log('[HTTP]', {
      method: req.method,
      url: req.originalUrl,
      origin,
    });

    next();
  });

  // Production CORS enforcement: a cross-origin browser call from an origin
  // outside the whitelist is rejected here, so denied requests never reach
  // the routes. Same-origin traffic (no Origin header) is unaffected.
  app.use((req, res, next) => {
    if (isOriginAllowed(req.headers.origin)) {
      next();
      return;
    }

    res.status(403).json({ error: 'Not allowed by CORS' });
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
