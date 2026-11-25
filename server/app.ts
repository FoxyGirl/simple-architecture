import express from 'express';
import cors from 'cors';

import { authRouter, favoritesRouter, searchRouter } from './routes';

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const createOriginMatcher = (pattern: string): RegExp => {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // Match Vercel preview subdomains: alphanumeric at both ends, hyphens allowed inside.
    .replace(/\*/g, '[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?');

  return new RegExp(`^${escaped}$`);
};

export const createApp = () => {
  const app = express();

  const allowedOrigins = [
    ...DEV_ORIGINS,
    ...(process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];

  const allowedOriginMatchers = allowedOrigins.map(createOriginMatcher);

  const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin) return true;

    try {
      const url = new URL(origin);

      if (url.origin !== origin) return false;

      return allowedOriginMatchers.some((matcher) => matcher.test(origin));
    } catch {
      return false;
    }
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isOriginAllowed(origin));
      },
      credentials: true,
    }),
  );

  app.use((req, res, next) => {
    if (!isOriginAllowed(req.headers.origin)) {
      res.status(403).json({ error: 'Not allowed by CORS' });
      return;
    }

    next();
  });

  app.use(express.json());

  app.use('/api', authRouter);
  app.use('/api', searchRouter);
  app.use('/api', favoritesRouter);

  return app;
};
