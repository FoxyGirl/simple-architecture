import { expect } from '@playwright/test';

import {
  addFourSpaceShows,
  card,
  cardArticle,
  countButton,
  heart,
  pageInfo,
  pressed,
  searchSpace,
  subhead,
  summaryIds,
} from './favorites-helpers';

// The soft-removal round: a removal keeps its card listed, the flipped heart
// re-adds it in place, and only a fresh fetch shows backend state.
export const favoritesSoftRemovalFlow = async (page, request) => {
  await searchSpace(page);
  await addFourSpaceShows(page);
  await countButton(page, 4).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(subhead(page, '4 shows saved to your list.')).toBeVisible();

  // A removal keeps the card and the fetched metadata; only the backend
  // summary changes.
  await heart(page, 'Space Tour', true).click();
  await expect(cardArticle(page, 'Space Tour')).toBeVisible();
  await expect(heart(page, 'Space Tour', false)).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(subhead(page, '4 shows saved to your list.')).toBeVisible();
  await expect.poll(() => summaryIds(request)).toHaveLength(3);

  // The flipped heart re-adds the show in place, still without a refetch.
  await heart(page, 'Space Tour', false).click();
  await pressed(page, 'Space Tour');
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(subhead(page, '4 shows saved to your list.')).toBeVisible();
  await expect.poll(() => summaryIds(request)).toHaveLength(4);

  // Remove a second show: the removal this flow leaves behind.
  await heart(page, 'Space Series', true).click();
  await expect(heart(page, 'Space Series', false)).toBeVisible();
  await expect.poll(() => summaryIds(request)).toHaveLength(3);

  // Leaving shows the removal on the HomePage count; returning and reloading
  // fetch backend state only — the re-added show is present, the removed one
  // gone, no stale marking.
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/\?search=space&page=2$/);
  await expect(countButton(page, 3)).toBeVisible();

  await countButton(page, 3).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(card(page, 'Space Series')).toHaveCount(0);
  await pressed(page, 'Space Tour');
  await expect(pageInfo(page, 'Page 1 of 1')).toBeVisible();
  await expect(subhead(page, '3 shows saved to your list.')).toBeVisible();

  await page.reload();
  await expect(card(page, 'Space Series')).toHaveCount(0);
  await pressed(page, 'Space Tour');
  await expect(pageInfo(page, 'Page 1 of 1')).toBeVisible();
  await expect(subhead(page, '3 shows saved to your list.')).toBeVisible();
};
