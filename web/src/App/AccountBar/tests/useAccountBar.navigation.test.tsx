import { cleanup, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { store } from '~/store';

import { useAccountBar } from '../logic/useAccountBar';

const navigate = vi.fn();
const route = { pathname: '/', search: '', state: null as unknown };

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useLocation: () => route,
    useNavigate: () => navigate,
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

const renderBar = () => renderHook(() => useAccountBar(), { wrapper });

describe('useAccountBar navigation', () => {
  beforeEach(() => {
    navigate.mockReset();
    route.pathname = '/';
    route.search = '';
    route.state = null;
  });

  afterEach(cleanup);

  it('carries the parameterized Home URL into the sign-in state', () => {
    route.search = '?search=world&genre=Drama&page=2';
    const { result } = renderBar();

    result.current.goToSignIn();

    expect(navigate).toHaveBeenCalledWith('/login', {
      state: { fromHome: '/?search=world&genre=Drama&page=2' },
    });
  });

  it('does not carry a Home URL from another route', () => {
    route.pathname = '/favorites';
    route.search = '?page=2';
    const { result } = renderBar();

    result.current.goToSignIn();

    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('returns to the carried Home URL', () => {
    route.pathname = '/login';
    route.state = { fromHome: '/?search=world&genre=Drama&page=2' };
    const { result } = renderBar();

    result.current.goToHome();

    expect(navigate).toHaveBeenCalledWith('/?search=world&genre=Drama&page=2');
  });

  it('returns to the bare Home when no state was carried', () => {
    route.pathname = '/login';
    const { result } = renderBar();

    result.current.goToHome();

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('returns to the bare Home when the state holds no usable fromHome', () => {
    route.pathname = '/login';
    route.state = { fromHome: 42 };
    const { result } = renderBar();

    result.current.goToHome();

    expect(navigate).toHaveBeenCalledWith('/');
  });
});
