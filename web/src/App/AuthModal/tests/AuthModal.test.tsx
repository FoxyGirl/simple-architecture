import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthModal } from '../AuthModal';

const renderModal = () =>
  render(<AuthModal onSignedIn={vi.fn()} onClose={vi.fn()} />);

afterEach(() => {
  cleanup();
});

describe('AuthModal', () => {
  it('is a labelled modal dialog with a focused single email field', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Sign in' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('shows the inline error and keeps the dialog open on an invalid submit', () => {
    const onClose = vi.fn();
    render(<AuthModal onSignedIn={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid email address.',
    );
    expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('dismisses through the close control, Escape and the backdrop', () => {
    const onClose = vi.fn();
    render(<AuthModal onSignedIn={vi.fn()} onClose={onClose} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Close sign-in dialog' }),
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByTestId('auth-modal-backdrop'));

    // A click inside the panel never dismisses the dialog.
    fireEvent.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
