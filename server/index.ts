import { createApp } from './app';

const port = process.env.PORT ?? 3001;

// Phase 2 scaffold: no routes yet. Later phases add the TVmaze proxy.
createApp().listen(port, () => {
  console.log(`ScreenScout backend listening on http://localhost:${port}`);
});
