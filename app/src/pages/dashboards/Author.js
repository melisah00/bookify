import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Author() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      try {
        const res = await fetch('http://localhost:8000/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUser(data);
      } catch {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <p>Loading...</p>;

  const roles = Array.isArray(user.roles) 
    ? user.roles.map(r => typeof r === 'string' ? r : r.name)
    : [];

  return (
    <div>
      <h1>Author Dashboard</h1>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Roles:</strong></p>
      <ul>
        {roles.map(role => <li key={role}>{role}</li>)}
      </ul>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Author;