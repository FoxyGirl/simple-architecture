import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/api/errors';
import { requestJson } from '~/api/request';
import { clearFavorites, clearSession, store } from '~/store';
import { stubApi } from '~/test/api-mock';
import type { AuthSession } from '~/types';

import {
  homeHeading,
  location,
  renderAt,
  signInHeading,
} from './routesHarness';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

describe('App login route guard', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(clearSession());
    store.dispatch(clearFavorites());
  });

  afterEach(cleanup);

  it('renders the sign-in page for a signed-out login deep link', async () => {
    stubApi(api, {
      authMe: () => {
        throw new ApiError('Authentication required', 401);
      },
    });

    renderAt('/login');

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible();
    expect(location()).toBe('/login');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('redirects a signed-in login deep link to the home page', async () => {
    stubApi(api, {
      authMe: () => ({ email: 'ada@example.com' }),
    });

    renderAt('/login');

    await waitFor(() => expect(location()).toBe('/'));
    expect(homeHeading()).toBeVisible();
    expect(signInHeading()).not.toBeInTheDocument();
  });

  it('does not decide the login route before the boot restore settles', async () => {
    let resolve!: (session: AuthSession) => void;
    const pending = new Promise<AuthSession>((resolveSession) => {
      resolve = resolveSession;
    });
    stubApi(api, { authMe: () => pending });

    renderAt('/login');

    await waitFor(() => expect(location()).toBe('/login'));
    expect(signInHeading()).not.toBeInTheDocument();
    expect(homeHeading()).not.toBeInTheDocument();

    await act(async () => resolve({ email: 'ada@example.com' }));

    await waitFor(() => expect(location()).toBe('/'));
  });
});
