import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

export default function ProtectedLayout() {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  const pathParts = location.pathname.split('/');
  if (pathParts.length < 3) return <Outlet />;

  const requestedRoute = pathParts[2];

  // Define role-based routes explicitly
  const roleBasedRoutes = ['admin', 'author', 'reader'];
  
  if (roleBasedRoutes.includes(requestedRoute)) {
    // This is a role-based route, check permissions
    const requestedRole = requestedRoute;

    if (!hasRole(requestedRole)) {
      if (hasRole('admin')) return <Navigate to="/app/admin" replace />;
      if (hasRole('author')) return <Navigate to="/app/author" replace />;
      return <Navigate to="/app/reader" replace />;
    }
  }

  // For all other routes (like /app/events), just allow access
  return <Outlet />;
}