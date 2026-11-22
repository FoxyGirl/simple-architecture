import { expect, test } from '@playwright/test';

import {
  accountEmail,
  backdrop,
  closeButton,
  emailInput,
  logoutButton,
  modal,
  openSignIn,
  signIn,
  signInButton,
  signedInAs,
  signedOut,
  submitButton,
} from './auth-helpers';

test('signing in from the modal shows the email until logout', async ({
  page,
}) => {
  await page.goto('/');
  await signedOut(page);

  await signIn(page, 'ada@example.com');
  await signedInAs(page, 'ada@example.com');

  await logoutButton(page).click();
  await signedOut(page);
  await expect(accountEmail(page, 'ada@example.com')).toBeHidden();
});

test('the session survives a reload without another login', async ({
  page,
}) => {
  await page.goto('/');
  await signIn(page, 'grace@example.com');
  await signedInAs(page, 'grace@example.com');

  await page.reload();

  await expect(accountEmail(page, 'grace@example.com')).toBeVisible();
  await expect(signInButton(page)).toBeHidden();
});

test('empty and non-email submits stay open with an inline error', async ({
  page,
}) => {
  await page.goto('/');
  await openSignIn(page);

  await submitButton(page).click();
  await expect(modal(page).getByRole('alert')).toHaveText(
    'Enter a valid email address.',
  );
  await expect(modal(page)).toBeVisible();

  await emailInput(page).fill('not-an-email');
  await submitButton(page).click();
  await expect(modal(page).getByRole('alert')).toHaveText(
    'Enter a valid email address.',
  );

  await expect(modal(page)).toBeVisible();
  await expect(signInButton(page)).toBeVisible();
  await expect(logoutButton(page)).toBeHidden();
  await expect(accountEmail(page, 'not-an-email')).toBeHidden();
});

test('dismissing the modal leaves the app signed out', async ({ page }) => {
  await page.goto('/');

  await openSignIn(page);
  await closeButton(page).click();
  await expect(modal(page)).toBeHidden();

  await openSignIn(page);
  await page.keyboard.press('Escape');
  await expect(modal(page)).toBeHidden();

  await openSignIn(page);
  await backdrop(page).click({ position: { x: 4, y: 4 } });
  await expect(modal(page)).toBeHidden();

  await signedOut(page);
});
