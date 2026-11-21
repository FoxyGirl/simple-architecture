import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import type { ChangeEvent } from 'react';

import { useShowsSearchField } from '../logic/useShowsSearchField';

// Mirrors DEBOUNCE_MS in the presenter hook.
export const DEBOUNCE_MS = 800;

export const renderField = (over = {}) => {
  const props = {
    search: '',
    onDraftChange: vi.fn(),
    applySearch: vi.fn(),
    abortSearch: vi.fn(),
    ...over,
  };
  const view = renderHook((current) => useShowsSearchField(current), {
    initialProps: props,
  });
  return { props, ...view };
};

export const typeQuery = (
  handleSearch: (event: ChangeEvent<HTMLInputElement>) => void,
  value: string,
) => {
  act(() => {
    handleSearch({ target: { value } } as ChangeEvent<HTMLInputElement>);
  });
};

export const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
