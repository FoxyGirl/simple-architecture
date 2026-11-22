// Locators and flows for the email-session auth spec. These flows write no
// favorites, so this spec runs in parallel with every other Playwright spec
// (favorites mutations stay in the single-writer favorites.spec.js).

import { expect } from '@playwright/test';

export const accountBar = (page) => page.getByRole('banner');

export const signInButton = (page) =>
  accountBar(page).getByRole('button', { name: 'Sign in' });

export const signInHeading = (page) =>
  page.getByRole('heading', { name: 'Sign in', exact: true });

export const emailInput = (page) =>
  page.getByRole('textbox', { name: 'Email' });

export const submitButton = (page) =>
  page.getByRole('button', { name: 'Continue' });

export const backButton = (page) =>
  page.getByRole('button', { name: 'Back to Home' });

export const accountEmail = (page, email) => accountBar(page).getByText(email);

export const logoutButton = (page) =>
  accountBar(page).getByRole('button', { name: 'Logout' });

export const openSignIn = async (page) => {
  await signInButton(page).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(signInHeading(page)).toBeVisible();
};

export const signIn = async (page, email) => {
  await openSignIn(page);
  await emailInput(page).fill(email);
  await submitButton(page).click();
};

export const signedInAs = async (page, email) => {
  await expect(page).toHaveURL(/\/$/);
  await expect(accountEmail(page, email)).toBeVisible();
  await expect(signInButton(page)).toBeHidden();
};

export const signedOut = async (page) => {
  await expect(signInButton(page)).toBeVisible();
  await expect(logoutButton(page)).toBeHidden();
};
