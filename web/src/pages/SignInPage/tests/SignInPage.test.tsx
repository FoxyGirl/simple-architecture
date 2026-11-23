import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { store } from '~/store';
import { stubApi } from '~/test/api-mock';
import buttonStyles from '~/ui-kit/Button/Button.module.css';

import { SignInPage } from '../SignInPage';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const renderPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <SignInPage />
      </MemoryRouter>
    </Provider>,
  );

beforeEach(() => {
  api.mockReset();
});

afterEach(cleanup);

describe('SignInPage', () => {
  it('is a page with a heading, one email field, the favorites explanation and a way back', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(screen.getByText(/required to save favorites/i)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Back to Home' })).toBeEnabled();
  });

  it('is not rendered as a modal dialog', () => {
    renderPage();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the inline error on an invalid submit without leaving the page', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid email address.',
    );
    expect(
      screen.getByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });

  it('renders the submit through the ui-kit Button', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Continue' })).toHaveClass(
      buttonStyles.button,
    );
  });

  it('disables the submit while the sign-in request is in flight', async () => {
    let resolveLogin: (session: { email: string }) => void = () => {};
    stubApi(api, {
      login: () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    });
    renderPage();

    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();

    await act(async () => {
      resolveLogin({ email: 'ada@example.com' });
    });
  });
});
