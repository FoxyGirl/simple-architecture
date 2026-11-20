import { expect } from '@playwright/test';

import {
  addFourSpaceShows,
  arrow,
  card,
  countButton,
  searchInput,
  searchSpace,
} from './favorites-helpers';

// Reloading Favorites must not lose the Home URL remembered when leaving
// Home: Back to Home returns to that exact parameterized view.
export const favoritesReloadReturnFlow = async (page) => {
  await searchSpace(page);
  await addFourSpaceShows(page);
  await countButton(page, 4).click();
  await expect(page).toHaveURL(/\/favorites$/);

  await arrow(page, 'Next page').click();
  await expect(page).toHaveURL(/\/favorites\?page=2$/);
  await expect(card(page, 'Space Wars')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(card(page, 'Space Wars')).toBeVisible();

  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/\?search=space&page=2$/);
  await expect(searchInput(page)).toHaveValue('space');
  await expect(card(page, 'Space Wars')).toBeVisible();
};
