import { Route, Routes } from 'react-router-dom';

import { FavoritesPage } from '../pages/FavoritesPage';
import { HomePage } from '../pages/HomePage';
import { Toaster } from './Toaster';

import styles from './App.module.css';

export const App = () => (
  <div className={styles.app}>
    <main className={styles.content}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Routes>
    </main>

    <Toaster />
  </div>
);
