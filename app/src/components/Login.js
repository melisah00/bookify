import React, { useState } from "react";
import BookImage from '../assets/images/Book.png';


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
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#f8f6f1', fontFamily: 'Lora, serif' }}>
      <div className="d-flex flex-column align-items-center p-4 rounded shadow" style={{ backgroundColor: '#D0EFCF', borderRadius: '10px', width: '400px' }}>
        <h2 style={{ marginTop: '20px', marginBottom: '0px', color: '#21583B', fontWeight: 'bold' }}>BOOKIFY</h2>
        <img src={BookImage} alt="Book" style={{ maxWidth: '250px', margin: '0px', padding: '0px' }} />
        <h2 style={{ marginTop: '0px', marginBottom: '20px', color: '#21583B', fontWeight: 'bold' }}>Log In</h2>

        <form onSubmit={handleSubmit} className="d-flex flex-column" style={{ width: '250px' }}>
          <div className="mb-2">
            <label htmlFor="username" className="form-label" style={{ marginBottom: '4px', color: '#21583B' }}>Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="form-control"
              style={{ backgroundColor: '#D0EFCF', height: '35px', fontSize: '14px', borderColor: '#21583B' }}
            />
          </div>
          <div className="mb-2">
            <label htmlFor="password" className="form-label" style={{ marginBottom: '4px', color: '#21583B' }}>Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="form-control"
              style={{ backgroundColor: '#D0EFCF', height: '35px', fontSize: '14px', borderColor: '#21583B' }}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary mt-2" style={{ backgroundColor: '#21583B', borderColor: '#21583B', color: 'white' }}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
          {error && <p className="text-danger mt-2">{error}</p>}
        </form>


        <p className="mt-3" style={{ fontSize: '14px', color: '#21583B' }}>
          Don't have an account?{' '}
          <span
            style={{ cursor: 'pointer', textDecoration: 'underline', color: '#21583B' }}
            onClick={() => navigate('/register')}
          >
            Register
          </span>
        </p>
      </div>
    </div>

  );
}

export default Login;
