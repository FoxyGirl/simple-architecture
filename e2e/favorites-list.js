import { expect } from '@playwright/test';

import {
  addFourSpaceShows,
  arrow,
  card,
  countButton,
  heart,
  searchInput,
  searchSpace,
  summaryIds,
} from './favorites-helpers';

// The Favorites list flow: pagination, removal and the home round trip.
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
  await expect(page.getByText('Page 1 of 2')).toBeVisible();
  await expect(page.getByText('4 shows saved to your list.')).toBeVisible();

  // Next/Prev walk the pages; a removal updates the list and pagination.
  await arrow(page, 'Next page').click();
  await expect(card(page, 'Space Wars')).toBeVisible();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await arrow(page, 'Previous page').click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(page.getByText('Page 1 of 2')).toBeVisible();
  await heart(page, 'Space Tour', true).click();
  await expect(card(page, 'Space Tour')).toHaveCount(0);
  await expect(card(page, 'Space Wars')).toBeVisible();
  await expect(page.getByText('Page 1 of 1')).toBeVisible();
  await expect(page.getByText('3 shows saved to your list.')).toBeVisible();
  await expect.poll(() => summaryIds(request)).toHaveLength(3);

  // A reload must keep the remembered Home URL: Back to Home still restores
  // the parameterized HomePage instead of stepping through old history.
  await page.reload();
  await expect(page.getByText('Page 1 of 1')).toBeVisible();

  // Back home, the count reflects the removal made on the other page.
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/\?search=space&page=2$/);
  await expect(searchInput(page)).toBeVisible();
  await expect(countButton(page, 3)).toBeVisible();
};
