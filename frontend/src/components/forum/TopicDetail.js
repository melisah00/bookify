import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router-dom';

export default function TopicDetail() {
  const { topicId } = useParams();
  const [replyTexts, setReplyTexts] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // Track which post we're replying to
  const { token, userRoles, userId, username } = useAuth();

  const API_BASE = "http://localhost:8000/forum";

  const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`${API_BASE}/topics/${topicId}/posts`);
      setPosts(data);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [topicId, api]);

  const deletePost = async (postId) => {
    try {
      await api.delete(`${API_BASE}/posts/${postId}`);
      setPosts(posts.filter(p => p.post_id !== postId));
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || e.message);
    }
  };

  const addComment = async (replyToId = null, text) => {
    if (!text?.trim()) return;
    try {
      const payload = {
        topic_id: Number(topicId),
        content: text,
        user_id: userId,
        reply_to_post_id: replyToId,
      };
      const { data } = await api.post(`${API_BASE}/posts`, payload);
      setPosts([...posts, data]);
      if (replyToId) {
        setReplyTexts(prev => ({ ...prev, [replyToId]: '' }));
        setReplyingTo(null);
      } else {
        setCommentText('');
      }
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || e.message);
    }
  };

  const votePost = async (postId, type) => {
    try {
      await api.patch(`${API_BASE}/posts/${postId}/vote`, { vote: type });
      fetchPosts();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || e.message);
    }
  };

  const handleReplyChange = (postId, text) => {
    setReplyTexts(prev => ({ ...prev, [postId]: text }));
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) return <div className="p-4">Učitavanje postova...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tema #{topicId}</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {posts.length === 0 ? (
        <p>Nema postova u ovoj temi.</p>
      ) : (
        posts.map(p => (
          <div key={p.post_id} className="border-b border-gray-200 py-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="font-semibold text-blue-600">{p.username || 'Anonimni korisnik'}</span>
                <span className="text-gray-500 text-sm ml-3">
                  {new Date(p.created_at).toLocaleString('hr-HR')}
                </span>
              </div>
              <div className="flex space-x-2">
                {(userRoles.includes('admin') || userRoles.includes('forum_moderator')) && (
                  <button
                    onClick={() => deletePost(p.post_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Izbriši
                  </button>
                )}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => votePost(p.post_id, 1)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ▲
                  </button>
                  <span className="text-gray-700 mx-1">{p.upvote - p.downvote}</span>
                  <button
                    onClick={() => votePost(p.post_id, -1)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            <p className="text-gray-800 mb-3">{p.content}</p>

            <div className="pl-4 border-l-2 border-gray-200">
              <button
                onClick={() => setReplyingTo(replyingTo === p.post_id ? null : p.post_id)}
                className="text-sm text-blue-600 hover:text-blue-800 mb-2"
              >
                {replyingTo === p.post_id ? 'Odustani' : 'Odgovori'}
              </button>

              {replyingTo === p.post_id && (
                <div className="flex mb-4">
                  <input
                    type="text"
                    placeholder="Tvoj odgovor..."
                    value={replyTexts[p.post_id] || ''}
                    onChange={e => handleReplyChange(p.post_id, e.target.value)}
                    className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => addComment(p.post_id, replyTexts[p.post_id])}
                    className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700"
                  >
                    Pošalji
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Dodaj novi komentar</h3>
        <textarea
          rows={4}
          placeholder="Tvoj komentar..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => addComment()}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Objavi komentar
        </button>
      </div>
    </div>
  );
}