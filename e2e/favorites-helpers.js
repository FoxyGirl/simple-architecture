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
