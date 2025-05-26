
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

export default function ProtectedLayout() {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  const pathParts = location.pathname.split('/');
  if (pathParts.length < 3) return <Outlet />;

  const requestedRole = pathParts[2];


  if (!hasRole(requestedRole)) {
    if (hasRole('admin')) return <Navigate to="/app/admin" replace />;
    if (hasRole('author')) return <Navigate to="/app/author" replace />;
    return <Navigate to="/app/reader" replace />;
  }

  return <Outlet />;
}