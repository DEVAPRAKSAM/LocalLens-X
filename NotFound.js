import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>404 - Page Not Found 😕</h2>
      <Link to="/">Go Back Home</Link>
    </div>
  );
}

export default NotFound;
