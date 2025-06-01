import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function UserProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Dohvati korisnika
    fetch(`http://localhost:8000/users/fe/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        console.log("User data:", data);
        setUser(data);
      })
      .catch((err) => {
        console.error("User fetch failed:", err);
        setError("Ne možemo dohvatiti korisnika.");
      });

    // Provjeri follow status
    fetch(`http://localhost:8000/users/is-following/${id}`, {
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : { following: false })
      .then(data => setIsFollowing(data.following))
      .catch(err => {
        console.error("Follow status error:", err);
        setIsFollowing(false);
      });
  }, [id]);

  const handleFollow = () => {
    fetch(`http://localhost:8000/users/follow/${id}`, {
      method: 'POST',
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Follow failed');
        setIsFollowing(true);
      })
      .catch(err => console.error(err));
  };

  const handleUnfollow = () => {
    fetch(`http://localhost:8000/users/unfollow/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Unfollow failed');
        setIsFollowing(false);
      })
      .catch(err => console.error(err));
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-4 max-w-xl mx-auto bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-2">@{user.username}</h1>
      <p className="text-gray-700">{user.first_name} {user.last_name}</p>
      <p className="text-gray-600 text-sm">Email: {user.email}</p>

      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <span><strong>{user.followers.length}</strong> followers</span>
        <span><strong>{user.following.length}</strong> following</span>
      </div>

      <button
        onClick={isFollowing ? handleUnfollow : handleFollow}
        className={`mt-4 px-4 py-2 rounded text-white ${
          isFollowing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    </div>
  );
}
