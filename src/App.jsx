import { Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';

import './App.css';

function App() {
  return (
    <div className="app">
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
