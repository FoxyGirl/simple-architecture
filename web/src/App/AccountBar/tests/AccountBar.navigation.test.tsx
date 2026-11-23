import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clearSession, store } from '~/store';

import { location, renderBar } from './accountBarHarness';

describe('AccountBar navigation', () => {
  beforeEach(() => {
    store.dispatch(clearSession());
  });

  afterEach(cleanup);

  it('returns to the parameterized Home URL after leaving it for sign-in', () => {
    renderBar({
      pathname: '/',
      search: '?search=world&genre=Drama&page=2',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(location()).toBe('/login');

    fireEvent.click(screen.getByRole('button', { name: 'Back to Home' }));

    expect(location()).toBe('/?search=world&genre=Drama&page=2');
  });

  it('returns to a carried Home URL when the sign-in page has state', () => {
    renderBar({
      pathname: '/login',
      state: { fromHome: '/?search=world&page=2' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Back to Home' }));

    expect(location()).toBe('/?search=world&page=2');
  });
});
