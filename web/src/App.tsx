import { Link, Route, Routes } from 'react-router-dom';
import { FavoritesPage } from './pages/FavoritesPage';
import { HomePage } from './pages/HomePage';

import styles from './App.module.css';

function App() {
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
    </div>
  );
}

export default App;
