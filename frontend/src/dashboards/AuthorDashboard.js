import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthorDashboard() {
  const { user, loading } = useAuth();
  const [authorData, setAuthorData] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && user) {
      setFetching(true);
      fetch('http://localhost:8000/auth/author-specific-route', {
        credentials: 'include',
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch author data');
          return res.json();
        })
        .then(data => setAuthorData(data))
        .catch(err => setError(err.message))
        .finally(() => setFetching(false));
    }
  }, [loading, user]);

  if (loading) return <div>Učitavanje...</div>;
  if (!user) return <div>Morate biti prijavljeni.</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Author Dashboard</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user.icon && (
          <img
            src={user.icon}
            alt="Ikona korisnika"
            style={{ width: '80px', height: '80px', borderRadius: '50%' }}
          />
        )}
        <div>
          <h2>{user.first_name} {user.last_name}</h2>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Uloge:</strong> {user.roles.join(', ')}</p>
        </div>
      </div>

      <hr style={{ margin: '20px 0' }} />

      <div>
        <h3>Specifični podaci za autora:</h3>
        {fetching && <p>Učitavanje specifičnih podataka...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {authorData && (
          <div>
            <p>{authorData.message}</p>

          </div>
        )}
      </div>
    </div>
  );
}