import { Navigate, Route, Routes } from 'react-router-dom';

import { FavoritesPage } from '../pages/FavoritesPage';
import { HomePage } from '../pages/HomePage';
import { SignInPage } from '../pages/SignInPage';
import { AccountBar } from './AccountBar';
import { useApp } from './logic/useApp';
import { Toaster } from './Toaster';

import styles from './App.module.css';

export const App = () => {
  const { isSessionReady, isAuthenticated, favoritesExit } = useApp();

  return (
    <div className={styles.app}>
      <AccountBar />

      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : isSessionReady ? (
                <SignInPage />
              ) : null
            }
          />
          <Route
            path="/favorites"
            element={
              isAuthenticated ? (
                <FavoritesPage />
              ) : isSessionReady ? (
                <Navigate to={favoritesExit} replace />
              ) : null
            }
          />
        </Routes>
      </main>

      <Toaster />
    </div>
  );
};
