import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { advance, DEBOUNCE_MS, renderField, typeQuery } from './helpers';

describe('useShowsSearchField draft restoration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('drops the pending draft when it returns to the applied search', async () => {
    const { result, props } = renderField({ search: 'office' });

    typeQuery(result.current.handleSearch, 'officex');
    expect(props.onDraftChange).toHaveBeenLastCalledWith('officex');

    // The draft matches the applied search again: no pending draft, no
    // debounced write — the page shows the results the URL describes.
    typeQuery(result.current.handleSearch, 'office');
    expect(props.onDraftChange).toHaveBeenLastCalledWith(null);

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).not.toHaveBeenCalled();
  });

  it('drops the pending draft when it is cleared back to an empty search', async () => {
    const { result, props } = renderField();

    typeQuery(result.current.handleSearch, 'office');
    expect(props.onDraftChange).toHaveBeenLastCalledWith('office');

    typeQuery(result.current.handleSearch, '');
    expect(props.onDraftChange).toHaveBeenLastCalledWith(null);

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).not.toHaveBeenCalled();
  });
});
