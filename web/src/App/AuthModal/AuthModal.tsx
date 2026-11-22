import { X } from 'lucide-react';

import { AUTH_MODAL_MESSAGES } from './constants';
import { useAuthModal } from './logic/useAuthModal';
import type { AuthModalProps } from './types';

import styles from './AuthModal.module.css';

const TITLE_ID = 'auth-modal-title';
const EMAIL_ID = 'auth-modal-email';
const ERROR_ID = 'auth-modal-error';

export const AuthModal = (props: AuthModalProps) => {
  const {
    email,
    isSubmitting,
    errorMessage,
    inputRef,
    onEmailChange,
    onSubmit,
    onBackdropClick,
    onKeyDown,
    onDismiss,
  } = useAuthModal(props);

  return (
    <div
      className={styles.backdrop}
      data-testid="auth-modal-backdrop"
      onClick={onBackdropClick}
      onKeyDown={onKeyDown}
    >
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
      >
        <div className={styles.head}>
          <h2 id={TITLE_ID} className={styles.title}>
            {AUTH_MODAL_MESSAGES.TITLE}
          </h2>

          <button
            type="button"
            className={styles.close}
            aria-label={AUTH_MODAL_MESSAGES.CLOSE}
            onClick={onDismiss}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <p className={styles.description}>{AUTH_MODAL_MESSAGES.DESCRIPTION}</p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.label} htmlFor={EMAIL_ID}>
            {AUTH_MODAL_MESSAGES.EMAIL_LABEL}
          </label>

          <input
            id={EMAIL_ID}
            ref={inputRef}
            className={styles.input}
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder={AUTH_MODAL_MESSAGES.PLACEHOLDER}
            autoComplete="email"
            aria-invalid={errorMessage !== null}
            aria-describedby={errorMessage !== null ? ERROR_ID : undefined}
          />

          {errorMessage !== null ? (
            <p id={ERROR_ID} className={styles.error} role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? AUTH_MODAL_MESSAGES.SUBMITTING
              : AUTH_MODAL_MESSAGES.SUBMIT}
          </button>
        </form>
      </section>
    </div>
  );
};
