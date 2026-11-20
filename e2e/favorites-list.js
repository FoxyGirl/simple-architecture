import { expect } from '@playwright/test';

import {
  addFourSpaceShows,
  arrow,
  card,
  cardArticle,
  countButton,
  heart,
  pageInfo,
  searchInput,
  searchSpace,
  subhead,
  summaryIds,
} from './favorites-helpers';

// The Favorites list flow: pagination, deferred removal refresh and the home
// round trip.
export const favoritesPaginationFlow = async (page, request) => {
  await searchSpace(page);
  await addFourSpaceShows(page);
  await expect.poll(() => summaryIds(request)).toHaveLength(4);

  // The count button reaches the Favorites page: three per page, two pages.
  await expect(countButton(page, 4)).toBeVisible();
  await countButton(page, 4).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(card(page, 'Space Series')).toBeVisible();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await expect(card(page, 'Space Wars')).toHaveCount(0);
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(subhead(page, '4 shows saved to your list.')).toBeVisible();

  // Next/Prev walk the pages.
  await arrow(page, 'Next page').click();
  await expect(card(page, 'Space Wars')).toBeVisible();
  await expect(pageInfo(page, 'Page 2 of 2')).toBeVisible();
  await arrow(page, 'Previous page').click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();

  // A removal keeps the card listed and the fetched metadata untouched;
  // only the backend summary shrinks.
  await heart(page, 'Space Tour', true).click();
  await expect(cardArticle(page, 'Space Tour')).toBeVisible();
  await expect(heart(page, 'Space Tour', false)).toBeVisible();
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(subhead(page, '4 shows saved to your list.')).toBeVisible();
  await expect.poll(() => summaryIds(request)).toHaveLength(3);

  // The deferred refresh shows on the next fresh fetch: the reload drops the
  // removed card and the backend clamps the list to one page.
  await page.reload();
  await expect(card(page, 'Space Tour')).toHaveCount(0);
  await expect(card(page, 'Space Wars')).toBeVisible();
  await expect(pageInfo(page, 'Page 1 of 1')).toBeVisible();
  await expect(subhead(page, '3 shows saved to your list.')).toBeVisible();

  // The reload must keep the remembered Home URL and the count must reflect
  // the removal made on the other page: Back to Home restores the
  // parameterized HomePage instead of stepping through old history.
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/\?search=space&page=2$/);
  await expect(searchInput(page)).toBeVisible();
  await expect(countButton(page, 3)).toBeVisible();
};
