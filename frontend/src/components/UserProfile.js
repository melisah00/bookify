import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import PersonIcon from '@mui/icons-material/Person';
import Divider from '@mui/material/Divider';
import { useAuth } from '../contexts/AuthContext';
import palette from '../theme/palette';


const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 450,
  bgcolor: palette.backgroundLight,
  boxShadow: 24,
  borderRadius: '12px',
  p: 0,
  outline: 'none',
  overflow: 'hidden',
};

export default function UserProfile({ open, handleClose, userId }) {
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState(null);
  const { user: currentUser, hasRole } = useAuth();
  const [followStatusLoaded, setFollowStatusLoaded] = useState(false);


  useEffect(() => {
    if (!open) {
      setUser(null);
      setIsFollowing(false);
      setError(null);
      return;
    }


    fetch(`http://localhost:8000/users/fe/${userId}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setUser(data);
      })
      .catch((err) => {
        console.error("User fetch failed:", err);
        setError("Ne možemo dohvatiti korisnika.");
      });
    setFollowStatusLoaded(false);


    fetch(`http://localhost:8000/users/is-following/${userId}`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : { following: false }))
      .then((data) => {
        setIsFollowing(data.following);
        setFollowStatusLoaded(true);
      })
      .catch((err) => {
        console.error("Follow status error:", err);
        setIsFollowing(false);
        setFollowStatusLoaded(true);
      });

  }, [open, userId]);


  const handleFollow = async () => {
    try {
      const followRes = await fetch(`http://localhost:8000/users/follow/${userId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!followRes.ok) throw new Error('Follow failed');
      setIsFollowing(true);

      const userRes = await fetch(`http://localhost:8000/users/fe/${userId}`, {
        credentials: 'include',
      });
      if (!userRes.ok) throw new Error(`HTTP error! Status: ${userRes.status}`);
      const userData = await userRes.json();
      setUser(userData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfollow = async () => {
    try {
      const unfollowRes = await fetch(`http://localhost:8000/users/unfollow/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!unfollowRes.ok) throw new Error('Unfollow failed');
      setIsFollowing(false);

      const userRes = await fetch(`http://localhost:8000/users/fe/${userId}`, {
        credentials: 'include',
      });
      if (!userRes.ok) throw new Error(`HTTP error! Status: ${userRes.status}`);
      const userData = await userRes.json();
      setUser(userData);
    } catch (err) {
      console.error(err);
    }
  };


  const formatRole = (roles) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) return 'N/A';
    const firstRole = roles[0];
    let rawName;

    if (typeof firstRole === 'string') {
      rawName = firstRole;
    } else if (firstRole && typeof firstRole === 'object' && 'name' in firstRole) {
      rawName = firstRole.name;
    } else {
      rawName = firstRole.roleName || String(firstRole);
    }

    return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  };
  const isAdmin = hasRole('admin');

  const roleNames = Array.isArray(user?.roles)
    ? user.roles.map(r => (typeof r === 'string' ? r.toLowerCase().trim() : r.name?.toLowerCase().trim() || ''))
    : [];
  const canFollowOrUnfollow =
    user &&
    (roleNames.includes('reader') || roleNames.includes('author'));


  return (
    <Modal open={open} onClose={handleClose} sx={{ backdropFilter: 'blur(4px)' }}>
      <Box sx={modalStyle}>
        <Box
          sx={{
            bgcolor: palette.accentMedium,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor: palette.backgroundLight,
              width: 50,
              height: 50,
              color: palette.accentMedium,
              border: `2px solid ${palette.backgroundLight}`,
            }}
            src={user?.avatarUrl || ''}
          >
            {user?.first_name && user?.last_name ? (
              `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
            ) : (
              <PersonIcon sx={{ fontSize: 26 }} />
            )}
          </Avatar>

          <Box>
            <Typography
              variant="h6"
              sx={{
                color: palette.backgroundLight,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              @{user?.username || 'username'}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.85rem',
                mt: 0.5,
                fontWeight: 500,
              }}
            >
              {user ? formatRole(user.roles) : 'N/A'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 2.5 }}>
          {error ? (
            <Typography
              color={palette.errorRed}
              textAlign="center"
              sx={{ py: 1.5 }}
            >
              {error}
            </Typography>
          ) : !user ? (
            <Typography
              textAlign="center"
              sx={{ color: palette.textDark, py: 1.5 }}
            >
              Loading profile...
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: palette.textDark,
                      opacity: 0.8,
                      fontSize: '0.7rem',
                    }}
                  >
                    First name
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: palette.textDark,
                      fontWeight: 500,
                    }}
                  >
                    {user.first_name || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: palette.textDark,
                      opacity: 0.8,
                      fontSize: '0.7rem',
                    }}
                  >
                    Last name
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: palette.textDark,
                      fontWeight: 500,
                    }}
                  >
                    {user.last_name || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: palette.textDark,
                      opacity: 0.8,
                      fontSize: '0.7rem',
                    }}
                  >
                    Email
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: palette.textDark,
                      fontWeight: 500,
                      wordBreak: 'break-word',
                    }}
                  >
                    {user.email || 'N/A'}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ borderColor: palette.backgroundMedium, opacity: 0.4 }} />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  bgcolor: 'rgba(102,178,160, 0.08)',
                  borderRadius: '8px',
                  py: 1.5,
                }}
              >
                <Box textAlign="center">
                  <Typography
                    variant="h6"
                    sx={{ color: palette.accentMedium, fontWeight: 700 }}
                  >
                    {user.followers.length}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: palette.textDark, letterSpacing: 0.5 }}
                  >
                    FOLLOWERS
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography
                    variant="h6"
                    sx={{ color: palette.accentMedium, fontWeight: 700 }}
                  >
                    {user.following.length}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: palette.textDark, letterSpacing: 0.5 }}
                  >
                    FOLLOWING
                  </Typography>
                </Box>
              </Box>

              {canFollowOrUnfollow && !isAdmin && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={isFollowing ? handleUnfollow : handleFollow}
                  sx={{
                    py: 1,
                    borderRadius: '6px',
                    bgcolor: isFollowing ? palette.errorRed : palette.accentMedium,
                    color: palette.backgroundLight,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: isFollowing ? '#c9302c' : 'rgb(80, 160, 140)',
                    },
                  }}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}

              {isAdmin && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      py: 1,
                      borderRadius: '6px',
                      borderColor: palette.errorRed,
                      color: palette.errorRed,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#c9302c',
                        backgroundColor: 'rgba(217, 83, 79, 0.08)',
                      },
                    }}
                  >
                    Block User
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      py: 1,
                      borderRadius: '6px',
                      borderColor: palette.textDark,
                      color: palette.textDark,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: palette.accentMedium,
                        backgroundColor: 'rgba(102,178,160, 0.08)',
                      },
                    }}
                  >
                    Edit Profile
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

UserProfile.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};





