import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  advance,
  DEBOUNCE_MS,
  renderDraft,
  typeQuery,
} from './searchDraftHelpers';

describe('useSearchDraft draft restoration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('drops the pending draft when it returns to the applied search', async () => {
    const { result, props } = renderDraft({ search: 'office' });

    typeQuery(result.current.onQueryChange, 'officex');
    expect(result.current.draft).toBe('officex');

    // The draft matches the applied search again: no pending draft, no
    // debounced write — the page shows the results the URL describes.
    typeQuery(result.current.onQueryChange, 'office');
    expect(result.current.draft).toBeNull();

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).not.toHaveBeenCalled();
  });

  it('drops the pending draft when it is cleared back to an empty search', async () => {
    const { result, props } = renderDraft();

    typeQuery(result.current.onQueryChange, 'office');
    expect(result.current.draft).toBe('office');

    typeQuery(result.current.onQueryChange, '');
    expect(result.current.draft).toBeNull();

    await advance(DEBOUNCE_MS);
    expect(props.applySearch).not.toHaveBeenCalled();
  });
});
