import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import type { SignInLocationState } from '~/pages/types';
import { store } from '~/store';
import { LocationProbe } from '~/test/location-probe';

import { AccountBar } from '../AccountBar';

export type BarEntry =
  string | { pathname: string; search?: string; state?: SignInLocationState };

// Mounts the bar inside the app's router and the real session Entity.
export const renderBar = (entry: BarEntry = '/') =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <LocationProbe />
        <AccountBar />
      </MemoryRouter>
    </Provider>,
  );

export const location = () => screen.getByTestId('location').textContent ?? '';

export const decorativeIcon = (button: HTMLElement) =>
  button.querySelector('svg')?.closest('[aria-hidden="true"]');
