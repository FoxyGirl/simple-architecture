import { expect, test } from '@playwright/test';

import {
  logoutButton,
  signIn,
  signedIn,
  signedInAs,
  signedOut,
} from './auth-helpers';
import { arrow, card, searchInput } from './favorites-helpers';

// The favorite controls are a signed-in feature; every flow here writes no
// favorites, so this spec runs in parallel with the single-writer
// favorites.spec.js.

const favoritesCountButton = (page) =>
  page.getByRole('button', { name: /^View favorites \(\d+\)$/ });

const anyHeart = (page) =>
  page.getByRole('button', {
    name: /^(?:Add|Remove) .+ (?:to|from) favorites$/,
  });

test('a signed-out search has no favorite controls until sign in', async ({
  page,
}) => {
  await page.goto('/');
  await signedOut(page);
  await searchInput(page).fill('space');
  await expect(card(page, 'Space Tour')).toBeVisible();

  await expect(anyHeart(page)).toHaveCount(0);
  await expect(favoritesCountButton(page)).toHaveCount(0);

  await page.setViewportSize({ width: 900, height: 1000 });
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(anyHeart(page)).toHaveCount(0);

  await signIn(page, 'guest-controls@example.com');
  await expect(page).toHaveURL(/\/\?search=space$/);
  await signedIn(page, 'guest-controls@example.com');

  // Signing in restores the parameterized Home view, so the same results and
  // the now-available favorite controls are already on screen.
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(anyHeart(page).first()).toBeVisible();
  await expect(favoritesCountButton(page)).toBeVisible();

  await logoutButton(page).click();
  await signedOut(page);
  await expect(anyHeart(page)).toHaveCount(0);
  await expect(favoritesCountButton(page)).toHaveCount(0);
});

test('a signed-out favorites deep link lands on the home page', async ({
  page,
}) => {
  await page.goto('/favorites');

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { name: 'Discover your next obsession.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Favorites', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Sign in', exact: true }),
  ).toHaveCount(0);
  await signedOut(page);
});

test('a signed-in reload of favorites stays on the page', async ({ page }) => {
  await page.goto('/');
  await signIn(page, 'guest-reload@example.com');
  await signedInAs(page, 'guest-reload@example.com');

  await page.goto('/favorites');
  await expect(
    page.getByRole('heading', { name: 'Favorites', exact: true }),
  ).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/\/favorites$/);
  await expect(
    page.getByRole('heading', { name: 'Favorites', exact: true }),
  ).toBeVisible();

  await logoutButton(page).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { name: 'Favorites', exact: true }),
  ).toHaveCount(0);
  await expect(anyHeart(page)).toHaveCount(0);
  await expect(favoritesCountButton(page)).toHaveCount(0);
});

test('signed-out browsing keeps search, genre filtering and pagination', async ({
  page,
}) => {
  await page.goto('/');
  await signedOut(page);
  await searchInput(page).fill('space');
  await expect(card(page, 'Space Tour')).toBeVisible();

  await page.getByRole('button', { name: 'Drama', exact: true }).click();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await arrow(page, 'Next page').click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
});
