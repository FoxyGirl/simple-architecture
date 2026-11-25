// Shared helpers for the favorites E2E spec: pure locators and backend
// probes only — favorites mutations stay in favorites.spec.js so parallel
// workers never interleave writes against the single in-memory backend.

import { expect } from '@playwright/test';

import {
  logoutButton,
  signIn as signInThroughPage,
  signedIn,
  signedOut,
} from './auth-helpers';
import { clearFavorites } from './favorites-backend';

export { clearFavorites, summaryIds } from './favorites-backend';

// Favorites are a signed-in feature: every flow enters through the sign-in
// page as its own email, then clears that email's backend list through the
// scoped probes, so parallel workers never interleave writes on one list.
// Signing in restores the Home URL it left, so the exit target is not
// asserted here — flows that care assert their own URL.
export const signIn = async (page, email) => {
  await signInThroughPage(page, email);
  await signedIn(page, email);
};

export const signOut = async (page) => {
  await logoutButton(page).click();
  await signedOut(page);
};

export const prepareFavorites = async (page, request, email) => {
  await page.goto('/');
  await signIn(page, email);
  await clearFavorites(request, email);
};

export const searchInput = (page) =>
  page.getByRole('textbox', { name: 'Search for TV shows' });

export const card = (page, name) => page.getByRole('heading', { name });

// The card element containing the show heading — the stable scope for the
// soft-removal CSS probes.
export const cardArticle = (page, name) =>
  page.locator('article').filter({ has: card(page, name) });

// The card's text block, which carries the removed-state grayscale.
export const cardContent = (page, name) =>
  cardArticle(page, name).locator('h3').locator('xpath=..');

// The page subhead ("N shows saved to your list.") and the pagination info
// ("Page X of Y") are the fetched-metadata probes.
export const subhead = (page, text) => page.getByText(text);
export const pageInfo = (page, text) => page.getByText(text);

export const arrow = (page, label) => page.getByRole('button', { name: label });

export const countButton = (page, count) =>
  page.getByRole('button', { name: `View favorites (${count})` });

export const heart = (page, name, favorite) =>
  page.getByRole('button', {
    name: `${favorite ? 'Remove' : 'Add'} ${name} ${favorite ? 'from' : 'to'} favorites`,
  });

export const pressed = (page, name) =>
  expect(heart(page, name, true)).toBeVisible();

export const searchSpace = async (page) => {
  await page.goto('/');
  await searchInput(page).fill('space');
  await expect(card(page, 'Space Tour')).toBeVisible();
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
