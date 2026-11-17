import { test, expect } from '@playwright/test';

// Upstream hits recorded by the stub's per-query counter. The stub keeps
// running between specs, so assertions compare against the value read
// before the interaction (delta) instead of an absolute count.
const upstreamHits = async (request, query) => {
  const response = await request.get('http://localhost:3002/__hits');
  const hits = await response.json();
  return hits[query] ?? 0;
};

const blockTvmaze = async (page) => {
  const requests = [];
  await page.route('https://api.tvmaze.com/**', (route) => {
    requests.push(route.request().url());
    void route.abort();
  });
  return requests;
};

const searchInput = (page) =>
  page.getByRole('textbox', { name: 'Search for TV shows' });

test('searching renders the fixture results through the backend', async ({
  page,
  request,
}) => {
  const tvmazeRequests = await blockTvmaze(page);
  const hitsBefore = await upstreamHits(request, 'office');

  await page.goto('/');
  await searchInput(page).fill('office');

  await expect(
    page.getByRole('heading', { name: 'The Office (US)' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Office Romance' }),
  ).toBeVisible();

  expect(tvmazeRequests).toEqual([]);
  expect(await upstreamHits(request, 'office')).toBe(hitsBefore + 1);
});

test('a failing upstream shows the error panel and retry recovers', async ({
  page,
  request,
}) => {
  await blockTvmaze(page);

  await page.goto('/');
  const arm = await request.post('http://localhost:3002/__fail-next?q=mystery');
  expect(arm.ok()).toBeTruthy();

  await searchInput(page).fill('mystery');

  await expect(
    page.getByRole('heading', { name: 'Something went wrong.' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Retry request' }).click();

  await expect(
    page.getByRole('heading', { name: 'Mystery Machine' }),
  ).toBeVisible();
});
