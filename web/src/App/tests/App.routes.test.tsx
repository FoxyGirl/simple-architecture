import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/api/errors';
import { requestJson } from '~/api/request';
import { clearFavorites, clearSession, store } from '~/store';
import { stubApi } from '~/test/api-mock';
import { LocationProbe } from '~/test/location-probe';
import type { AuthSession } from '~/types';

import { App } from '../App';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const emptyPage = { shows: [], page: 1, pageCount: 1, totalCount: 0 };

const renderAt = (entry: string) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <LocationProbe />
        <App />
      </MemoryRouter>
    </Provider>,
  );

const location = () => screen.getByTestId('location').textContent ?? '';
const homeHeading = () =>
  screen.queryByRole('heading', { name: 'Discover your next obsession.' });
const favoritesHeading = () =>
  screen.queryByRole('heading', { name: 'Favorites' });
const signInModal = () => screen.queryByRole('dialog', { name: 'Sign in' });

describe('App favorites route guard', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(clearSession());
    store.dispatch(clearFavorites());
  });

  afterEach(cleanup);

  it('redirects a signed-out favorites deep link to the home page', async () => {
    stubApi(api, {
      authMe: () => {
        throw new ApiError('Authentication required', 401);
      },
    });

    renderAt('/favorites');

    await waitFor(() => expect(location()).toBe('/'));
    expect(homeHeading()).toBeVisible();
    expect(favoritesHeading()).not.toBeInTheDocument();
    expect(signInModal()).not.toBeInTheDocument();
  });

  it('renders the favorites page for a signed-in deep link', async () => {
    stubApi(api, {
      authMe: () => ({ email: 'ada@example.com' }),
      favoritesPage: () => emptyPage,
    });

    renderAt('/favorites');

    expect(
      await screen.findByRole('heading', { name: 'Favorites' }),
    ).toBeVisible();
    expect(location()).toBe('/favorites');
  });

  it('does not decide the favorites route before the boot restore settles', async () => {
    let resolve!: (session: AuthSession) => void;
    const pending = new Promise<AuthSession>((resolveSession) => {
      resolve = resolveSession;
    });
    stubApi(api, {
      authMe: () => pending,
      favoritesPage: () => emptyPage,
    });

    renderAt('/favorites');

    await waitFor(() => expect(location()).toBe('/favorites'));
    expect(homeHeading()).not.toBeInTheDocument();
    expect(favoritesHeading()).not.toBeInTheDocument();

    await act(async () => resolve({ email: 'ada@example.com' }));

    expect(
      await screen.findByRole('heading', { name: 'Favorites' }),
    ).toBeVisible();
    expect(location()).toBe('/favorites');
  });
});
