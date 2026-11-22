import { test } from '@playwright/test';

import { prepareFavorites } from './favorites-helpers';
import { heartsFlow } from './favorites-hearts';
import { favoritesPaginationFlow } from './favorites-list';
import { favoritesOptimisticFlow } from './favorites-optimistic';
import { favoritesOptimisticRemovalFlow } from './favorites-optimistic-removal';
import { favoritesPendingFlow } from './favorites-pending';
import { favoritesReloadReturnFlow } from './favorites-reload';
import { roundTripRestoresSearch } from './favorites-round-trip';
import { favoritesSoftRemovalFlow } from './favorites-soft-removal';
import { favoritesToastFlow } from './favorites-toasts';
import { favoritesPageUrlFlow } from './favorites-url';
import { favoritesUsersFlow } from './favorites-users';

// Every favorites mutation runs from this single spec, so Playwright's
// parallel workers never interleave writes. Each flow signs in as its own
// email and clears only that email's list, so the flows never share state.
// Each scenario itself lives in its own flow module next to this file.
const emailFor = (name) => `favorites-${name}@example.com`;

test('hearts are backend-driven and survive genre, page and search changes', async ({
  page,
  request,
}) => {
  const email = emailFor('hearts');
  await prepareFavorites(page, request, email);
  await heartsFlow(page, request, email);
});

test('the favorites page paginates, updates on removal and returns home', async ({
  page,
  request,
}) => {
  const email = emailFor('list');
  await prepareFavorites(page, request, email);
  await favoritesPaginationFlow(page, request, email);
});

test('favorites toasts appear and dismiss themselves', async ({
  page,
  request,
}) => {
  await prepareFavorites(page, request, emailFor('toasts'));
  await favoritesToastFlow(page);
});

test('a removed favorite stays listed until the next fresh fetch', async ({
  page,
  request,
}) => {
  const email = emailFor('soft-removal');
  await prepareFavorites(page, request, email);
  await favoritesSoftRemovalFlow(page, request, email);
});

test('hearts and count flip before the backend responds and roll back on failure', async ({
  page,
  request,
}) => {
  const email = emailFor('optimistic');
  await prepareFavorites(page, request, email);
  await favoritesOptimisticFlow(page, request, email);
});

test('a heart is disabled while its toggle is in flight on both layouts and pages', async ({
  page,
  request,
}) => {
  await prepareFavorites(page, request, emailFor('pending'));
  await favoritesPendingFlow(page);
});

test('favorites page cards flip their removal marking before the backend responds', async ({
  page,
  request,
}) => {
  const email = emailFor('optimistic-removal');
  await prepareFavorites(page, request, email);
  await favoritesOptimisticRemovalFlow(page, request, email);
});

test('search state survives the URL round trip', async ({ page, request }) => {
  await prepareFavorites(page, request, emailFor('round-trip'));
  await roundTripRestoresSearch(page);
});

test('the favorites list page lives in the URL', async ({ page, request }) => {
  await prepareFavorites(page, request, emailFor('url'));
  await favoritesPageUrlFlow(page);
});

test('reloading Favorites keeps Back to Home on the Home URL', async ({
  page,
  request,
}) => {
  await prepareFavorites(page, request, emailFor('reload'));
  await favoritesReloadReturnFlow(page);
});

test('each email keeps its own favorites across logout and login', async ({
  page,
  request,
}) => {
  const emailA = emailFor('users-a');
  const emailB = emailFor('users-b');
  await prepareFavorites(page, request, emailA);
  await favoritesUsersFlow(page, request, emailA, emailB);
});
