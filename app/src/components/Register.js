import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BookImage from '../assets/images/Book.png';

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

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


    <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#f8f6f1', fontFamily: 'Lora, serif' }}>
      <div className="d-flex flex-column flex-md-row rounded shadow" style={{ width: '90%', maxWidth: '900px', overflow: 'hidden' }}>


        <div className=" bg-opacity-25 d-flex flex-column justify-content-center align-items-center p-4" style={{ flex: 1, backgroundColor: '#D0EFCF' }}>
          <img
            src={BookImage}
            alt="Bookify Logo"
            style={{ width: '300px', margin: '0px', padding: '0px' }}
          />
          <h1 style={{ fontSize: '80px', fontWeight: 'bold', color: '#21583B' }}>Bookify</h1>
        </div>


        <div className="p-5" style={{ flex: 1, backgroundColor: '#E1EAE5' }}>
          <h2 className="text-center mb-4" style={{ color: '#21583B', fontWeight: 'bold', fontSize: '45px' }}>Create Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" style={{ color: '#21583B' }}>Username:</label>
              <input
                type="text"
                style={{ backgroundColor: '#E1EAE5', borderColor: '#21583B' }}
                id="username"
                className="form-control"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" style={{ color: '#21583B', }}>Email:</label>
              <input
                type="email"
                style={{ backgroundColor: '#E1EAE5', borderColor: '#21583B' }}
                id="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" style={{ color: '#21583B' }}>Password:</label>
              <input
                type="password"
                style={{ backgroundColor: '#E1EAE5', borderColor: '#21583B' }}
                id="password"
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPassword" style={{ color: '#21583B' }}>Confirm Password:</label>
              <input
                type="password"
                style={{ backgroundColor: '#E1EAE5', borderColor: '#21583B' }}
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="role" style={{ color: '#21583B' }}>Role:</label>
              <select
                id="role"
                style={{ backgroundColor: '#E1EAE5', borderColor: '#21583B' }}
                className="form-select"
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
            <button type="submit" className="btn btn-success w-100" disabled={loading} style={{ backgroundColor: '#21583B', borderColor: '#21583B' }}>
              {loading ? 'Registering...' : 'Register'}
            </button>
            {error && <p className="text-danger text-center mt-3">{error}</p>}
          </form>
          <div className="text-center mt-3">
            Already have an account? <a href="/login" style={{ color: '#21583B' }}>Log in</a>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;
