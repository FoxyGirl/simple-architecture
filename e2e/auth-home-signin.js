import { expect } from '@playwright/test';

import {
  backButton,
  emailInput,
  openSignIn,
  signedIn,
  signedOut,
  submitButton,
} from './auth-helpers';
import {
  expectDefaultHomeFields,
  expectDramaPageTwo,
  homeUrl,
} from './auth-home';

// The successful Sign in exit from /login. Like the Back to Home exit, it
// must return to the carried HomePage URL. These flows only read the cards,
// so they toggle no favorite and stay parallel-safe.

const heart = (page) =>
  page.getByRole('button', {
    name: /^(?:Add|Remove) .+ (?:to|from) favorites$/,
  });

const countButton = (page) =>
  page.getByRole('button', { name: /^View favorites \(\d+\)$/ });

const submitEmail = async (page, email) => {
  await emailInput(page).fill(email);
  await submitButton(page).click();
};

export const signInRestoresFlow = async (page, email) => {
  await page.goto(homeUrl);
  await expectDramaPageTwo(page);

  await openSignIn(page);
  await submitEmail(page, email);

  await expectDramaPageTwo(page);
  await signedIn(page, email);
  await expect(heart(page).first()).toBeVisible();
  await expect(countButton(page)).toBeVisible();
};

export const signInDirectFlow = async (page, email) => {
  await page.goto('/login');
  await submitEmail(page, email);

  await expectDefaultHomeFields(page);
  await signedIn(page, email);
  await expect(countButton(page)).toBeVisible();
};

export const signInReloadFlow = async (page, email) => {
  await page.goto(homeUrl);
  await expectDramaPageTwo(page);

  await openSignIn(page);
  await page.reload();
  await submitEmail(page, email);

  await expectDramaPageTwo(page);
  await signedIn(page, email);
};

export const invalidEmailKeepsCarriedFlow = async (page) => {
  await page.goto(homeUrl);
  await expectDramaPageTwo(page);

  await openSignIn(page);
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

  await backButton(page).click();
  await expectDramaPageTwo(page);
  await signedOut(page);
};
