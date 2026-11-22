import { Navigate, Route, Routes } from 'react-router-dom';

import { FavoritesPage } from '../pages/FavoritesPage';
import { HomePage } from '../pages/HomePage';
import { AccountBar } from './AccountBar';
import { AuthModal } from './AuthModal';
import { useApp } from './logic/useApp';
import { Toaster } from './Toaster';

import styles from './App.module.css';

export const App = () => {
  const {
    isSessionReady,
    isAuthenticated,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  } = useApp();

  return (
    <div className={styles.app}>
      <AccountBar onSignIn={openAuthModal} />

      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/favorites"
            element={
              isAuthenticated ? (
                <FavoritesPage />
              ) : isSessionReady ? (
                <Navigate to="/" replace />
              ) : null
            }
          />
        </Routes>
      </main>

      {isAuthModalOpen && (
        <AuthModal onSignedIn={closeAuthModal} onClose={closeAuthModal} />
      )}

      <Toaster />
    </div>
  );
};
