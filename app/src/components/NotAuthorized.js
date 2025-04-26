import React from 'react';
import { Link } from 'react-router-dom';

export default function NotAuthorized() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>403 – Access Denied</h1>
      <p>Niste ovlasteni za ovu stranicu.</p>
      <Link to="/">Povratak na pocetnu</Link>
    </div>
  );
}
