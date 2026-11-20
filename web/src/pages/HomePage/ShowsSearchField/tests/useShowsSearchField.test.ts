import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChangeEvent } from 'react';

import { STATUS } from '../../constants';
import { useShowsSearchField } from '../logic/useShowsSearchField';

// Mirrors DEBOUNCE_MS in the presenter hook.
const DEBOUNCE_MS = 800;
const renderField = (over = {}) => {
  const props = {
    search: '',
    onSearchChange: vi.fn(),
    registerControls: vi.fn(),
    applySearch: vi.fn(),
    abortSearch: vi.fn(),
    ...over,
  };
  const view = renderHook((current) => useShowsSearchField(current), {
    initialProps: props,
  });
  return { props, ...view };
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
  it('fires exactly one debounced URL write once typing settles', async () => {
    const { result, props } = renderField();

    typeQuery(result.current.handleSearch, 'off');
    await advance(DEBOUNCE_MS - 1);
    expect(props.applySearch).not.toHaveBeenCalled();

    typeQuery(result.current.handleSearch, 'office');
    await advance(DEBOUNCE_MS);

    expect(props.applySearch).toHaveBeenCalledTimes(1);
    expect(props.applySearch).toHaveBeenCalledWith('office');
    expect(props.onSearchChange).toHaveBeenLastCalledWith({
      status: STATUS.LOADING,
      queryEcho: 'office',
    });
  });

  it('aborts the in-flight request when the draft changes', async () => {
    const { result, props } = renderField();

    typeQuery(result.current.handleSearch, 'office');
    await advance(DEBOUNCE_MS);
    expect(props.abortSearch).not.toHaveBeenCalled();

    typeQuery(result.current.handleSearch, 'friends');
    expect(props.abortSearch).toHaveBeenCalledTimes(1);

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).toHaveBeenCalledTimes(2);
    expect(props.applySearch).toHaveBeenLastCalledWith('friends');
  });

  it('does not re-write a draft that equals the applied search', async () => {
    const { result, props } = renderField({ search: 'office' });

    typeQuery(result.current.handleSearch, 'office ');
    await advance(DEBOUNCE_MS);

    expect(props.applySearch).not.toHaveBeenCalled();
  });

  it('re-syncs the input from an external URL change', async () => {
    const { result, props, rerender } = renderField();

    typeQuery(result.current.handleSearch, 'friends');
    rerender({ ...props, search: 'office' });

    expect(result.current.query).toBe('office');
    await advance(DEBOUNCE_MS);
    expect(props.applySearch).not.toHaveBeenCalled();
    expect(props.abortSearch).toHaveBeenCalled();
  });

  it('clearing reports idle now and removes the parameter after the debounce', async () => {
    const { result, props } = renderField({ search: 'office' });

    await act(async () => {
      result.current.clearQuery();
    });

    expect(result.current.query).toBe('');
    expect(props.abortSearch).toHaveBeenCalled();
    expect(props.onSearchChange).toHaveBeenLastCalledWith({
      status: STATUS.IDLE,
      queryEcho: '',
    });

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).toHaveBeenCalledWith('');

    const registered = props.registerControls.mock.calls.at(-1)?.[0];
    expect(registered).toEqual({ clearSearch: expect.any(Function) });
  });
});
