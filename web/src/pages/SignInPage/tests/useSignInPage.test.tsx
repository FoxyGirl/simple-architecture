import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/api/errors';
import { requestJson } from '~/api/request';
import { stubApi } from '~/test/api-mock';

import { useSignInPage } from '../logic/useSignInPage';
import { change, navigate, resetRouter, route, submit } from './signInHarness';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useLocation: () => route,
    useNavigate: () => navigate,
  };
});

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const renderPage = () => renderHook(() => useSignInPage());

describe('useSignInPage', () => {
  beforeEach(() => {
    api.mockReset();
    resetRouter();
  });

  afterEach(() => {
    cleanup();
  });

  it('starts with an empty draft, not submitting and no error', () => {
    const { result } = renderPage();

    expect(result.current.email).toBe('');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it('rejects an empty or non-email value without a request or navigation', async () => {
    const { result } = renderPage();

    await act(async () => {
      await result.current.onSubmit(submit());
    });

    expect(result.current.errorMessage).toBe('Enter a valid email address.');
    expect(api).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    act(() => result.current.onEmailChange(change('not-an-email')));
    await act(async () => {
      await result.current.onSubmit(submit());
    });

    expect(result.current.errorMessage).toBe('Enter a valid email address.');
    expect(api).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps the page and shows the backend message after a rejected login', async () => {
    stubApi(api, {
      login: () => {
        throw new ApiError('Request body must carry a valid "email"', 400);
      },
    });
    const { result } = renderPage();

    act(() => result.current.onEmailChange(change('ada@example.com')));
    await act(async () => {
      await result.current.onSubmit(submit());
    });

    expect(result.current.errorMessage).toBe(
      'Request body must carry a valid "email"',
    );
    expect(result.current.isSubmitting).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
