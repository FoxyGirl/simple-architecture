import { expect } from '@playwright/test';

import {
  arrow,
  card,
  countButton,
  heart,
  pressed,
  searchInput,
  searchSpace,
  summaryIds,
} from './favorites-helpers';

// Hearts stay backend-driven through genre, page and search changes.
export const heartsFlow = async (page, request) => {
  await searchSpace(page);
  await expect(countButton(page, 0)).toBeVisible();

  // Adding through the heart writes to the backend, not just to the page.
  await heart(page, 'Space Tour', false).click();
  await pressed(page, 'Space Tour');
  await expect.poll(() => summaryIds(request)).toEqual([600]);
  await expect(countButton(page, 1)).toBeVisible();

  // The pressed state survives a genre change, a page change…
  await page.getByRole('button', { name: 'Drama', exact: true }).click();
  await expect(card(page, 'Space Chef')).toBeVisible();
  await pressed(page, 'Space Tour');
  await arrow(page, 'Next page').click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await arrow(page, 'Previous page').click();
  await pressed(page, 'Space Tour');

  // …and a new search.
  await searchInput(page).fill('edge');
  await expect(card(page, 'Edge Times')).toBeVisible();
  await expect(heart(page, 'Edge Times', false)).toBeVisible();
  await searchInput(page).fill('space');
  await pressed(page, 'Space Tour');

  // Removing through the heart clears it on the backend and the count.
  await heart(page, 'Space Tour', true).click();
  await expect(heart(page, 'Space Tour', false)).toBeVisible();
  await expect.poll(() => summaryIds(request)).toEqual([]);
  await expect(countButton(page, 0)).toBeVisible();
};
