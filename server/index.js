import express from 'express';

const app = express();

const port = process.env.PORT ?? 3001;

// Phase 1 scaffold: no routes yet. Later phases add the TVmaze proxy.
app.listen(port, () => {
  console.log(`ScreenScout backend listening on http://localhost:${port}`);
});
