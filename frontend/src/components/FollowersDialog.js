import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function FollowersDialog({ open, onClose, userId, title, type }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(null);
  const [followingCount, setFollowingCount] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user: loggedInUser } = useAuth();

  const pathParts = location.pathname.split("/");
  const roleFromPath = pathParts[2] || "reader";
  const profilePath = `/app/${roleFromPath}/profile`;

  useEffect(() => {
    if (!open) return;

    setLoading(true);

    fetch(`http://localhost:8000/users/${type}/${userId}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    fetch(`http://localhost:8000/users/count-followers/${userId}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setFollowersCount(data.followers_count))
      .catch(err => console.error(err));

    fetch(`http://localhost:8000/users/count-following/${userId}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setFollowingCount(data.following_count))
      .catch(err => console.error(err));

  }, [open, userId, type]);

  const handleClick = (selectedUser) => {
    onClose();
    if (loggedInUser && selectedUser.id === loggedInUser.id) {
      navigate(profilePath);
    } else {
      navigate(`/app/${roleFromPath}/user/${selectedUser.id}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary">
            Following: {followingCount !== null ? followingCount : '...'} 
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Followers: {followersCount !== null ? followersCount : '...'} 
          </Typography>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : users.length === 0 ? (
          <Typography>No users found.</Typography>
        ) : (
          <List>
            {users.map((u) => (
              <ListItem key={u.id} button onClick={() => handleClick(u)}>
                <ListItemAvatar>
                  <Avatar
                    src={u.icon ? `http://localhost:8000${u.icon}` : undefined}
                  >
                    {u.first_name?.[0]}{u.last_name?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`@${u.username}`}
                  secondary={`${u.first_name} ${u.last_name}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
