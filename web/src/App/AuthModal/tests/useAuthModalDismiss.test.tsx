import { act, cleanup, renderHook } from '@testing-library/react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthModal } from '../logic/useAuthModal';

const renderModal = (onClose = vi.fn()) =>
  renderHook(() => useAuthModal({ onSignedIn: vi.fn(), onClose }));

describe('useAuthModal dismiss paths', () => {
  afterEach(() => {
    cleanup();
  });

  it('dismisses through the close control, Escape and the backdrop only', () => {
    const onClose = vi.fn();
    const { result } = renderModal(onClose);
    const backdrop = document.createElement('div');
    const panel = document.createElement('div');

    act(() => result.current.onDismiss());
    act(() =>
      result.current.onKeyDown({
        key: 'Escape',
      } as KeyboardEvent<HTMLDivElement>),
    );
    act(() =>
      result.current.onKeyDown({
        key: 'Enter',
      } as KeyboardEvent<HTMLDivElement>),
    );
    act(() =>
      result.current.onBackdropClick({
        target: backdrop,
        currentTarget: backdrop,
      } as unknown as MouseEvent<HTMLDivElement>),
    );
    act(() =>
      result.current.onBackdropClick({
        target: panel,
        currentTarget: backdrop,
      } as unknown as MouseEvent<HTMLDivElement>),
    );

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
