import { test } from '@playwright/test';

import { clearFavorites } from './favorites-helpers';
import { heartsFlow } from './favorites-hearts';
import { favoritesPaginationFlow } from './favorites-list';
import { favoritesReloadReturnFlow } from './favorites-reload';
import { roundTripRestoresSearch } from './favorites-round-trip';
import { favoritesToastFlow } from './favorites-toasts';
import { favoritesPageUrlFlow } from './favorites-url';

// Every favorites mutation runs from this single spec, so Playwright's
// parallel workers never interleave writes against the shared backend.
// Each scenario itself lives in its own flow module next to this file.
test.beforeEach(async ({ request }) => {
  await clearFavorites(request);
});

test('hearts are backend-driven and survive genre, page and search changes', async ({
  page,
  request,
}) => {
  await heartsFlow(page, request);
});

test('the favorites page paginates, updates on removal and returns home', async ({
  page,
  request,
}) => {
  await favoritesPaginationFlow(page, request);
});

test('favorites toasts appear and dismiss themselves', async ({ page }) => {
  await favoritesToastFlow(page);
});

test('search state survives the URL round trip', async ({ page }) => {
  await roundTripRestoresSearch(page);
});

test('the favorites list page lives in the URL', async ({ page }) => {
  await favoritesPageUrlFlow(page);
});

test('reloading Favorites keeps Back to Home on the Home URL', async ({
  page,
}) => {
  await favoritesReloadReturnFlow(page);
});
