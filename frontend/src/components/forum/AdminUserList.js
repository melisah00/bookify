import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const palette = {
    backgroundMedium: "rgb(225,234,229)",
    accentMedium: "rgb(102,178,160)",
    textDark: "rgb(78,121,107)",
    errorRed: "#d9534f",
    hoverShade: "rgba(0, 0, 0, 0.1)",
};

const AdminUserList = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const { loading } = useAuth();

    const API_URL = 'http://localhost:8000/users/list';

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch(API_URL, { method: 'GET', credentials: 'include' });
            if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
            const data = await res.json();
            setUsers(data);
        } catch (e) {
            setError(e.message);
        }
    }, []);

    const toggleBlock = async (id, blocked) => {
        try {
            const action = blocked ? 'unblock' : 'block';
            const url = `http://localhost:8000/users/${id}/${action}`;
            const res = await fetch(url, { method: 'POST', credentials: 'include' });
            if (!res.ok) throw new Error(`Action failed: ${res.status}`);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked: !blocked } : u));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!loading) fetchUsers();
    }, [loading, fetchUsers]);

    if (error) return <p style={{ color: palette.errorRed }}>Error: {error}</p>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1.5rem',
                color: palette.textDark,
            }}>
                User Management
            </h2>

            <table
                style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: '0 0.75rem',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    color: palette.textDark,
                }}
            >
                <thead>
                    <tr style={{ backgroundColor: palette.accentMedium, color: 'white', textAlign: 'left' }}>
                        <th style={{ padding: '12px 20px', borderRadius: '8px 0 0 8px' }}>Username</th>
                        <th style={{ padding: '12px 20px' }}>Blocked</th>
                        <th style={{ padding: '12px 20px', borderRadius: '0 8px 8px 0' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u, idx) => (
                        <tr
                            key={u.id}
                            style={{
                                backgroundColor: idx % 2 === 0 ? palette.backgroundMedium : 'white',
                                transition: 'background-color 0.3s ease',
                                borderRadius: '8px',
                                cursor: 'default',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = palette.hoverShade}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? palette.backgroundMedium : 'white'}
                        >
                            <td style={{ padding: '14px 20px', fontWeight: '600' }}>{u.username}</td>
                            <td style={{ padding: '14px 20px', fontWeight: '600' }}>{u.is_blocked ? 'Yes' : 'No'}</td>
                            <td style={{ padding: '14px 20px' }}>
                                <button
                                    onClick={() => toggleBlock(u.id, u.is_blocked)}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        color: 'white',
                                        backgroundColor: u.is_blocked ? palette.errorRed : palette.accentMedium,
                                        transition: 'background-color 0.3s ease',
                                    }}
                                    onMouseEnter={e =>
                                        e.currentTarget.style.backgroundColor = u.is_blocked
                                            ? '#b7413a'
                                            : 'rgba(102,178,160,0.85)'
                                    }
                                    onMouseLeave={e =>
                                        e.currentTarget.style.backgroundColor = u.is_blocked
                                            ? palette.errorRed
                                            : palette.accentMedium
                                    }
                                >
                                    {u.is_blocked ? 'Unblock' : 'Block'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUserList;
