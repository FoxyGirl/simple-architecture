import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it } from 'vitest';

import { clearSession, replaceSession, store } from '~/store';

import { useShowList } from '../logic/useShowList';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

const renderStoredList = () =>
  renderHook(() => useShowList({ shows: [] }), { wrapper });

const renderInjectedList = () =>
  renderHook(
    () =>
      useShowList({
        shows: [],
        isFavorite: () => true,
        onToggleFavorite: () => {},
      }),
    { wrapper },
  );

describe('useShowList session gate', () => {
  beforeEach(() => {
    store.dispatch(clearSession());
  });

  it('allows the stored favorites path while signed in', () => {
    store.dispatch(replaceSession({ email: 'ada@example.com' }));

    expect(renderStoredList().result.current.canFavorite).toBe(true);
  });

  it('hides the stored favorites path while signed out', () => {
    expect(renderStoredList().result.current.canFavorite).toBe(false);
  });

  it('hides the injected favorites path while signed out', () => {
    expect(renderInjectedList().result.current.canFavorite).toBe(false);
  });
});
