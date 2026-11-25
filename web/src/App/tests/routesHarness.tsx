import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { store } from '~/store';
import { LocationProbe } from '~/test/location-probe';

import { App } from '../App';

// Shared render helpers for the App route-guard suites. `state` seeds the
// initial history entry when a route's navigation state is under test.
export const renderAt = (entry: string, state?: unknown) =>
  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[
          state === undefined ? entry : { pathname: entry, state },
        ]}
      >
        <LocationProbe />
        <App />
      </MemoryRouter>
    </Provider>,
  );

export const location = () => screen.getByTestId('location').textContent ?? '';

export const homeHeading = () =>
  screen.queryByRole('heading', { name: 'Discover your next obsession.' });

export const favoritesHeading = () =>
  screen.queryByRole('heading', { name: 'Favorites' });

export const signInHeading = () =>
  screen.queryByRole('heading', { name: 'Sign in' });
