import { Link, Route, Routes, useLocation } from 'react-router-dom';

import type { FavoritesLocationState } from '../pages/types';

import { FavoritesPage } from '../pages/FavoritesPage';
import { HomePage } from '../pages/HomePage';
import { Toaster } from './Toaster';

import styles from './App.module.css';

export const App = () => {
  const { pathname, search } = useLocation();
  const favoritesState: FavoritesLocationState | undefined =
    pathname === '/' ? { fromHome: `${pathname}${search}` } : undefined;

  return (
    <div className={styles.app}>
      <nav className={styles.nav}>
        <Link className={styles.navLink} to="/">
          Home
        </Link>
        <Link className={styles.navLink} to="/favorites" state={favoritesState}>
          Favorites
        </Link>
      </nav>

      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </main>

      {/* The single global toast outlet — every notify call renders here. */}
      <Toaster />
    </div>
  );
};
