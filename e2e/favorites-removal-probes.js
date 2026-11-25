import { expect } from '@playwright/test';

import { cardContent } from './favorites-helpers';

// Recorded feature-005 removed-state values on the card content: a removed
// card is grayscale and semi-transparent, a normal one has no filter and full
// opacity.
const REMOVED_FILTER = 'grayscale(1)';
const REMOVED_OPACITY = '0.5';

export const expectRemoved = async (page, name) => {
  await expect(cardContent(page, name)).toHaveCSS('filter', REMOVED_FILTER);
  await expect(cardContent(page, name)).toHaveCSS('opacity', REMOVED_OPACITY);
};

export const expectNormal = async (page, name) => {
  await expect(cardContent(page, name)).toHaveCSS('filter', 'none');
  await expect(cardContent(page, name)).toHaveCSS('opacity', '1');
};

export const errorToast = (page) =>
  page.locator('[data-sonner-toast][data-type="error"]');
