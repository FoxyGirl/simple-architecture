import { test, expect } from '@playwright/test';

import {
  addFourSpaceShows,
  arrow,
  card,
  clearFavorites,
  heart,
  hiddenToast,
  pressed,
  searchInput,
  searchSpace,
  shownToast,
  summaryIds,
} from './favorites-helpers';

// All favorites E2E lives in this single spec: Playwright parallelizes
// spec files against the one shared backend, so the favorites mutations
// stay sequential here. Each test starts from cleared favorites through
// the API; shared locators and probes live in ./favorites-helpers.js.

test.beforeEach(async ({ request }) => {
  await clearFavorites(request);
});

test('hearts are backend-driven and survive genre, page and search changes', async ({
  page,
  request,
}) => {
  await searchSpace(page);

  // Adding through the heart writes to the backend, not just to the page.
  await heart(page, 'Space Tour', false).click();
  await pressed(page, 'Space Tour');
  await expect.poll(() => summaryIds(request)).toEqual([600]);

  // The pressed state survives a genre change, a page change…
  await page.getByRole('button', { name: 'Drama', exact: true }).click();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await pressed(page, 'Space Tour');
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
  await searchSpace(page);
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

test('favorites toasts appear and dismiss themselves', async ({ page }) => {
  await searchSpace(page);

  // A heart add toasts the addition and disappears without interaction.
  await heart(page, 'Space Tour', false).click();
  await shownToast(page, '"Space Tour" was added to favorites');
  await hiddenToast(page, '"Space Tour" was added to favorites');

  // A heart removal on the HomePage toasts the distinct removal message.
  await heart(page, 'Space Tour', true).click();
  await shownToast(page, '"Space Tour" was removed from favorites');
  await hiddenToast(page, '"Space Tour" was removed from favorites');

  // A removal on the Favorites page toasts the same removal message. The
  // global toaster survives the navigation and stacks, so the probes pick
  // the expected message out of the toast stack.
  await heart(page, 'Space Chef', false).click();
  await pressed(page, 'Space Chef');
  await page.getByRole('link', { name: 'Favorites' }).click();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await heart(page, 'Space Chef', true).click();
  await shownToast(page, '"Space Chef" was removed from favorites');
  await hiddenToast(page, '"Space Chef" was removed from favorites');
});
