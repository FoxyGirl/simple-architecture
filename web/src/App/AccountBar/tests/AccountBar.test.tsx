import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import {
  clearSession,
  replaceSession,
  selectSessionEmail,
  store,
} from '~/store';
import { stubApi } from '~/test/api-mock';
import buttonStyles from '~/ui-kit/Button/Button.module.css';

import { decorativeIcon, location, renderBar } from './accountBarHarness';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

describe('AccountBar', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(clearSession());
  });

  afterEach(cleanup);

  it('renders the guest Sign in through the ui-kit Button with an icon', () => {
    renderBar();

    const button = screen.getByRole('button', { name: 'Sign in' });

    expect(button).toHaveClass(buttonStyles.button);
    expect(decorativeIcon(button)).not.toBeNull();
  });

  it('navigates to the sign-in page from the guest entry point', () => {
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(location()).toBe('/login');
  });

  it('swaps Sign in for a Back to Home action on the sign-in page', () => {
    renderBar('/login');

    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Back to Home' });

    expect(button).toHaveClass(buttonStyles.button);
    expect(decorativeIcon(button)).not.toBeNull();

    fireEvent.click(button);

    expect(location()).toBe('/');
  });

  it('renders the email and a Logout ui-kit Button with an icon', async () => {
    store.dispatch(replaceSession({ email: 'ada@example.com' }));
    stubApi(api, { logout: () => ({ email: null }) });
    renderBar();

    expect(screen.getByText('ada@example.com')).toBeVisible();

    const button = screen.getByRole('button', { name: 'Logout' });

    expect(button).toHaveClass(buttonStyles.button);
    expect(decorativeIcon(button)).not.toBeNull();

    fireEvent.click(button);

    await waitFor(() =>
      expect(selectSessionEmail(store.getState())).toBeNull(),
    );
  });
});
