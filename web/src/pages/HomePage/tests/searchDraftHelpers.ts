import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import type { ChangeEvent } from 'react';

import { useSearchDraft } from '../logic/useSearchDraft';

// Mirrors DEBOUNCE_MS in the draft hook.
export const DEBOUNCE_MS = 800;

export type DraftParams = {
  search: string;
  applySearch: (query: string) => void;
  abortSearch: () => void;
};

export const draftProps = (over: Partial<DraftParams> = {}): DraftParams => ({
  search: '',
  applySearch: vi.fn(),
  abortSearch: vi.fn(),
  ...over,
});

export const renderDraft = (over: Partial<DraftParams> = {}) => {
  const props = draftProps(over);
  const view = renderHook((current: DraftParams) => useSearchDraft(current), {
    initialProps: props,
  });
  return { props, ...view };
};

export const typeQuery = (
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void,
  value: string,
) => {
  act(() => {
    onQueryChange({ target: { value } } as ChangeEvent<HTMLInputElement>);
  });
};

export const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
