// Only the favorite writes (POST /api/favorites, DELETE /api/favorites/:id)
// are intercepted; the mount summary sync and the backend-side probes pass
// through, so the optimistic windows are proven against the real backend.
const WRITE_URL = /\/api\/favorites(?:\/\d+)?$/;

// Holds every write before it reaches the backend: the handler waits for its
// gate to open, then either performs the real request and fulfills with it
// (`release`) or aborts at the network level (`fail`). While a gate stays
// closed the browser has seen no response, so the UI is in the optimistic
// window — and a failed write never touches the backend. `hits` counts the
// writes that reached the handler, proving a rejected click sends none.
export const holdWrites = async (page) => {
  const gates = [];
  let hits = 0;

  await page.route(WRITE_URL, async (route) => {
    if (route.request().method() === 'GET') return route.continue();

    hits += 1;
    const outcome = await new Promise((open) => gates.push(open));
    if (outcome === 'abort') return route.abort();

    const response = await route.fetch();
    await route.fulfill({ response });
  });

  return {
    release: () => gates.shift()?.('fulfill'),
    fail: () => gates.shift()?.('abort'),
    hits: () => hits,
  };
};
