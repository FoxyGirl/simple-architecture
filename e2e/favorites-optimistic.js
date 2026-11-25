import { expect } from '@playwright/test';

import {
  countButton,
  heart,
  pressed,
  searchSpace,
  shownToast,
  summaryIds,
  toast,
} from './favorites-helpers';
import { holdWrites } from './favorites-intercept';

const errorToast = (page) =>
  page.locator('[data-sonner-toast][data-type="error"]');

export const favoritesOptimisticFlow = async (page, request, email) => {
  await searchSpace(page);
  await expect(countButton(page, 0)).toBeVisible();

  // Optimistic add: the heart and the count flip while the POST is held and
  // the in-flight heart rejects further clicks. Only the confirmation shows
  // the toast, re-enables the heart and reconciles the backend summary.
  const writes = await holdWrites(page);
  await heart(page, 'Space Tour', false).click();
  await pressed(page, 'Space Tour');
  await expect(heart(page, 'Space Tour', true)).toBeDisabled();
  await heart(page, 'Space Tour', true).click({ force: true });
  await expect(countButton(page, 1)).toBeVisible();
  await expect(toast(page, '"Space Tour" was added to favorites')).toHaveCount(
    0,
  );
  await expect.poll(() => summaryIds(request, email)).toEqual([]);

  writes.release();
  await shownToast(page, '"Space Tour" was added to favorites');
  await expect(heart(page, 'Space Tour', true)).toBeEnabled();
  expect(writes.hits()).toBe(1);
  await expect.poll(() => summaryIds(request, email)).toEqual([600]);

  // Optimistic removal: the same window for the DELETE direction.
  await heart(page, 'Space Tour', true).click();
  await expect(heart(page, 'Space Tour', false)).toBeDisabled();
  await expect(countButton(page, 0)).toBeVisible();
  await expect(
    toast(page, '"Space Tour" was removed from favorites'),
  ).toHaveCount(0);

  writes.release();
  await shownToast(page, '"Space Tour" was removed from favorites');
  await expect(heart(page, 'Space Tour', false)).toBeEnabled();
  expect(writes.hits()).toBe(2);
  await expect.poll(() => summaryIds(request, email)).toEqual([]);

  // A failed write rolls the optimistic state back: the heart and the count
  // return to their pre-click values, the error toast shows, no success toast
  // appears for this show, the heart re-enables and the backend never saw the
  // write.
  await heart(page, 'Space Chef', false).click();
  await pressed(page, 'Space Chef');
  await expect(heart(page, 'Space Chef', true)).toBeDisabled();
  await expect(countButton(page, 1)).toBeVisible();

  writes.fail();
  await expect(errorToast(page)).toBeVisible();
  await expect(heart(page, 'Space Chef', false)).toBeEnabled();
  await expect(heart(page, 'Space Chef', false)).toBeVisible();
  await expect(countButton(page, 0)).toBeVisible();
  await expect(toast(page, '"Space Chef" was added to favorites')).toHaveCount(
    0,
  );
  expect(writes.hits()).toBe(3);
  await expect.poll(() => summaryIds(request, email)).toEqual([]);
};
