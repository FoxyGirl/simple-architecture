import { expect } from '@playwright/test';

import {
  arrow,
  card,
  countButton,
  searchInput,
  searchSpace,
  signOut,
} from './favorites-helpers';

// The parameterized URL the restoration flows must return to.
const searchSpaceDramaPageTwo = async (page) => {
  await searchSpace(page);
  await page.getByRole('button', { name: 'Drama', exact: true }).click();
  await expect(card(page, 'Space Tour')).toBeVisible();
  await arrow(page, 'Next page').click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
};

const expectRestoredSearch = async (page) => {
  await expect(page).toHaveURL(/\/\?search=space&genre=Drama&page=2$/);
  await expect(searchInput(page)).toHaveValue('space');
  await expect(
    page.getByRole('button', { name: 'Drama', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(card(page, 'Space News')).toBeVisible();
  await expect(card(page, 'Space Tour')).toHaveCount(0);
};

const backToRestoredSearch = async (page) => {
  await countButton(page, 0).click();
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expectRestoredSearch(page);
};

// Browser back from Favorites lands on the parameterized HomePage entry.
const browserBackRestoresSearch = async (page) => {
  await countButton(page, 0).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await page.goBack();
  await expectRestoredSearch(page);
};

// A count-button arrival still remembers the parameterized Home URL.
export const roundTripRestoresSearch = async (page) => {
  await searchSpaceDramaPageTwo(page);
  await backToRestoredSearch(page);
  await browserBackRestoresSearch(page);
};

// A logout on Favorites returns to the same parameterized Home view.
export const logoutRestoresSearch = async (page) => {
  await searchSpaceDramaPageTwo(page);
  await countButton(page, 0).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await signOut(page);
  await expectRestoredSearch(page);
};
