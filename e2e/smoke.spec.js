import { test, expect } from '@playwright/test';

test('app loads and shows the search input', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('textbox', { name: 'Search for TV shows' }),
  ).toBeVisible();
});
