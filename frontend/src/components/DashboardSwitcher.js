import { useAuth } from "../contexts/AuthContext";
import AdminDashboard from "../dashboards/AdminDashboard";
import AuthorDashboard from "../dashboards/AuthorDashboard";
import ReaderDashboard from "../dashboards/ReaderDashboard";

export default function DashboardSwitcher() {
  const { user } = useAuth();

  if (!user || !Array.isArray(user.roles)) {
    return <p>Loading…</p>;
  }

  if (user.roles.includes("admin")) {
    return <AdminDashboard />;
  }
  if (user.roles.includes("author")) {
    return <AuthorDashboard />;
  }
  return <ReaderDashboard />;
}
