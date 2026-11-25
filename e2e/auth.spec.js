import { expect, test } from '@playwright/test';

import {
  accountEmail,
  backButton,
  emailInput,
  logoutButton,
  openSignIn,
  signIn,
  signInButton,
  signInHeading,
  signedInAs,
  signedOut,
  submitButton,
} from './auth-helpers';

test('signing in from the sign-in page shows the email until logout', async ({
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

test('the page explains favorites and an invalid submit stays with an inline error', async ({
  page,
}) => {
  await page.goto('/');
  await openSignIn(page);

  await expect(
    page.getByText('Sign in is required to save favorites.'),
  ).toBeVisible();

  await submitButton(page).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Enter a valid email address.',
  );
  await expect(page).toHaveURL(/\/login$/);

  await emailInput(page).fill('not-an-email');
  await submitButton(page).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Enter a valid email address.',
  );

  await expect(page).toHaveURL(/\/login$/);
  await expect(backButton(page)).toBeVisible();
  await expect(logoutButton(page)).toBeHidden();
  await expect(accountEmail(page, 'not-an-email')).toBeHidden();
});

test('the sign-in page is not a dialog and Cancel/Back returns home signed out', async ({
  page,
}) => {
  await page.goto('/');

  await openSignIn(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(signInButton(page)).toHaveCount(0);
  await expect(backButton(page)).toBeVisible();

  await backButton(page).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(signInHeading(page)).toHaveCount(0);
  await signedOut(page);
});

test('a signed-in visit to the sign-in page redirects home', async ({
  page,
}) => {
  await page.goto('/');
  await signIn(page, 'route@example.com');
  await signedInAs(page, 'route@example.com');

  await page.goto('/login');

  await expect(page).toHaveURL(/\/$/);
  await expect(signInHeading(page)).toHaveCount(0);
  await expect(accountEmail(page, 'route@example.com')).toBeVisible();
});
