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

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: "N/A",
          last_name: "N/A",
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Registration failed.");
      }

      const loginForm = new URLSearchParams();
      loginForm.append("username", formData.username);
      loginForm.append("password", formData.password);

      const loginRes = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: loginForm.toString(),
        credentials: "include",
      });

      if (!loginRes.ok) throw new Error("Automatic login failed.");

      const meRes = await fetch("http://localhost:8000/auth/user-info", {
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
        <h2 style={styles.heading}>Register</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>
        <p
          style={{
            textAlign: "center",
            marginTop: "15px",
            color: colors.textDark,
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: colors.accentMedium, textDecoration: "none" }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
