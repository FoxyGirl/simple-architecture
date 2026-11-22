import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { store } from '~/store';

import { SignInPage } from '../SignInPage';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const renderPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <SignInPage />
      </MemoryRouter>
    </Provider>,
  );

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
    expect(vi.mocked(requestJson)).not.toHaveBeenCalled();
  });
});
