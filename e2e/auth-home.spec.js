import { test } from '@playwright/test';

import {
  backToHomeDirectFlow,
  backToHomeReloadFlow,
  backToHomeRestoresFlow,
} from './auth-home';
import {
  invalidEmailKeepsCarriedFlow,
  signInDirectFlow,
  signInReloadFlow,
  signInRestoresFlow,
} from './auth-home-signin';

// The HomePage view carried through the /login detour for both exits: the
// account bar's Back to Home and a successful sign-in. These flows write no
// favorites, so this spec runs in parallel with every other Playwright spec.

test('Back to Home restores the parameterized Home view', async ({ page }) => {
  await backToHomeRestoresFlow(page);
});

test('Back to Home from a directly opened sign-in page shows the bare Home', async ({
  page,
}) => {
  await backToHomeDirectFlow(page);
});

test('reloading the sign-in page keeps the carried Home URL for Back to Home', async ({
  page,
}) => {
  await backToHomeReloadFlow(page);
});

test('signing in restores the parameterized Home view', async ({ page }) => {
  await signInRestoresFlow(page, 'home-signin@example.com');
});

test('signing in from a directly opened sign-in page shows the bare Home', async ({
  page,
}) => {
  await signInDirectFlow(page, 'home-direct@example.com');
});

test('reloading the sign-in page keeps the carried Home URL for sign-in', async ({
  page,
}) => {
  await signInReloadFlow(page, 'home-reload@example.com');
});

test('an invalid email keeps the carried Home URL for Back to Home', async ({
  page,
}) => {
  await invalidEmailKeepsCarriedFlow(page);
});
