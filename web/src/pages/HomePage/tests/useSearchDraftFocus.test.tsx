import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSearchDraft } from '../logic/useSearchDraft';
import { draftProps, type DraftParams } from './searchDraftHelpers';

// A minimal consumer attaching the ref the hook owns, so the focus side
// effects can be observed on a real input.
const FieldProbe = (props: DraftParams) => {
  const { query, inputRef, onQueryChange, clearQuery } = useSearchDraft(props);

  return (
    <div>
      <input
        ref={inputRef}
        value={query}
        onChange={onQueryChange}
        aria-label="probe"
      />
      <button type="button" onClick={clearQuery}>
        clear
      </button>
    </div>
  );
};

describe('useSearchDraft focus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('returns focus to the input when an external change empties the search', () => {
    const props = draftProps({ search: 'office' });
    const { rerender } = render(<FieldProbe {...props} />);
    const input = screen.getByRole('textbox', { name: 'probe' });
    input.blur();

    rerender(<FieldProbe {...props} search="" />);

    expect(input).toHaveFocus();
  });

  it('clearing through the field aborts, empties the input and refocuses it', async () => {
    const props = draftProps({ search: 'office' });
    render(<FieldProbe {...props} />);
    const input = screen.getByRole('textbox', { name: 'probe' });
    input.blur();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    });

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(props.abortSearch).toHaveBeenCalledTimes(1);
  });
});
