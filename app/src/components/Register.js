import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    if (!username || !email || !password || !role) {
      setError("All fields are required.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const payload = { username, email, password, roles: [role] };
      const regRes = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        let message = 'Registration failed.';
        if (Array.isArray(regData.detail)) {
          message = regData.detail.map(d => d.msg || JSON.stringify(d)).join(' ');
        } else if (typeof regData.detail === 'string') {
          message = regData.detail;
        }
        throw new Error(message);
      }

      const form = new URLSearchParams();
      form.append('username', username);
      form.append('password', password);
      const loginRes = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        let message = 'Login after register failed.';
        if (loginData.detail) message = loginData.detail;
        throw new Error(message);
      }
      const { access_token: token } = loginData;
      localStorage.setItem('token', token);

      const userRes = await fetch('http://localhost:8000/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!userRes.ok) throw new Error('Failed to fetch user info');
      const userData = await userRes.json();

      localStorage.setItem('user', JSON.stringify(userData));

      const roleNames = Array.isArray(userData.roles)
        ? userData.roles.map(r =>
            typeof r === 'string' ? r.toLowerCase() : String(r.name).toLowerCase()
          )
        : [];

      if (roleNames.includes('reader')) navigate('/reader', { state: { user: userData } });
      else if (roleNames.includes('author')) navigate('/author', { state: { user: userData } });
      else if (roleNames.includes('forum_moderator')) navigate('/forum-moderator', { state: { user: userData } });
      else if (roleNames.includes('forum_admin')) navigate('/forum-admin', { state: { user: userData } });
      else navigate('/protected', { state: { user: userData } });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            value={role}
            onChange={e => setRole(e.target.value)}
            required
          >
            <option value="">Select a role</option>
            <option value="reader">Reader</option>
            <option value="author">Author</option>
            <option value="forum_moderator">Forum Moderator</option>
            <option value="forum_admin">Forum Admin</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default Register;
