import { test, expect } from '@playwright/test';

// Cache spec. All specs share one stub and one backend process, and the
// other specs already use "office" and "mystery", so this spec searches
// its own queries: unknown to the fixture table they serve the default
// shows ("Mystery Machine") from independent counter keys. The counters
// are asserted as deltas, matching the other specs' warm-restart safety.
const upstreamHits = async (request, query) => {
  const response = await request.get('http://localhost:3002/__hits');
  const hits = await response.json();
  return hits[query] ?? 0;
};

const searchInput = (page) =>
  page.getByRole('textbox', { name: 'Search for TV shows' });

const defaultResults = (page) =>
  page.getByRole('heading', { name: 'Mystery Machine' });

test('a repeated identical search is served from the backend cache', async ({
  page,
  request,
}) => {
  const hitsBefore = await upstreamHits(request, 'breaking');

  // First search: the cache is empty -> exactly one upstream request.
  await page.goto('/');
  await searchInput(page).fill('breaking');
  await expect(defaultResults(page)).toBeVisible();
  expect(await upstreamHits(request, 'breaking')).toBe(hitsBefore + 1);

  // The same search on a reloaded page: served from the backend cache,
  // so the upstream counter does not move.
  await page.reload();
  await searchInput(page).fill('breaking');
  await expect(defaultResults(page)).toBeVisible();
  expect(await upstreamHits(request, 'breaking')).toBe(hitsBefore + 1);

  // A different query is cached independently -> its own upstream hit,
  // while "breaking" stays at one.
  const otherBefore = await upstreamHits(request, 'lost');
  await searchInput(page).fill('lost');
  await expect
    .poll(() => upstreamHits(request, 'lost'), { timeout: 15000 })
    .toBe(otherBefore + 1);
  expect(await upstreamHits(request, 'breaking')).toBe(hitsBefore + 1);
});
