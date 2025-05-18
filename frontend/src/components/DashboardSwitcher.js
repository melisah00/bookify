import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const getRolePath = (user) => {
  if (!user) return 'reader';
  if (user.roles.includes('admin')) return 'admin';
  if (user.roles.includes('author')) return 'author';
  return 'reader';
};

export default function DashboardSwitcher() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;

  const role = getRolePath(user);
  return <Navigate to={`/app/${role}`} replace />;
}
