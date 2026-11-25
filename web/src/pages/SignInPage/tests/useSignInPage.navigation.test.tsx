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

type Presenter = ReturnType<typeof useSignInPage>;

const submitEmail = async (result: { current: Presenter }, email: string) => {
  act(() => result.current.onEmailChange(change(email)));
  await act(async () => {
    await result.current.onSubmit(submit());
  });
};

describe('useSignInPage navigation', () => {
  beforeEach(() => {
    api.mockReset();
    resetRouter();
  });

  afterEach(cleanup);

  it('navigates home on a successful sign-in with no carried URL', async () => {
    stubApi(api, { login: () => ({ email: 'ada@example.com' }) });
    const { result } = renderPage();

    await submitEmail(result, 'ada@example.com');

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('navigates to the carried Home URL on success', async () => {
    route.state = { fromHome: '/?search=world&genre=Drama&page=2' };
    stubApi(api, { login: () => ({ email: 'ada@example.com' }) });
    const { result } = renderPage();

    await submitEmail(result, 'ada@example.com');

    expect(navigate).toHaveBeenCalledWith('/?search=world&genre=Drama&page=2');
  });

  it('keeps the carried URL through an invalid submit and a rejected login', async () => {
    route.state = { fromHome: '/?search=world&page=2' };
    stubApi(api, {
      login: () => {
        throw new ApiError('Rejected', 400);
      },
    });
    const { result } = renderPage();

    await act(async () => {
      await result.current.onSubmit(submit());
    });
    expect(result.current.errorMessage).toBe('Enter a valid email address.');
    expect(api).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    await submitEmail(result, 'ada@example.com');
    expect(result.current.errorMessage).toBe('Rejected');
    expect(navigate).not.toHaveBeenCalled();

    stubApi(api, { login: () => ({ email: 'ada@example.com' }) });
    await act(async () => {
      await result.current.onSubmit(submit());
    });
    expect(navigate).toHaveBeenCalledWith('/?search=world&page=2');
  });
});
