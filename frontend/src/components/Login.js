"use client";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
  errorRed: "#d9534f",
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const styles = {
    page: {
      backgroundColor: colors.backgroundLight,
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
    },
    card: {
      backgroundColor: "white",
      padding: "30px",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      width: "100%",
      maxWidth: "400px",
    },
    heading: {
      fontSize: "1.8rem",
      marginBottom: "20px",
      color: colors.textDark,
      borderBottom: `2px solid ${colors.accentMedium}`,
      paddingBottom: "10px",
      textAlign: "center",
    },
    formGroup: {
      marginBottom: "15px",
      display: "flex",
      flexDirection: "column",
    },
    label: {
      marginBottom: "5px",
      color: colors.textDark,
      fontWeight: "bold",
    },
    input: {
      padding: "10px",
      border: `1px solid ${colors.accentMedium}`,
      borderRadius: "4px",
      fontSize: "1rem",
      color: colors.textDark,
      outline: "none",
    },
    button: {
      backgroundColor: colors.accentMedium,
      color: "white",
      padding: "12px",
      border: "none",
      borderRadius: "4px",
      fontSize: "1rem",
      cursor: "pointer",
      width: "100%",
      transition: "background-color 0.2s",
    },
    error: {
      color: colors.errorRed,
      marginBottom: "10px",
      fontWeight: "bold",
      textAlign: "center",
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const loginRes = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
      });

      if (!loginRes.ok) {
        const errData = await loginRes.json();
        throw new Error(errData.detail || "Login failed");
      }

      const meRes = await fetch("http://localhost:8000/users/profile", {
        credentials: "include",
      });

      if (!meRes.ok) throw new Error("Failed to fetch user info");

      const currentUser = await meRes.json();

      const roles = Array.isArray(currentUser.roles)
        ? currentUser.roles.map((r) =>
            typeof r === "string" ? r : r.name || r.role_name || r.value || ""
          )
        : [];

      setUser({ ...currentUser, roles });
      navigate("/app");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Login</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.button}>
            Log In
          </button>
        </form>
        <p
          style={{
            textAlign: "center",
            marginTop: "15px",
            color: colors.textDark,
          }}
        >
          Don’t have an account?{" "}
          <Link
            to="/register"
            style={{ color: colors.accentMedium, textDecoration: "none" }}
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
