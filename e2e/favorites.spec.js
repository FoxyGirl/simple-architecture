import { test, expect } from '@playwright/test';

// All favorites E2E lives in this single file: Playwright runs spec files
// in parallel workers against the one shared backend, so keeping every
// favorites mutation sequential here makes the in-memory storage readable.
// The backend may be warm from earlier runs, so each test clears the
// favorites through the API first.

const BACKEND = 'http://localhost:3001';

const summaryIds = async (request) =>
  (await (await request.get(`${BACKEND}/api/favorites/count`)).json()).ids;

const searchInput = (page) =>
  page.getByRole('textbox', { name: 'Search for TV shows' });

const card = (page, name) => page.getByRole('heading', { name });

const arrow = (page, label) => page.getByRole('button', { name: label });

const heart = (page, name, favorite) =>
  page.getByRole('button', {
    name: `${favorite ? 'Remove' : 'Add'} ${name} ${favorite ? 'from' : 'to'} favorites`,
  });

const pressed = (page, name) =>
  expect(heart(page, name, true)).toHaveAttribute('aria-pressed', 'true');

const addFourSpaceShows = async (page) => {
  for (const name of ['Space Tour', 'Space Series', 'Space Chef']) {
    await heart(page, name, false).click();
    await pressed(page, name);
  }
  await arrow(page, 'Next page').click();
  await heart(page, 'Space Wars', false).click();
  await pressed(page, 'Space Wars');
};

test.beforeEach(async ({ request }) => {
  for (const id of await summaryIds(request))
    await request.delete(`${BACKEND}/api/favorites/${id}`);
});

test('hearts are backend-driven and survive genre, page and search changes', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await searchInput(page).fill('space');
  await expect(card(page, 'Space Tour')).toBeVisible();

  // Adding through the heart writes to the backend, not just to the page.
  await heart(page, 'Space Tour', false).click();
  await pressed(page, 'Space Tour');
  await expect.poll(() => summaryIds(request)).toEqual([600]);

  // The pressed state survives a genre change…
  await page.getByRole('button', { name: 'Drama', exact: true }).click();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await pressed(page, 'Space Tour');

  // …a page change…
  await arrow(page, 'Next page').click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await arrow(page, 'Previous page').click();
  await pressed(page, 'Space Tour');

  // …and a new search.
  await searchInput(page).fill('edge');
  await expect(card(page, 'Edge Times')).toBeVisible();
  await expect(heart(page, 'Edge Times', false)).toBeVisible();
  await searchInput(page).fill('space');
  await pressed(page, 'Space Tour');

  // Removing through the heart clears it on the backend too.
  await heart(page, 'Space Tour', true).click();
  await expect(heart(page, 'Space Tour', false)).toBeVisible();
  await expect.poll(() => summaryIds(request)).toEqual([]);
});

test('the favorites page paginates, updates on removal and returns home', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await searchInput(page).fill('space');
  await expect(card(page, 'Space Tour')).toBeVisible();

  await addFourSpaceShows(page);
  await expect.poll(() => summaryIds(request)).toHaveLength(4);

  // The nav link reaches the Favorites page: three per page, two pages.
  await page.getByRole('link', { name: 'Favorites' }).click();
  await expect(card(page, 'Space Series')).toBeVisible();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await expect(card(page, 'Space Wars')).toHaveCount(0);
  await expect(page.getByText('Page 1 of 2')).toBeVisible();
  await expect(page.getByText('4 shows saved to your list.')).toBeVisible();

  // Next reaches the fourth show, Prev comes back.
  await arrow(page, 'Next page').click();
  await expect(card(page, 'Space Wars')).toBeVisible();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await arrow(page, 'Previous page').click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(page.getByText('Page 1 of 2')).toBeVisible();

  // Removing a show updates the list and the pagination metadata.
  await heart(page, 'Space Tour', true).click();
  await expect(card(page, 'Space Tour')).toHaveCount(0);
  await expect(card(page, 'Space Wars')).toBeVisible();
  await expect(page.getByText('Page 1 of 1')).toBeVisible();
  await expect(page.getByText('3 shows saved to your list.')).toBeVisible();
  await expect.poll(() => summaryIds(request)).toHaveLength(3);

  // The back button lands on the HomePage.
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(searchInput(page)).toBeVisible();
});
