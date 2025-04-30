
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  let roleNames = [];
  try {
    const user = JSON.parse(userJson);
    if (Array.isArray(user.roles)) {
      roleNames = user.roles.map(r =>
        typeof r === 'string' ? r.toLowerCase() : String(r.name).toLowerCase()
      );
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles
    .map(r => r.toLowerCase())
    .some(r => roleNames.includes(r));

    if (!hasAccess) {
        return <Navigate to="/unauthorized" replace />;
    }

  return children;
}
