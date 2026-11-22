import { Tv } from 'lucide-react';

import { ACCOUNT_BAR_LABELS } from './constants';
import { useAccountBar } from './logic/useAccountBar';
import type { AccountBarProps } from './types';

import styles from './AccountBar.module.css';

export const AccountBar = (props: AccountBarProps) => {
  const { account, onSignIn, onLogout } = useAccountBar(props);

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <span className={styles.brand}>
          <Tv className={styles.brandIcon} size={18} aria-hidden="true" />
          {ACCOUNT_BAR_LABELS.BRAND}
        </span>

        {account.kind === 'user' ? (
          <div className={styles.account}>
            <span className={styles.email}>{account.email}</span>

            <button type="button" className={styles.action} onClick={onLogout}>
              {ACCOUNT_BAR_LABELS.LOGOUT}
            </button>
          </div>
        ) : (
          <button type="button" className={styles.action} onClick={onSignIn}>
            {ACCOUNT_BAR_LABELS.SIGN_IN}
          </button>
        )}
      </div>
    </header>
  );
};
