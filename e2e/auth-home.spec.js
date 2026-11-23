import { test } from '@playwright/test';

import {
  backToHomeDirectFlow,
  backToHomeReloadFlow,
  backToHomeRestoresFlow,
} from './auth-home';

// The HomePage view carried through the /login detour for the Back to Home
// exit. These flows write no favorites, so this spec runs in parallel with
// every other Playwright spec.

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
