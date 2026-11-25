import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it } from 'vitest';

import { replaceSearchResult, store } from '~/store';
import type { SearchPage, Show } from '~/types';

import { STATUS, type SearchStatus } from '../../constants';
import type { LoadingScope } from '../../types';

import { useShowSearchResults } from '../logic/useShowSearchResults';

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

const storedPage: SearchPage = {
  shows: [show(1, 'Show One')],
  page: 2,
  pageCount: 3,
  totalCount: 7,
  genres: ['Comedy', 'Drama'],
};

const emptyPage: SearchPage = { ...storedPage, shows: [], totalCount: 0 };

const render = (
  page: SearchPage,
  status: SearchStatus,
  loadingScope: LoadingScope | null,
) => {
  store.dispatch(replaceSearchResult(page));

  return renderHook(() => useShowSearchResults({ status, loadingScope }), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
};

describe('useShowSearchResults', () => {
  beforeEach(() => {
    store.dispatch(replaceSearchResult(storedPage));
  });

  it('exposes the stored page as frame data on success', () => {
    const { result } = render(storedPage, STATUS.SUCCESS, null);

    expect(result.current.frameData).toEqual(storedPage);
    expect(result.current.isEmptyResponse).toBe(false);
  });

  it('reports an empty success without frame data', () => {
    const { result } = render(emptyPage, STATUS.SUCCESS, null);

    expect(result.current.frameData).toBeNull();
    expect(result.current.isEmptyResponse).toBe(true);
  });

  it('keeps the frame during a cards-scoped selection load', () => {
    const { result } = render(storedPage, STATUS.LOADING, 'cards');

    expect(result.current.frameData).toEqual(storedPage);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSelectionLoad).toBe(true);
  });

  it('invalidates the whole block during a full load', () => {
    const { result } = render(storedPage, STATUS.LOADING, 'full');

    expect(result.current.frameData).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSelectionLoad).toBe(false);
  });

  it('reports an error without frame data', () => {
    const { result } = render(storedPage, STATUS.ERROR, null);

    expect(result.current.frameData).toBeNull();
    expect(result.current.isError).toBe(true);
  });

  it('reports the idle state without frame data', () => {
    const { result } = render(storedPage, STATUS.IDLE, null);

    expect(result.current.frameData).toBeNull();
    expect(result.current.isIdle).toBe(true);
  });
});
