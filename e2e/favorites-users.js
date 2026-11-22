import { expect } from '@playwright/test';

import {
  card,
  countButton,
  heart,
  pressed,
  searchSpace,
  signIn,
  signOut,
  summaryIds,
} from './favorites-helpers';

// Favorites belong to the signed-in email: user A's two shows are invisible
// to user B, and logging back in as A restores exactly A's list.
export const favoritesUsersFlow = async (page, request, emailA, emailB) => {
  await searchSpace(page);
  await expect(countButton(page, 0)).toBeVisible();

  await heart(page, 'Space Tour', false).click();
  await pressed(page, 'Space Tour');
  await heart(page, 'Space Chef', false).click();
  await pressed(page, 'Space Chef');
  await expect(countButton(page, 2)).toBeVisible();
  await expect.poll(() => summaryIds(request, emailA)).toEqual([600, 602]);

  await countButton(page, 2).click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await page.getByRole('button', { name: 'Back to Home' }).click();

  // The second email starts empty: no count, no list, no favorited hearts.
  await signOut(page);
  await signIn(page, emailB);
  await expect(countButton(page, 0)).toBeVisible();
  await searchSpace(page);
  await expect(heart(page, 'Space Tour', false)).toBeVisible();
  await expect(heart(page, 'Space Chef', false)).toBeVisible();
  await expect(countButton(page, 0)).toBeVisible();
  await countButton(page, 0).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(page.getByText('No favorites yet.')).toBeVisible();
  await expect.poll(() => summaryIds(request, emailB)).toEqual([]);

  // Logging back in as A restores the same count, hearts and list.
  await signOut(page);
  await signIn(page, emailA);
  await expect(countButton(page, 2)).toBeVisible();
  await searchSpace(page);
  await pressed(page, 'Space Tour');
  await pressed(page, 'Space Chef');

  await countButton(page, 2).click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await expect.poll(() => summaryIds(request, emailA)).toEqual([600, 602]);
};
