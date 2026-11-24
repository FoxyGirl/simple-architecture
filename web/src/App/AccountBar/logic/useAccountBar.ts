import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { notify } from '~/notification';
import type { SignInLocationState } from '~/pages/types';
import { readFromHome } from '~/pages/utils';
import { selectSessionEmail } from '~/store';

import type { AccountBarAccount } from '../types';

import { logout } from './tasks/logout';

/**
 * The account-bar presenter: it reads the signed-in email from the session
 * Entity and the current route, then prepares the account the View renders.
 * The Sign in action navigates to the dedicated Sign In page, carrying the
 * HomePage URL when it is opened from there; on that page a guest gets a Back
 * to Home action that restores the carried URL (or the bare Home). Logout
 * runs the logout Task and reports a failure as a toast — the Task itself
 * never translates its outcome.
 */
export const useAccountBar = () => {
  const email = useSelector(selectSessionEmail);
  const location = useLocation();
  const navigate = useNavigate();

  const isSignInPage = location.pathname === '/login';
  const fromHome = readFromHome(location.state);

  // Only the HomePage carries its URL: the Sign in entry point lives nowhere
  // else for a guest. Any other route still opens the login page without it.
  const goToSignIn = () => {
    if (location.pathname !== '/') {
      navigate('/login');
      return;
    }

    const state: SignInLocationState = {
      fromHome: `${location.pathname}${location.search}`,
    };

    navigate('/login', { state });
  };

  const goToHome = () => navigate(fromHome ?? '/');

  const onLogout = async () => {
    const result = await logout();

    if (result.status === 'error') notify.error(result.message);
  };

  const account: AccountBarAccount =
    email === null ? { kind: 'guest' } : { kind: 'user', email };

  return { account, isSignInPage, goToSignIn, goToHome, onLogout };
};
