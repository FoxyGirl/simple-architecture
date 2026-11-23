import { ArrowLeft, LogIn, LogOut, Tv } from 'lucide-react';

import { Button } from '~/ui-kit/Button';

import { useAccountBar } from './logic/useAccountBar';

import styles from './AccountBar.module.css';

export const AccountBar = () => {
  const { account, isSignInPage, goToSignIn, goToHome, onLogout } =
    useAccountBar();

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <span className={styles.brand}>
          <Tv className={styles.brandIcon} size={18} aria-hidden="true" />
          ScreenScout
        </span>

        {account.kind === 'user' ? (
          <div className={styles.account}>
            <span className={styles.email}>{account.email}</span>

            <Button
              type="button"
              label="Logout"
              icon={<LogOut size={13} />}
              onClick={onLogout}
            />
          </div>
        ) : isSignInPage ? (
          <Button
            type="button"
            label="Back to Home"
            icon={<ArrowLeft size={13} />}
            onClick={goToHome}
          />
        ) : (
          <Button
            type="button"
            label="Sign in"
            icon={<LogIn size={13} />}
            onClick={goToSignIn}
          />
        )}
      </div>
    </header>
  );
};
