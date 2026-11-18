import { createApp } from './app';

const port = process.env.PORT ?? 3001;

// The routes live in their own folders under routes/ and are composed by
// app.ts; this entry only binds the port.
createApp().listen(port, () => {
  console.log(`ScreenScout backend listening on http://localhost:${port}`);
});
