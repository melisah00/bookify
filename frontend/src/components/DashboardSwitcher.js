
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardSwitcher() {
  const { user, loading, hasRole } = useAuth();

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;

  if (hasRole('admin')) return <Navigate to="/app/admin" replace />;
  if (hasRole('author')) return <Navigate to="/app/author" replace />;
  return <Navigate to="/app/reader" replace />;
}