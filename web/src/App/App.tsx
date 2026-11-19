import { Link, Route, Routes } from 'react-router-dom';

import { FavoritesPage } from '../pages/FavoritesPage';
import { HomePage } from '../pages/HomePage';
import { Toaster } from './Toaster';

import styles from './App.module.css';

export const App = () => {
  return (
    <div className={styles.app}>
      <nav className={styles.nav}>
        <Link className={styles.navLink} to="/">
          Home
        </Link>
        <Link className={styles.navLink} to="/favorites">
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
