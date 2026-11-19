import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChangeEvent } from 'react';

import { STATUS } from '../../constants';
import { useShowsSearchField } from '../logic/useShowsSearchField';

// Mirrors DEBOUNCE_MS in the presenter hook.
const DEBOUNCE_MS = 800;

const renderField = (over = {}) => {
  const props = {
    onSearchChange: vi.fn(),
    registerControls: vi.fn(),
    submitSearch: vi.fn(),
    isCurrentQuery: vi.fn((): boolean => false),
    abortSearch: vi.fn(),
    ...over,
  };
  const { result } = renderHook(() => useShowsSearchField(props));
  return { props, result };
};

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

describe('useShowsSearchField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires exactly one debounced submission once typing settles', async () => {
    const { result, props } = renderField();

    typeQuery(result.current.handleSearch, 'off');
    await advance(DEBOUNCE_MS - 1);
    expect(props.submitSearch).not.toHaveBeenCalled();

    typeQuery(result.current.handleSearch, 'office');
    await advance(DEBOUNCE_MS);

    expect(props.submitSearch).toHaveBeenCalledTimes(1);
    expect(props.submitSearch).toHaveBeenCalledWith('office');
  });

  it('aborts the in-flight request when the query changes', async () => {
    const { result, props } = renderField();

    typeQuery(result.current.handleSearch, 'office');
    await advance(DEBOUNCE_MS);
    expect(props.abortSearch).not.toHaveBeenCalled();

    typeQuery(result.current.handleSearch, 'friends');
    expect(props.abortSearch).toHaveBeenCalledTimes(1);

    await advance(DEBOUNCE_MS);
    expect(props.submitSearch).toHaveBeenCalledTimes(2);
    expect(props.submitSearch).toHaveBeenLastCalledWith('friends');
  });

  it('keeps the current results when the query equals the active one', async () => {
    const searched = new Set<string>();
    const { result, props } = renderField({
      submitSearch: vi.fn((query: string) => void searched.add(query)),
      isCurrentQuery: vi.fn((query: string) => searched.has(query)),
    });

    typeQuery(result.current.handleSearch, 'office');
    await advance(DEBOUNCE_MS);

    // Re-typing the same query (here with trailing whitespace) is echoed,
    // not re-requested.
    typeQuery(result.current.handleSearch, 'office ');
    await advance(DEBOUNCE_MS);

    expect(props.submitSearch).toHaveBeenCalledTimes(1);
    expect(props.onSearchChange).toHaveBeenLastCalledWith({
      status: STATUS.SUCCESS,
      queryEcho: 'office',
    });
  });

  it('clearing the query aborts and reports idle, registered with the page', async () => {
    const { result, props } = renderField();

    typeQuery(result.current.handleSearch, 'office');
    await advance(DEBOUNCE_MS);

    await act(async () => {
      result.current.clearQuery();
    });

    expect(props.abortSearch).toHaveBeenCalled();
    expect(result.current.query).toBe('');
    expect(props.onSearchChange).toHaveBeenLastCalledWith({
      status: STATUS.IDLE,
      queryEcho: '',
    });

    const registered = props.registerControls.mock.calls.at(-1)?.[0];
    expect(registered).toEqual({ clearSearch: expect.any(Function) });
  });
});
