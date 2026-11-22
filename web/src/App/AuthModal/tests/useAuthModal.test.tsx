import { act, cleanup, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/api/errors';
import { requestJson } from '~/api/request';
import { stubApi } from '~/test/api-mock';

import { useAuthModal } from '../logic/useAuthModal';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const change = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

const submit = () =>
  ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>;

const renderModal = (onSignedIn = vi.fn(), onClose = vi.fn()) =>
  renderHook(() => useAuthModal({ onSignedIn, onClose }));

describe('useAuthModal', () => {
  beforeEach(() => {
    api.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('starts with an empty draft, not submitting and no error', () => {
    const { result } = renderModal();

    expect(result.current.email).toBe('');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it('rejects an empty or non-email value without a request', async () => {
    const onSignedIn = vi.fn();
    const onClose = vi.fn();
    const { result } = renderModal(onSignedIn, onClose);

    await act(async () => {
      await result.current.onSubmit(submit());
    });

    expect(result.current.errorMessage).toBe('Enter a valid email address.');
    expect(api).not.toHaveBeenCalled();

    act(() => result.current.onEmailChange(change('not-an-email')));

    await act(async () => {
      await result.current.onSubmit(submit());
    });

    expect(result.current.errorMessage).toBe('Enter a valid email address.');
    expect(api).not.toHaveBeenCalled();
    expect(onSignedIn).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('exposes the submitting flag while the sign-in is in flight', async () => {
    let resolveLogin: (session: { email: string }) => void = () => {};
    stubApi(api, {
      login: () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    });
    const onSignedIn = vi.fn();
    const { result } = renderModal(onSignedIn);

    act(() => result.current.onEmailChange(change('ada@example.com')));

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.onSubmit(submit());
    });

    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveLogin({ email: 'ada@example.com' });
      await pending;
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(onSignedIn).toHaveBeenCalledOnce();
  });

  it('renders the backend message and stays open after a rejected login', async () => {
    stubApi(api, {
      login: () => {
        throw new ApiError('Request body must carry a valid "email"', 400);
      },
    });
    const onSignedIn = vi.fn();
    const { result } = renderModal(onSignedIn);

    act(() => result.current.onEmailChange(change('ada@example.com')));

    await act(async () => {
      await result.current.onSubmit(submit());
    });

    expect(result.current.errorMessage).toBe(
      'Request body must carry a valid "email"',
    );
    expect(result.current.isSubmitting).toBe(false);
    expect(onSignedIn).not.toHaveBeenCalled();
  });
});
