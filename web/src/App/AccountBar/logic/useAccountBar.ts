import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { notify } from '~/notification';
import { selectSessionEmail } from '~/store';

import type { AccountBarAccount } from '../types';

import { logout } from './tasks/logout';

/**
 * The account-bar presenter: it reads the signed-in email from the session
 * Entity and prepares the account the View renders. The Sign in action
 * navigates to the dedicated Sign In page; Logout runs the logout Task and
 * reports a failure as a toast — the Task itself never translates its
 * outcome.
 */
export const useAccountBar = () => {
  const email = useSelector(selectSessionEmail);
  const navigate = useNavigate();

  const goToSignIn = () => navigate('/login');

  const onLogout = async () => {
    const result = await logout();

    if (result.status === 'error') notify.error(result.message);
  };

  const account: AccountBarAccount =
    email === null ? { kind: 'guest' } : { kind: 'user', email };

  return { account, goToSignIn, onLogout };
};
