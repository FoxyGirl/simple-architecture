import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import {
  clearSession,
  replaceFavoritesSummary,
  replaceSession,
  store,
} from '~/store';
import { apiCalls, stubApi } from '~/test/api-mock';

import {
  remountHomePage,
  renderHomePage,
  settle,
} from '../../../test/home-flow';

// The count button reads the backend summary the Entity mirrors.
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const countButton = (count: number) =>
  screen.getByRole('button', { name: `View favorites (${count})` });

const anyCountButton = () =>
  screen.queryByRole('button', { name: /^View favorites \(\d+\)$/ });

const signInPrompt = () =>
  screen.getByText(
    'Please sign in to add your favorite shows to your Favorites list and keep track of the ones you love!',
  );

const countSyncs = () =>
  apiCalls(api).filter((call) => call.path === '/api/favorites/count');

describe('HomePage favorites visibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.dispatch(replaceFavoritesSummary({ count: 0, ids: [] }));
    store.dispatch(clearSession());
    api.mockReset();
    stubApi(api, { favoritesCount: () => ({ count: 2, ids: [1, 2] }) });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders the sign-in prompt and no count button while signed out', async () => {
    remountHomePage();
    await settle();

    expect(anyCountButton()).not.toBeInTheDocument();
    expect(signInPrompt()).toBeVisible();
    expect(countSyncs()).toHaveLength(0);
  });

  it('replaces the prompt with the button once a session starts', async () => {
    remountHomePage();
    await settle();

    expect(anyCountButton()).not.toBeInTheDocument();
    expect(signInPrompt()).toBeVisible();

    await act(async () => {
      store.dispatch(replaceSession({ email: 'ada@example.com' }));
    });
    await settle();

    expect(countButton(2)).toBeVisible();
    expect(signInPrompt()).not.toBeInTheDocument();
    expect(countSyncs()).toHaveLength(1);
  });

  it('re-syncs when the signed-in email changes', async () => {
    store.dispatch(replaceSession({ email: 'ada@example.com' }));
    renderHomePage();
    await settle();

    expect(countSyncs()).toHaveLength(1);

    await act(async () => {
      store.dispatch(replaceSession({ email: 'grace@example.com' }));
    });
    await settle();

    expect(countSyncs()).toHaveLength(2);
  });
});
