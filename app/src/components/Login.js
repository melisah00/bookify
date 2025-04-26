import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    if (!username || !password) {
      setError("All fields are required.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");

    try {
      const formDetails = new URLSearchParams();
      formDetails.append("username", username);
      formDetails.append("password", password);

      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formDetails,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed.');
      }
      const { access_token: token } = await response.json();
      localStorage.setItem('token', token);

      const userRes = await fetch('http://localhost:8000/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!userRes.ok) {
        throw new Error('Failed to fetch user info');
      }
      const userData = await userRes.json();

      
      localStorage.setItem('user', JSON.stringify(userData));

    
      const roleNames = Array.isArray(userData.roles)
        ? userData.roles.map(r =>
            typeof r === 'string' ? r.toLowerCase() : String(r.name).toLowerCase()
          )
        : [];

      if (roleNames.includes('admin')) {
        navigate('/admin', { state: { user: userData } });
      } else if (roleNames.includes('reader')) {
        navigate('/reader', { state: { user: userData } });
      } else if (roleNames.includes('author')) {
        navigate('/author', { state: { user: userData } });
      } else if (roleNames.includes('forum_moderator')) {
        navigate('/forum-moderator', { state: { user: userData } });
      } else if (roleNames.includes('forum_admin')) {
        navigate('/forum-admin', { state: { user: userData } });
      } else {
        navigate('/protected', { state: { user: userData } });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
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
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default Login;
