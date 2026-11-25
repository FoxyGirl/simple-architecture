import { expect } from '@playwright/test';

import {
  addFourSpaceShows,
  card,
  countButton,
  heart,
  pageInfo,
  searchSpace,
  shownToast,
  subhead,
  summaryIds,
  toast,
} from './favorites-helpers';
import { holdWrites, trackListFetches } from './favorites-intercept';
import {
  errorToast,
  expectNormal,
  expectRemoved,
} from './favorites-removal-probes';

// The Favorites page applies the soft-removal marking optimistically: the
// card flips at click time, the list never refetches and a failure rolls the
// flip back with the existing error toast.
export const favoritesOptimisticRemovalFlow = async (page, request, email) => {
  await searchSpace(page);
  await addFourSpaceShows(page);

  const listFetches = await trackListFetches(page);
  const writes = await holdWrites(page);

  await countButton(page, 4).click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();

  // React StrictMode double-runs the mount effect in dev, so the reference is
  // the fetch count after the page settled — a toggle must add none.
  const mountFetches = listFetches();
  expect(mountFetches).toBeGreaterThan(0);

  // A held DELETE grays the card out and flips the heart at click time; the
  // fetched metadata stays and the list is not refetched.
  await heart(page, 'Space Tour', true).click();
  await expect(heart(page, 'Space Tour', false)).toBeDisabled();
  await expectRemoved(page, 'Space Tour');
  await expect(subhead(page, '3 shows saved to your list.')).toBeVisible();
  await expect(pageInfo(page, 'Page 1 of 2')).toBeVisible();
  await expect(
    toast(page, '"Space Tour" was removed from favorites'),
  ).toHaveCount(0);
  expect(listFetches()).toBe(mountFetches);

  writes.release();
  await shownToast(page, '"Space Tour" was removed from favorites');
  await expect(heart(page, 'Space Tour', false)).toBeEnabled();
  await expect.poll(() => summaryIds(request, email)).toHaveLength(3);
  expect(listFetches()).toBe(mountFetches);

  // A held POST restores the grayed card at click time; the confirmation only
  // toasts.
  await heart(page, 'Space Tour', false).click();
  await expect(heart(page, 'Space Tour', true)).toBeDisabled();
  await expectNormal(page, 'Space Tour');
  await expect(subhead(page, '4 shows saved to your list.')).toBeVisible();
  await expect(toast(page, '"Space Tour" was added to favorites')).toHaveCount(
    0,
  );

  writes.release();
  await shownToast(page, '"Space Tour" was added to favorites');
  await expect(heart(page, 'Space Tour', true)).toBeEnabled();
  await expect.poll(() => summaryIds(request, email)).toHaveLength(4);

  // An aborted DELETE reverts the gray-out with the error toast, no success
  // toast and still no refetch.
  await heart(page, 'Space Series', true).click();
  await expectRemoved(page, 'Space Series');
  await expect(heart(page, 'Space Series', false)).toBeDisabled();

  writes.fail();
  await expect(errorToast(page)).toBeVisible();
  await expect(heart(page, 'Space Series', true)).toBeEnabled();
  await expectNormal(page, 'Space Series');
  await expect(
    toast(page, '"Space Series" was removed from favorites'),
  ).toHaveCount(0);
  expect(listFetches()).toBe(mountFetches);

  // A confirmed removal, then a failed re-add re-grays the card.
  await heart(page, 'Space Series', true).click();
  writes.release();
  await shownToast(page, '"Space Series" was removed from favorites');

  await heart(page, 'Space Series', false).click();
  await expectNormal(page, 'Space Series');
  writes.fail();
  await expect(errorToast(page).last()).toBeVisible();
  await expectRemoved(page, 'Space Series');
  await expect(heart(page, 'Space Series', false)).toBeEnabled();
  await expect(
    toast(page, '"Space Series" was added to favorites'),
  ).toHaveCount(0);

  // The mobile row card applies the same optimistic marking.
  await page.setViewportSize({ width: 900, height: 1000 });
  await heart(page, 'Space Chef', true).click();
  await expectRemoved(page, 'Space Chef');
  await expect(heart(page, 'Space Chef', false)).toBeDisabled();

  writes.release();
  await shownToast(page, '"Space Chef" was removed from favorites');
  await expect(heart(page, 'Space Chef', false)).toBeEnabled();
  expect(listFetches()).toBe(mountFetches);
};
