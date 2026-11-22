import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent, MouseEvent } from 'react';

import { AUTH_MODAL_MESSAGES } from '../constants';
import { isEmail } from '../utils';
import type { AuthModalProps } from '../types';

import { signIn } from './tasks/signIn';

/**
 * The sign-in modal presenter: it owns the email draft, the submitting flag
 * and the inline error, validating the address locally before invoking the
 * sign-in Task so an invalid submit sends no request. A success reports
 * through `onSignedIn`; a rejected login keeps the modal open with the
 * backend message. Every dismiss path (close control, Escape, backdrop click)
 * reports through `onClose` and changes no session state. The email field
 * receives focus on open, following the `useSearchDraft` ref precedent.
 */
export const useAuthModal = ({ onSignedIn, onClose }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = email.trim();

    if (!isEmail(trimmed)) {
      setErrorMessage(AUTH_MODAL_MESSAGES.INVALID_EMAIL);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signIn(trimmed);

    if (result.status === 'success') {
      setIsSubmitting(false);
      onSignedIn();
      return;
    }

    setErrorMessage(result.message);
    setIsSubmitting(false);
  };

  const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClose();
  };

  return {
    email,
    isSubmitting,
    errorMessage,
    inputRef,
    onEmailChange,
    onSubmit,
    onBackdropClick,
    onKeyDown,
    onDismiss: onClose,
  };
};
