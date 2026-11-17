import { createApp } from './app';

const port = process.env.PORT ?? 3001;

// The backend routes live in app.ts; this entry only binds the port.
createApp().listen(port, () => {
  console.log(`ScreenScout backend listening on http://localhost:${port}`);
});
