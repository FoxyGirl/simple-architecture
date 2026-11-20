import { expect } from '@playwright/test';

import {
  card,
  heart,
  hiddenToast,
  pressed,
  searchSpace,
  shownToast,
} from './favorites-helpers';

// Add/remove toasts and their auto-dismissal across navigation.
export const favoritesToastFlow = async (page) => {
  await searchSpace(page);

  // A heart add toasts the addition and disappears without interaction.
  await heart(page, 'Space Tour', false).click();
  await shownToast(page, '"Space Tour" was added to favorites');
  await hiddenToast(page, '"Space Tour" was added to favorites');

  // Removals on either page toast; the toaster stacks across navigation.
  await heart(page, 'Space Tour', true).click();
  await shownToast(page, '"Space Tour" was removed from favorites');
  await hiddenToast(page, '"Space Tour" was removed from favorites');
  await heart(page, 'Space Chef', false).click();
  await pressed(page, 'Space Chef');
  await page.getByRole('link', { name: 'Favorites' }).click();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await heart(page, 'Space Chef', true).click();
  await shownToast(page, '"Space Chef" was removed from favorites');
  await hiddenToast(page, '"Space Chef" was removed from favorites');
};
