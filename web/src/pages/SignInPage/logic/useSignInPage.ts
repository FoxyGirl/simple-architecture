import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { readFromHome } from '~/pages/utils';

import { isEmail } from '../utils';

import { signIn } from './tasks/signIn';

/**
 * The Sign In page presenter: it owns the email draft, the submitting flag
 * and the inline error, validating the address locally before invoking the
 * sign-in Task so an invalid submit sends no request. A success navigates to
 * the HomePage URL carried from the entry point, or to the bare Home when
 * none was carried; a rejected login keeps the page with the backend message.
 * The email field receives focus on mount, following the `useSearchDraft` ref
 * precedent.
 */
export const useSignInPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fromHome = readFromHome(location.state);

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
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signIn(trimmed);

    setIsSubmitting(false);

    if (result.status === 'success') {
      navigate(fromHome ?? '/');
      return;
    }

    setErrorMessage(result.message);
  };

  return {
    email,
    isSubmitting,
    errorMessage,
    inputRef,
    onEmailChange,
    onSubmit,
  };
};
