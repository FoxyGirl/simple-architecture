import { expect } from '@playwright/test';

import {
  addFourSpaceShows,
  arrow,
  card,
  cardArticle,
  countButton,
  heart,
  pageInfo,
  searchSpace,
  subhead,
} from './favorites-helpers';

// The Favorites list page flow: URL writes, history, deep links, invalid
// defaults and backend clamping after a removal. Called from the single
// favorites spec so every mutation stays sequential.
export const favoritesPageUrlFlow = async (page) => {
  await searchSpace(page);
  await addFourSpaceShows(page);
  await expect(countButton(page, 4)).toBeVisible();
  await countButton(page, 4).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();

  // Next page writes the parameter and pushes a history entry.
  await arrow(page, 'Next page').click();
  await expect(page).toHaveURL(/\/favorites\?page=2$/);
  await expect(pageInfo(page, 'Page 2 of 2')).toBeVisible();
  await expect(card(page, 'Space Wars')).toBeVisible();

  // Back/forward walk the list pages through the URL.
  await page.goBack();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(card(page, 'Space Tour')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/favorites\?page=2$/);
  await expect(card(page, 'Space Wars')).toBeVisible();

  // Reload and direct navigation restore page 2.
  await page.reload();
  await expect(card(page, 'Space Wars')).toBeVisible();
  await page.goto('/favorites?page=2');
  await expect(pageInfo(page, 'Page 2 of 2')).toBeVisible();
  await expect(card(page, 'Space Wars')).toBeVisible();

  // Invalid pages fall back to page 1 without errors.
  await page.goto('/favorites?page=abc');
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await page.goto('/favorites?page=0');
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();

  // Removing the only show on page 2 leaves it listed and the URL untouched;
  // the subhead already counts the live summary (3), while the clamping only
  // shows on the next fresh fetch (the reload below).
  await page.goto('/favorites?page=2');
  await expect(card(page, 'Space Wars')).toBeVisible();
  await heart(page, 'Space Wars', true).click();
  await expect(cardArticle(page, 'Space Wars')).toBeVisible();
  await expect(heart(page, 'Space Wars', false)).toBeVisible();
  await expect(pageInfo(page, 'Page 2 of 2')).toBeVisible();
  await expect(subhead(page, '3 shows saved to your list.')).toBeVisible();
  await expect(page).toHaveURL(/\/favorites\?page=2$/);

  // The reload asks for page 2 again: the backend clamps it to page 1 and the
  // fetched total corrects the URL in place.
  await page.reload();
  await expect(card(page, 'Space Wars')).toHaveCount(0);
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(pageInfo(page, 'Page 1 of 1')).toBeVisible();
  await expect(subhead(page, '3 shows saved to your list.')).toBeVisible();
  await expect(page).toHaveURL(/\/favorites$/);
};
