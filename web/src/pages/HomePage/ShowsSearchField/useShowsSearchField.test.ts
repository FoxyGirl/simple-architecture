import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChangeEvent } from 'react';

import type { Show } from '@api/types';
import { searchShows } from '@api/shows';

import { useShowsSearchField } from './useShowsSearchField';

vi.mock('@api/shows', () => ({ searchShows: vi.fn() }));

// Mirrors DEBOUNCE_MS in the presenter hook.
const DEBOUNCE_MS = 800;

const typeQuery = (
  handleSearch: (event: ChangeEvent<HTMLInputElement>) => void,
  value: string,
) => {
  act(() => {
    handleSearch({ target: { value } } as ChangeEvent<HTMLInputElement>);
  });
};

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const renderField = () =>
  renderHook(() =>
    useShowsSearchField({
      onSearchChange: vi.fn(),
      registerControls: vi.fn(),
    }),
  );

describe('useShowsSearchField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(searchShows).mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires exactly one debounced request once typing settles', async () => {
    const { result } = renderField();

    typeQuery(result.current.handleSearch, 'off');
    await advance(DEBOUNCE_MS - 1);
    expect(searchShows).not.toHaveBeenCalled();

    typeQuery(result.current.handleSearch, 'office');
    await advance(DEBOUNCE_MS);

    expect(searchShows).toHaveBeenCalledTimes(1);
    expect(searchShows).toHaveBeenCalledWith('office', {
      signal: expect.any(AbortSignal),
    });
  });

  it('aborts the in-flight request when the query changes', async () => {
    const signals: AbortSignal[] = [];
    vi.mocked(searchShows).mockImplementation((_query, options) => {
      if (options?.signal) signals.push(options.signal);
      // Pending forever, like a real in-flight fetch.
      return new Promise<Show[]>(() => undefined);
    });

    const { result } = renderField();

    typeQuery(result.current.handleSearch, 'office');
    await advance(DEBOUNCE_MS);
    expect(signals).toHaveLength(1);
    expect(signals[0]?.aborted).toBe(false);

    typeQuery(result.current.handleSearch, 'friends');
    expect(signals[0]?.aborted).toBe(true);

    await advance(DEBOUNCE_MS);
    expect(signals).toHaveLength(2);
    expect(signals[1]?.aborted).toBe(false);
    expect(vi.mocked(searchShows).mock.calls[1]?.[0]).toBe('friends');
  });
});
