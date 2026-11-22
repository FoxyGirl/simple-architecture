import { Tv } from 'lucide-react';

import { useAccountBar } from './logic/useAccountBar';

import styles from './AccountBar.module.css';

export const AccountBar = () => {
  const { account, goToSignIn, onLogout } = useAccountBar();

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

            <button type="button" className={styles.action} onClick={onLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button type="button" className={styles.action} onClick={goToSignIn}>
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};
