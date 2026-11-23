import { expect } from '@playwright/test';

import { backButton, openSignIn, signedOut } from './auth-helpers';
import { card, searchInput } from './favorites-helpers';

// The HomePage view carried through the /login detour. The search term,
// genre and page live in the HomePage URL (feature 004), so restoring that
// URL restores the whole view. The "space" fixture mirrors "world" (six
// shows, four Drama, two pages) without colliding with the cache-hit
// assertions of the browse and URL-sync specs. Every flow here writes no
// favorites, keeping the auth spec parallel-safe.

export const homeUrl = '/?search=space&genre=Drama&page=2';
const chip = (page, name) => page.getByRole('button', { name, exact: true });

export const expectDramaPageTwo = async (page) => {
  await expect(page).toHaveURL(/\/\?search=space&genre=Drama&page=2$/);
  await expect(searchInput(page)).toHaveValue('space');
  await expect(chip(page, 'Drama')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(card(page, 'Space News')).toBeVisible();
  await expect(card(page, 'Space Tour')).toHaveCount(0);
};

export const expectDefaultHomeFields = async (page) => {
  await expect(page).toHaveURL(/\/$/);
  await expect(searchInput(page)).toHaveValue('');
  await expect(
    page.getByRole('heading', { name: 'Discover your next obsession.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Search Results' }),
  ).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
};

const expectDefaultHome = async (page) => {
  await expectDefaultHomeFields(page);
  await signedOut(page);
};

export const backToHomeRestoresFlow = async (page) => {
  await page.goto(homeUrl);
  await expectDramaPageTwo(page);

  await openSignIn(page);
  await backButton(page).click();

  await expectDramaPageTwo(page);
};

export const backToHomeDirectFlow = async (page) => {
  await page.goto('/login');
  await backButton(page).click();

  await expectDefaultHome(page);
};

export const backToHomeReloadFlow = async (page) => {
  await page.goto(homeUrl);
  await expectDramaPageTwo(page);

  await openSignIn(page);
  await page.reload();
  await backButton(page).click();

  await expectDramaPageTwo(page);
};
