import { expect } from '@playwright/test';

import {
  card,
  countButton,
  heart,
  pressed,
  searchSpace,
  shownToast,
} from './favorites-helpers';
import { holdWrites } from './favorites-intercept';

// The pending registry disables only the toggled show's heart, on both card
// layouts and on both pages: the optimistic flow proves the HomePage desktop
// window, this flow adds the mobile row card and the Favorites page card.
export const favoritesPendingFlow = async (page) => {
  await searchSpace(page);
  await expect(countButton(page, 0)).toBeVisible();

  // HomePage desktop grid card: the heart is disabled while the POST is held
  // and re-enabled once it resolves.
  const writes = await holdWrites(page);
  await heart(page, 'Space Tour', false).click();
  await expect(heart(page, 'Space Tour', true)).toBeDisabled();
  writes.release();
  await pressed(page, 'Space Tour');
  await expect(heart(page, 'Space Tour', true)).toBeEnabled();

  // HomePage mobile row card below the 1024px breakpoint: the same registry
  // renders the disabled state through ShowRowCard.
  await page.setViewportSize({ width: 900, height: 1000 });
  await heart(page, 'Space Chef', false).click();
  await expect(heart(page, 'Space Chef', true)).toBeDisabled();
  writes.release();
  await pressed(page, 'Space Chef');
  await expect(heart(page, 'Space Chef', true)).toBeEnabled();

  // The Favorites page reads the shared registry too: the card's heart is
  // disabled while its DELETE is held and re-enabled after confirmation.
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(countButton(page, 2)).toBeVisible();
  await countButton(page, 2).click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await heart(page, 'Space Tour', true).click();
  await expect(heart(page, 'Space Tour', true)).toBeDisabled();
  await heart(page, 'Space Tour', true).click({ force: true });
  writes.release();
  await shownToast(page, '"Space Tour" was removed from favorites');
  await expect(heart(page, 'Space Tour', false)).toBeEnabled();
  expect(writes.hits()).toBe(3);
};
