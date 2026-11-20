import { expect } from '@playwright/test';

import {
  addFourSpaceShows,
  card,
  cardArticle,
  cardContent,
  countButton,
  heart,
  pageInfo,
  pressed,
  searchSpace,
  subhead,
  summaryIds,
} from './favorites-helpers';

// Recorded removed-state values on the card content; a normal card has no
// filter and full opacity.
const REMOVED_FILTER = 'grayscale(1)';
const REMOVED_OPACITY = '0.5';
const FAVORITE_PINK = 'rgb(241, 73, 129)';

// The soft-removal round: a removal keeps its card listed in the removed
// visual state, the flipped heart restores it, and only a fresh fetch shows
// backend state. It also proves the mobile row card, the hover heart outline
// and the HomePage regression.
export const favoritesSoftRemovalFlow = async (page, request) => {
  await searchSpace(page);
  await addFourSpaceShows(page);
  await countButton(page, 4).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(subhead(page, '4 shows saved to your list.')).toBeVisible();

  // A removal keeps the card and the fetched metadata, flags the heart and
  // applies the removed visual state; only the summary changes.
  await heart(page, 'Space Tour', true).click();
  await expect(cardArticle(page, 'Space Tour')).toBeVisible();
  await expect(cardContent(page, 'Space Tour')).toHaveCSS(
    'filter',
    REMOVED_FILTER,
  );
  await expect(cardContent(page, 'Space Tour')).toHaveCSS(
    'opacity',
    REMOVED_OPACITY,
  );
  await expect(heart(page, 'Space Tour', false)).toBeVisible();
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(subhead(page, '4 shows saved to your list.')).toBeVisible();
  await expect.poll(() => summaryIds(request)).toHaveLength(3);

  // The heart keeps its pink hover outline outside the grayscale and the
  // button ring stays off on hover.
  const removedHeart = heart(page, 'Space Tour', false);
  await removedHeart.hover();
  await expect(removedHeart.locator('svg')).toHaveCSS('color', FAVORITE_PINK);
  await expect(removedHeart).toHaveCSS('border-top-width', '0px');

  // The flipped heart re-adds the show in place, restoring the full-color
  // appearance without a refetch.
  await heart(page, 'Space Tour', false).click();
  await pressed(page, 'Space Tour');
  await expect(cardContent(page, 'Space Tour')).toHaveCSS('filter', 'none');
  await expect(cardContent(page, 'Space Tour')).toHaveCSS('opacity', '1');
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(subhead(page, '4 shows saved to your list.')).toBeVisible();
  await expect.poll(() => summaryIds(request)).toHaveLength(4);

  // Remove a second show: the removal this flow leaves behind.
  await heart(page, 'Space Series', true).click();
  await expect(heart(page, 'Space Series', false)).toBeVisible();
  await expect.poll(() => summaryIds(request)).toHaveLength(3);

  // The same removed state renders on the mobile row card below 1024px.
  await page.setViewportSize({ width: 900, height: 1000 });
  await expect(cardArticle(page, 'Space Series')).toBeVisible();
  await expect(cardContent(page, 'Space Series')).toHaveCSS(
    'filter',
    REMOVED_FILTER,
  );
  await expect(cardContent(page, 'Space Series')).toHaveCSS(
    'opacity',
    REMOVED_OPACITY,
  );

  // Leaving shows the removal on the HomePage count; a HomePage removal never
  // renders the removed state.
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/\?search=space&page=2$/);
  await expect(countButton(page, 3)).toBeVisible();
  await heart(page, 'Space Wars', true).click();
  await expect(heart(page, 'Space Wars', false)).toBeVisible();
  await expect(cardContent(page, 'Space Wars')).toHaveCSS('filter', 'none');
  await expect(cardContent(page, 'Space Wars')).toHaveCSS('opacity', '1');
  await expect(countButton(page, 2)).toBeVisible();

  // Returning fetches backend state only: both removed shows are absent, the
  // re-added one is present and no card carries the removed styling.
  await countButton(page, 2).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(card(page, 'Space Series')).toHaveCount(0);
  await expect(card(page, 'Space Wars')).toHaveCount(0);
  await pressed(page, 'Space Tour');
  await expect(cardContent(page, 'Space Tour')).toHaveCSS('filter', 'none');
  await expect(cardContent(page, 'Space Tour')).toHaveCSS('opacity', '1');
  await expect(pageInfo(page, 'Page 1 of 1')).toBeVisible();
  await expect(subhead(page, '2 shows saved to your list.')).toBeVisible();

  // The reload repeats the fresh fetch; no removed styling survives.
  await page.reload();
  await expect(card(page, 'Space Series')).toHaveCount(0);
  await pressed(page, 'Space Tour');
  await expect(cardContent(page, 'Space Tour')).toHaveCSS('filter', 'none');
  await expect(cardContent(page, 'Space Tour')).toHaveCSS('opacity', '1');
  await expect(pageInfo(page, 'Page 1 of 1')).toBeVisible();
  await expect(subhead(page, '2 shows saved to your list.')).toBeVisible();
};
