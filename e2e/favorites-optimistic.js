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

// Only the favorite writes (POST /api/favorites, DELETE /api/favorites/:id)
// are intercepted; the mount summary sync and the backend-side probes pass
// through, so the optimistic window is proven against the real backend.
const WRITE_URL = /\/api\/favorites(?:\/\d+)?$/;

const isWrite = (route) => route.request().method() !== 'GET';

// Holds every write before it reaches the backend: the handler waits for its
// gate to open, then either performs the real request and fulfills with it
// (`release`) or aborts at the network level (`fail`). While a gate stays
// closed the browser has seen no response, so the UI is in the optimistic
// window — and a failed write never touches the backend.
const holdWrites = async (page) => {
  const gates = [];

  await page.route(WRITE_URL, async (route) => {
    if (!isWrite(route)) return route.continue();

    const outcome = await new Promise((open) => gates.push(open));
    if (outcome === 'abort') return route.abort();

    const response = await route.fetch();
    await route.fulfill({ response });
  });

  return {
    release: () => gates.shift()?.('fulfill'),
    fail: () => gates.shift()?.('abort'),
  };
};

const errorToast = (page) =>
  page.locator('[data-sonner-toast][data-type="error"]');

export const favoritesOptimisticFlow = async (page, request) => {
  await searchSpace(page);
  await expect(countButton(page, 0)).toBeVisible();

  // Optimistic add: the heart and the count flip while the POST is held;
  // releasing it confirms the state and only then shows the toast.
  const writes = await holdWrites(page);
  await heart(page, 'Space Tour', false).click();
  await pressed(page, 'Space Tour');
  await expect(countButton(page, 1)).toBeVisible();
  await expect(toast(page, '"Space Tour" was added to favorites')).toHaveCount(
    0,
  );
  await expect.poll(() => summaryIds(request)).toEqual([]);

  writes.release();
  await shownToast(page, '"Space Tour" was added to favorites');
  await expect.poll(() => summaryIds(request)).toEqual([600]);

  // Optimistic removal: the same window for the DELETE direction.
  await heart(page, 'Space Tour', true).click();
  await expect(heart(page, 'Space Tour', false)).toBeVisible();
  await expect(countButton(page, 0)).toBeVisible();
  await expect(
    toast(page, '"Space Tour" was removed from favorites'),
  ).toHaveCount(0);

  writes.release();
  await shownToast(page, '"Space Tour" was removed from favorites');
  await expect.poll(() => summaryIds(request)).toEqual([]);

  // A failed write rolls the optimistic state back: the heart and the count
  // return to their pre-click values, the error toast shows, no success toast
  // appears for this show, and the backend never saw the write.
  await heart(page, 'Space Chef', false).click();
  await pressed(page, 'Space Chef');
  await expect(countButton(page, 1)).toBeVisible();

  writes.fail();
  await expect(errorToast(page)).toBeVisible();
  await expect(heart(page, 'Space Chef', false)).toBeVisible();
  await expect(countButton(page, 0)).toBeVisible();
  await expect(toast(page, '"Space Chef" was added to favorites')).toHaveCount(
    0,
  );
  await expect.poll(() => summaryIds(request)).toEqual([]);
};
