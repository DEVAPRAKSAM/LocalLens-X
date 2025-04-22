import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="app-header" style={{ backgroundColor: '#222', padding: '10px', color: 'white' }}>
      <h2>📍 LocalLens X</h2>
      <nav>
        <Link to="/" style={{ color: 'white', margin: '0 10px' }}>Home</Link>
        <Link to="/report" style={{ color: 'white', margin: '0 10px' }}>Report</Link>
      </nav>
    </header>
  );
}

export default Header;
