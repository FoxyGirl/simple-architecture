// Shared helpers for the favorites E2E spec: pure locators and backend
// probes only — favorites mutations stay in favorites.spec.js so parallel
// workers never interleave writes against the single in-memory backend.

import { expect } from '@playwright/test';

const BACKEND = 'http://localhost:3001';

export const summaryIds = async (request) =>
  (await (await request.get(`${BACKEND}/api/favorites/count`)).json()).ids;

// The backend may be warm from earlier runs, so every test starts by
// clearing the favorites through its API.
export const clearFavorites = async (request) => {
  for (const id of await summaryIds(request))
    await request.delete(`${BACKEND}/api/favorites/${id}`);
};

export const searchInput = (page) =>
  page.getByRole('textbox', { name: 'Search for TV shows' });

export const card = (page, name) => page.getByRole('heading', { name });

export const arrow = (page, label) => page.getByRole('button', { name: label });

export const countButton = (page, count) =>
  page.getByRole('button', { name: `View favorites (${count})` });

export const heart = (page, name, favorite) =>
  page.getByRole('button', {
    name: `${favorite ? 'Remove' : 'Add'} ${name} ${favorite ? 'from' : 'to'} favorites`,
  });

export const pressed = (page, name) =>
  expect(heart(page, name, true)).toHaveAttribute('aria-pressed', 'true');

export const searchSpace = async (page) => {
  await page.goto('/');
  await searchInput(page).fill('space');
  await expect(card(page, 'Space Tour')).toBeVisible();
};

// The parameterized URL the restoration flows must return to.
const searchSpaceDramaPageTwo = async (page) => {
  await searchSpace(page);
  await page.getByRole('button', { name: 'Drama', exact: true }).click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await arrow(page, 'Next page').click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
};

const expectRestoredSearch = async (page) => {
  await expect(page).toHaveURL(/\/\?search=space&genre=Drama&page=2$/);
  await expect(searchInput(page)).toHaveValue('space');
  await expect(
    page.getByRole('button', { name: 'Drama', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(card(page, 'Space News')).toBeVisible();
  await expect(card(page, 'Space Tour')).toHaveCount(0);
};

// The Home nav link is a fresh start, not a restoration.
const expectFreshHome = async (page) => {
  await expect(page).toHaveURL(/\/$/);
  await expect(searchInput(page)).toHaveValue('');
  await expect(page.getByText('Search Results')).toHaveCount(0);
};

const backToRestoredSearch = async (page) => {
  await countButton(page, 0).click();
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expectRestoredSearch(page);
};

// Browser back from Favorites lands on the parameterized HomePage entry.
const browserBackRestoresSearch = async (page) => {
  await countButton(page, 0).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await page.goBack();
  await expectRestoredSearch(page);
};

const navToFreshHome = async (page) => {
  await page.getByRole('link', { name: 'Favorites' }).click();
  await page.getByRole('link', { name: 'Home' }).click();
  await expectFreshHome(page);
};

export const roundTripRestoresSearch = async (page) => {
  await searchSpaceDramaPageTwo(page);
  await backToRestoredSearch(page);
  await browserBackRestoresSearch(page);
  await navToFreshHome(page);
};

// Sonner renders every toast as a [data-sonner-toast] list item inside the
// single global toaster mounted in App; probes filter by the message.
export const toast = (page, text) =>
  page.locator('[data-sonner-toast]').filter({ hasText: text });

export const shownToast = async (page, text) => {
  await expect(toast(page, text)).toBeVisible();
  await expect(toast(page, text)).toHaveText(text);
};

// The toaster dismisses each toast 3000 ms after it appears.
export const hiddenToast = (page, text) =>
  expect(toast(page, text)).toBeHidden({ timeout: 6000 });

export const addFourSpaceShows = async (page) => {
  for (const name of ['Space Tour', 'Space Series', 'Space Chef']) {
    await heart(page, name, false).click();
    await pressed(page, name);
  }
  await arrow(page, 'Next page').click();
  await heart(page, 'Space Wars', false).click();
  await pressed(page, 'Space Wars');
};
