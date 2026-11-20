// Shared helpers for the favorites E2E spec: pure locators and backend
// probes only — all favorites tests stay in favorites.spec.js, because
// Playwright runs spec files in parallel workers against the one shared
// backend and the favorites mutations must remain sequential.

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

// The HomePage count button; the accessible name carries the backend count,
// so a changed count is a different role name and a precise assertion.
export const countButton = (page, count) =>
  page.getByRole('button', { name: `View favorites (${count})` });

export const heart = (page, name, favorite) =>
  page.getByRole('button', {
    name: `${favorite ? 'Remove' : 'Add'} ${name} ${favorite ? 'from' : 'to'} favorites`,
  });

export const pressed = (page, name) =>
  expect(heart(page, name, true)).toHaveAttribute('aria-pressed', 'true');

// The deterministic opening shared by the specs: a fresh HomePage with
// the recorded `space` stub results on screen.
export const searchSpace = async (page) => {
  await page.goto('/');
  await searchInput(page).fill('space');
  await expect(card(page, 'Space Tour')).toBeVisible();
};

// The recorded in-session search state: the Drama filter of the isolated
// `space` fixture, second page — a query, genre and page to restore.
const searchSpaceDramaPageTwo = async (page) => {
  await searchSpace(page);
  await page.getByRole('button', { name: 'Drama', exact: true }).click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await arrow(page, 'Next page').click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
};

// The HomePage state the recorded session must restore: input text, the
// pressed genre chip, the active page and that page's cards.
const expectRestoredSearch = async (page) => {
  await expect(page).toHaveURL(/\/$/);
  await expect(searchInput(page)).toHaveValue('space');
  await expect(
    page.getByRole('button', { name: 'Drama', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(card(page, 'Space News')).toBeVisible();
  await expect(card(page, 'Space Tour')).toHaveCount(0);
};

// The count-button round trip: leave for the Favorites page, return through
// the back button and assert the restored search state.
const backToRestoredSearch = async (page) => {
  await countButton(page, 0).click();
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expectRestoredSearch(page);
};

// The same in-session round trip through the global navigation links.
const navToRestoredSearch = async (page) => {
  await page.getByRole('link', { name: 'Favorites' }).click();
  await page.getByRole('link', { name: 'Home' }).click();
  await expectRestoredSearch(page);
};

// The whole restoration flow: prepare the search state, then leave for the
// Favorites page and return — through the count/back buttons first, then
// through the global nav links — asserting the restored state each time.
export const roundTripRestoresSearch = async (page) => {
  await searchSpaceDramaPageTwo(page);
  await backToRestoredSearch(page);
  await navToRestoredSearch(page);
};

// Sonner renders every toast as a [data-sonner-toast] list item inside
// the single global toaster mounted in App (no role="status" — Sonner
// exposes the toaster outlet itself as the aria-live region). Toasts
// stack and survive navigation, so the probes filter by the message.
export const toast = (page, text) =>
  page.locator('[data-sonner-toast]').filter({ hasText: text });

// The toaster dismisses each toast 3000 ms after it appears
// (NOTIFY_DURATION_MS in web/src/App/Toaster/constants.ts);
// 6000 ms is the generous upper bound for the auto-hidden assertion.
export const shownToast = async (page, text) => {
  await expect(toast(page, text)).toBeVisible();
  await expect(toast(page, text)).toHaveText(text);
};

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
