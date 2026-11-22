import { ArrowLeft } from 'lucide-react';

import { useSignInPage } from './logic/useSignInPage';

import styles from './SignInPage.module.css';

const TITLE_ID = 'sign-in-title';
const EMAIL_ID = 'sign-in-email';
const ERROR_ID = 'sign-in-error';

export const SignInPage = () => {
  const {
    email,
    isSubmitting,
    errorMessage,
    inputRef,
    onEmailChange,
    onSubmit,
    onCancel,
  } = useSignInPage();

  return (
    <section className={styles.page} aria-labelledby={TITLE_ID}>
      <header className={styles.head}>
        <button type="button" className={styles.back} onClick={onCancel}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Home
        </button>

        <h1 id={TITLE_ID} className={styles.title}>
          Sign in
        </h1>

        <p className={styles.description}>
          Sign in is required to save favorites. Your list is tied to your
          email, so it is waiting for you the next time you sign in.
        </p>
      </header>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <label className={styles.label} htmlFor={EMAIL_ID}>
          Email
        </label>

        <input
          id={EMAIL_ID}
          ref={inputRef}
          className={styles.input}
          type="email"
          value={email}
          onChange={onEmailChange}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={errorMessage !== null}
          aria-describedby={errorMessage !== null ? ERROR_ID : undefined}
        />

        {errorMessage !== null ? (
          <p id={ERROR_ID} className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </section>
  );
};
