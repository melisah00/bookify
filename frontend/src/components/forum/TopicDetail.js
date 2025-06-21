import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { IconButton, Pagination, Button } from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteIcon from '@mui/icons-material/Delete';

export default function TopicDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, hasRole } = useAuth();

  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [viewCount, setViewCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [replyTexts, setReplyTexts] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [votedPosts, setVotedPosts] = useState({});

  const [page, setPage] = useState(1);
  const postsPerPage = 10;
  const hasIncremented = useRef(false);

  const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
  });

  const incrementViewCount = useCallback(async () => {
    try {
      await api.post(`/forum/${topicId}/increment-view`);
    } catch (e) {
      console.error('Error incrementing view count:', e);
    }
  }, [topicId]);

  const fetchTopic = useCallback(async () => {
    try {
      const { data } = await api.get(`/forum/topics/${topicId}`);
      setTopicTitle(data.title);
      setTopicDescription(data.description);
      setIsLocked(data.is_locked);
      setViewCount(data.view_count);
    } catch (e) {
      console.error('Error fetching topic:', e);
    }
  }, [topicId]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: postsData } = await api.get(`/forum/topics/${topicId}/posts`);
      const otherIds = Array.from(
        new Set(postsData.map(p => p.user_id).filter(id => id !== user?.id))
      );
      const usersArr = await Promise.all(
        otherIds.map(id =>
          api.get(`/users/fe/${id}`).then(res => res.data).catch(() => ({ id, username: `User#${id}` }))
        )
      );
      const usersMap = Object.fromEntries(usersArr.map(u => [u.id, u.username]));
      const mapped = postsData.map(p => ({
        ...p,
        username: p.user_id === user?.id ? user.username : usersMap[p.user_id],
      }));
      setPosts(mapped);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }, [topicId, user]);

  useEffect(() => {
    if (!authLoading && !hasIncremented.current) {
      hasIncremented.current = true;
      (async () => {
        if (!hasRole('admin')) {
          await incrementViewCount();
        }
        await fetchTopic();
        await fetchPosts();
      })();
    }
  }, [authLoading, hasRole, incrementViewCount, fetchTopic, fetchPosts]);

  const deletePost = async postId => {
    try {
      await api.delete(`/forum/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.post_id !== postId));
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message);
    }
  };

  const addComment = async (replyToId = null, text) => {
    if (!text.trim()) return;
    if (!user) { setError('You are not logged in.'); return; }
    if (isLocked) { setError('Topic is locked.'); return; }

    const payload = {
      topic_id: Number(topicId),
      content: text,
      user_id: user.id,
      reply_to_post_id: replyToId,
    };

    try {
      await api.post('/forum/posts', payload);
      if (replyToId) {
        setReplyTexts(prev => ({ ...prev, [replyToId]: '' }));
      } else {
        setCommentText('');
      }
      fetchPosts();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message);
    }
  };

  const votePost = async (postId, type) => {
    const post = posts.find(p => p.post_id === postId);
    if (!user || post.user_id === user.id) return;
    if (votedPosts[postId]) return;

    try {
      await api.patch(`/forum/posts/${postId}/vote`, { vote: type });
      setVotedPosts(prev => ({ ...prev, [postId]: true }));
      fetchPosts();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message);
    }
  };

  const handleReplyChange = (postId, text) => {
    setReplyTexts(prev => ({ ...prev, [postId]: text }));
  };

  const rootPosts = posts.filter(p => !p.reply_to_post_id);
  const repliesMap = posts.reduce((acc, p) => {
    if (p.reply_to_post_id) {
      acc[p.reply_to_post_id] = acc[p.reply_to_post_id] || [];
      acc[p.reply_to_post_id].push(p);
    }
    return acc;
  }, {});

  const pageCount = Math.ceil(rootPosts.length / postsPerPage);
  const paginatedPosts = rootPosts.slice((page - 1) * postsPerPage, page * postsPerPage);

  if (loading || authLoading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 bg-gray-50" style={{ margin: '3%' }}>
      <Button
        variant="contained"
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '1rem',
          backgroundColor: 'rgb(102,178,160)',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgb(85,150,135)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgb(102,178,160)')}
      >
        Back
      </Button>


      <h2 className="text-2xl font-bold mb-2">{topicTitle}</h2>
      <p className="mb-2">{topicDescription}</p>
      <p className="text-sm text-gray-500 mb-4">Views: <strong>{viewCount}</strong></p>
      <hr className="mb-4" />

      {isLocked && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-3 rounded mb-4">
          This topic is locked. You can't add or reply to comments.
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {paginatedPosts.length === 0 ? (
        <p>No posts.</p>
      ) : (
        paginatedPosts.map(post => (
          <div key={post.post_id} className="mb-6 border-b pb-4">
            <PostItem
              post={post}
              replies={repliesMap[post.post_id] || []}
              votePost={votePost}
              deletePost={deletePost}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyTexts={replyTexts}
              handleReplyChange={handleReplyChange}
              addComment={addComment}
              user={user}
              hasRole={hasRole}
              votedPosts={votedPosts}
              allPosts={posts}
              repliesMap={repliesMap}
              depth={0}
              isLocked={isLocked}
            />
          </div>
        ))
      )}

      {pageCount > 1 && (
        <div className="flex justify-center my-4">
          <Pagination
            count={pageCount}
            page={page}
            onChange={(e, value) => setPage(value)}
          />
        </div>
      )}

      {!isLocked && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Add a comment</h3>
          {user && (
            <p className="mb-2 text-gray-600">
              Commenting as <span className="font-semibold text-green-800">{user.username}</span>
            </p>
          )}
          <textarea
            rows={4}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your comment..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <button
            onClick={() => addComment(null, commentText)}
            className="mt-2 text-white px-4 py-2 rounded"
            style={{
              backgroundColor: 'rgb(102,178,160)',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgb(85,150,135)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgb(102,178,160)')}
          >
            Post
          </button>


        </div>
      )}
    </div>
  );
}

function PostItem({ post, replies, votePost, deletePost, replyingTo, setReplyingTo, replyTexts, handleReplyChange, addComment, user, hasRole, votedPosts, allPosts, repliesMap, depth, isLocked }) {
  const isOwnPost = user && post.user_id === user.id;
  const alreadyVoted = votedPosts[post.post_id];
  const replyToUsername = post.reply_to_post_id
    ? allPosts.find(p => p.post_id === post.reply_to_post_id)?.username
    : null;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="font-semibold text-green-700">{post.username}</span>
          {replyToUsername && (
            <span className="text-gray-500 text-sm ml-2">(replying to {replyToUsername})</span>
          )}
          <span className="text-gray-500 text-sm ml-2">{new Date(post.created_at).toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          {(hasRole('admin') || isOwnPost) && (
            <IconButton onClick={() => deletePost(post.post_id)} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          <button
            onClick={() => votePost(post.post_id, 1)}
            disabled={isOwnPost || alreadyVoted}
            className={`text-green-600 ${isOwnPost || alreadyVoted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >▲</button>
          <span>{post.upvote - post.downvote}</span>
          <button
            onClick={() => votePost(post.post_id, -1)}
            disabled={isOwnPost || alreadyVoted}
            className={`text-red-600 ${isOwnPost || alreadyVoted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >▼</button>
          {!isLocked && (
            <IconButton
              onClick={() => setReplyingTo(replyingTo === post.post_id ? null : post.post_id)}
              size="small"
              className={replyingTo === post.post_id ? 'text-red-500' : ''}
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
          )}
        </div>
      </div>
      <p className="mb-2">{post.content}</p>

      {!isLocked && replyingTo === post.post_id && (
        <div className="mb-4 pl-4">
          {user && (
            <p className="mb-1 text-gray-600">Replying as <span className="font-semibold text-blue-600">{user.username}</span></p>
          )}
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 border p-2 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Reply to ${post.username || 'this post'}...`}
              value={replyTexts[post.post_id] || ''}
              onChange={e => handleReplyChange(post.post_id, e.target.value)}
            />
            <button
              onClick={() => addComment(post.post_id, replyTexts[post.post_id])}
              className="bg-green-600 text-white px-4 hover:bg-green-700"
            >Send</button>
            <span onClick={() => setReplyingTo(null)} className="cursor-pointer text-gray-500 hover:text-red-500 ml-2 text-xl font-bold" title="Cancel reply">×</span>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className={`pl-6 ${depth < 5 ? 'border-l-2 border-gray-200' : ''}`}>
          {replies.map(reply => (
            <div key={reply.post_id} className="mb-3">
              <PostItem
                post={reply}
                replies={repliesMap[reply.post_id] || []}
                votePost={votePost}
                deletePost={deletePost}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyTexts={replyTexts}

                handleReplyChange={handleReplyChange}
                addComment={addComment}
                user={user}
                hasRole={hasRole}
                votedPosts={votedPosts}
                allPosts={allPosts}
                repliesMap={repliesMap}
                depth={depth + 1}
                isLocked={isLocked}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
