import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LogoutButton() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Logout failed on backend, clearing locally.");
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        backgroundColor: "#d9534f",
        color: "white",
        padding: "8px 12px",
        border: "none",
        borderRadius: "4px",
        fontWeight: "bold",
        cursor: "pointer",
        marginLeft: "20px",
      }}
    >
      Logout
    </button>
  );
}
