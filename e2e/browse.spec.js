import { test, expect } from '@playwright/test';

// Browsing spec for the server-driven genre filtering and pagination.
// The "world" query serves six fixture shows, four of them Drama, so both
// the unfiltered set and the Drama filter span two pages. Every genre/page
// selection goes through the backend, which reuses the one cached TVmaze
// response — the "world" upstream counter stays at one hit through all of
// them; only the new query at the end adds its own hit.

const upstreamHits = async (request, query) => {
  const response = await request.get('http://localhost:3002/__hits');
  const hits = await response.json();
  return hits[query] ?? 0;
};

const searchInput = (page) =>
  page.getByRole('textbox', { name: 'Search for TV shows' });

const card = (page, name) => page.getByRole('heading', { name });

const chip = (page, name) => page.getByRole('button', { name, exact: true });

const arrow = (page, label) => page.getByRole('button', { name: label });

test('genre and page selections are served through the backend cache', async ({
  page,
  request,
}) => {
  const worldBefore = await upstreamHits(request, 'world');

  await page.goto('/');
  await searchInput(page).fill('world');

  // Page 1 of the unfiltered six-show set; chips are All genres plus the
  // sorted envelope genres.
  await expect(card(page, 'World Tour')).toBeVisible();
  await expect(card(page, 'World Series')).toBeVisible();
  await expect(card(page, 'World Chef')).toBeVisible();
  await expect(card(page, 'World Wars')).toHaveCount(0);
  await expect(page.getByText('6 shows found')).toBeVisible();
  await expect(page.getByText('Page 1 of 2')).toBeVisible();
  await expect(chip(page, 'All genres')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(chip(page, 'Adventure')).toBeVisible();
  await expect(chip(page, 'Romance')).toBeVisible();
  await expect(arrow(page, 'Previous page')).toBeDisabled();

  // Paginating requests page 2: a different slice, forward arrow at the edge.
  await arrow(page, 'Next page').click();
  await expect(card(page, 'World Wars')).toBeVisible();
  await expect(card(page, 'World News')).toBeVisible();
  await expect(card(page, 'World Tour')).toHaveCount(0);
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(arrow(page, 'Next page')).toBeDisabled();

  // Selecting a genre resets the page to 1 and keeps only matching shows.
  await chip(page, 'Drama').click();
  await expect(card(page, 'World Tour')).toBeVisible();
  await expect(card(page, 'World Chef')).toBeVisible();
  await expect(card(page, 'World Wars')).toBeVisible();
  await expect(card(page, 'World Series')).toHaveCount(0);
  await expect(card(page, 'World News')).toHaveCount(0);
  await expect(page.getByText('4 shows found')).toBeVisible();
  await expect(page.getByText('Page 1 of 2')).toBeVisible();
  await expect(chip(page, 'Drama')).toHaveAttribute('aria-pressed', 'true');

  // "All genres" restores the full unfiltered first page.
  await chip(page, 'All genres').click();
  await expect(card(page, 'World Series')).toBeVisible();
  await expect(page.getByText('6 shows found')).toBeVisible();

  // All of that reused the one cached TVmaze response.
  expect(await upstreamHits(request, 'world')).toBe(worldBefore + 1);

  // A new query is its own cache key: exactly one further upstream hit.
  const otherBefore = await upstreamHits(request, 'galaxy');
  await searchInput(page).fill('galaxy');
  await expect(card(page, 'Mystery Machine')).toBeVisible();
  expect(await upstreamHits(request, 'galaxy')).toBe(otherBefore + 1);
  expect(await upstreamHits(request, 'world')).toBe(worldBefore + 1);
});
