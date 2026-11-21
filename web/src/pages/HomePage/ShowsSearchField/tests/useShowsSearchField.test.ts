import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { advance, DEBOUNCE_MS, renderField, typeQuery } from './helpers';

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
    expect(props.onDraftChange).toHaveBeenLastCalledWith('office');
  });

  it('keeps the in-flight request while the draft changes and aborts on unmount', async () => {
    const { result, props, unmount } = renderField();

    typeQuery(result.current.handleSearch, 'office');
    await advance(DEBOUNCE_MS);
    expect(props.abortSearch).not.toHaveBeenCalled();

    // The applied run stays the truth a restoration returns to; a committed
    // draft supersedes it through the Task, never through the field.
    typeQuery(result.current.handleSearch, 'friends');
    expect(props.abortSearch).not.toHaveBeenCalled();

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).toHaveBeenCalledTimes(2);
    expect(props.applySearch).toHaveBeenLastCalledWith('friends');

    unmount();
    expect(props.abortSearch).toHaveBeenCalledTimes(1);
  });

  it('does not re-write a draft that equals the applied search', async () => {
    const { result, props } = renderField({ search: 'office' });

    typeQuery(result.current.handleSearch, 'office ');
    await advance(DEBOUNCE_MS);

    expect(props.applySearch).not.toHaveBeenCalled();
  });

  it('re-syncs the input from an external URL change without aborting its fetch', async () => {
    const { result, props, rerender } = renderField();

    typeQuery(result.current.handleSearch, 'friends');
    rerender({ ...props, search: 'office' });

    expect(result.current.query).toBe('office');
    expect(props.onDraftChange).toHaveBeenLastCalledWith(null);
    expect(props.abortSearch).not.toHaveBeenCalled();
    await advance(DEBOUNCE_MS);
    expect(props.applySearch).not.toHaveBeenCalled();
  });

  it('clearing reports the empty draft now and removes the parameter after the debounce', async () => {
    const { result, props } = renderField({ search: 'office' });

    await act(async () => {
      result.current.clearQuery();
    });

    expect(result.current.query).toBe('');
    expect(props.abortSearch).toHaveBeenCalled();
    expect(props.onDraftChange).toHaveBeenLastCalledWith('');

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).toHaveBeenCalledWith('');
  });
});
