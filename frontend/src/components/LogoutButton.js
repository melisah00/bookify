import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Typography } from "@mui/material";

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
    <Typography
      onClick={handleLogout}
      
    >
      Logout
    </Typography>
  );
}
