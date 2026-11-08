import { Link, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home.jsx';

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
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
