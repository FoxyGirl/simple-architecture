import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  advance,
  DEBOUNCE_MS,
  renderDraft,
  typeQuery,
} from './searchDraftHelpers';

describe('useSearchDraft', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the pending draft right away and fires one debounced URL write once typing settles', async () => {
    const { result, props } = renderDraft();

    typeQuery(result.current.onQueryChange, 'off');
    expect(result.current.draft).toBe('off');
    await advance(DEBOUNCE_MS - 1);
    expect(props.applySearch).not.toHaveBeenCalled();

    typeQuery(result.current.onQueryChange, 'office');
    await advance(DEBOUNCE_MS);

    expect(props.applySearch).toHaveBeenCalledTimes(1);
    expect(props.applySearch).toHaveBeenCalledWith('office');
    expect(result.current.draft).toBe('office');
  });

  it('keeps the in-flight request while the draft changes and aborts on unmount', async () => {
    const { result, props, unmount } = renderDraft();

    typeQuery(result.current.onQueryChange, 'office');
    await advance(DEBOUNCE_MS);
    expect(props.abortSearch).not.toHaveBeenCalled();

    // The applied run stays the truth a restoration returns to; a committed
    // draft supersedes it through the Task, never through an abort here.
    typeQuery(result.current.onQueryChange, 'friends');
    expect(props.abortSearch).not.toHaveBeenCalled();

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).toHaveBeenCalledTimes(2);
    expect(props.applySearch).toHaveBeenLastCalledWith('friends');

    unmount();
    expect(props.abortSearch).toHaveBeenCalledTimes(1);
  });

  it('does not re-write a draft that equals the applied search', async () => {
    const { result, props } = renderDraft({ search: 'office' });

    typeQuery(result.current.onQueryChange, 'office ');
    expect(result.current.draft).toBeNull();
    await advance(DEBOUNCE_MS);

    expect(props.applySearch).not.toHaveBeenCalled();
  });

  it('re-syncs the input from an external URL change without aborting its fetch', async () => {
    const { result, props, rerender } = renderDraft();

    typeQuery(result.current.onQueryChange, 'friends');
    rerender({ ...props, search: 'office' });

    expect(result.current.query).toBe('office');
    expect(result.current.draft).toBeNull();
    expect(props.abortSearch).not.toHaveBeenCalled();
    await advance(DEBOUNCE_MS);
    expect(props.applySearch).not.toHaveBeenCalled();
  });

  it('clearing reports the empty draft now and removes the parameter after the debounce', async () => {
    const { result, props } = renderDraft({ search: 'office' });

    await act(async () => {
      result.current.clearQuery();
    });

    expect(result.current.query).toBe('');
    expect(result.current.draft).toBe('');
    expect(props.abortSearch).toHaveBeenCalled();

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).toHaveBeenCalledWith('');
  });
});
