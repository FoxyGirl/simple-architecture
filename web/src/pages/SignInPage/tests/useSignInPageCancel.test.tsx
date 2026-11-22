import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSignInPage } from '../logic/useSignInPage';

const navigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

describe('useSignInPage cancel path', () => {
  afterEach(() => {
    cleanup();
    navigate.mockReset();
  });

  it('navigates home without starting a session', () => {
    const { result } = renderHook(() => useSignInPage());

    act(() => result.current.onCancel());

    expect(navigate).toHaveBeenCalledWith('/');
  });
});
