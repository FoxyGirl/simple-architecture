import { Link, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';

import styles from './App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <nav className={styles.nav}>
        <Link className={styles.navLink} to="/">
          Home
        </Link>
      </nav>

      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
