
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Avatar,
  Stack,
  Divider,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useAuth } from "../contexts/AuthContext";
import palette from "../theme/palette";
import FollowersDialog from "./FollowersDialog";

export default function UserProfileModal({ open, onClose, userId }) {
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { hasRole, user: logged } = useAuth();
  const navigate = useNavigate();
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoaded(false);

    fetch(`http://localhost:8000/users/fe/${userId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => setUser(null));

    fetch(`http://localhost:8000/users/is-following/${userId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { following: false }))
      .then((d) => {
        setIsFollowing(d.following);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, userId]);

  const handleFollow = async () => {
    const res = await fetch(
      `http://localhost:8000/users/${isFollowing ? "unfollow" : "follow"}/${userId}`,
      {
        method: isFollowing ? "DELETE" : "POST",
        credentials: "include",
      }
    );

    if (res.ok) {
      setIsFollowing(!isFollowing);
      setUser((u) => ({
        ...u,
        followers: isFollowing
          ? u.followers.filter((f) => f.id !== logged.id)
          : [...u.followers, { id: logged.id, username: logged.username }],
      }));
    }
  };

  const formatRole = (r) => {
    if (!r || !r.length) return "N/A";
    const n = typeof r[0] === "string" ? r[0] : r[0].name;
    return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
  };

  const isAdmin = hasRole("admin");
  const names = user?.roles?.map((r) => (typeof r === "string" ? r : r.name)) || [];
  const canFU = user && (names.includes("reader") || names.includes("author"));

  return (
    <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="xs" 
    sx={{
      "& .MuiDialog-paper": {
        margin: 0, 
        borderRadius: 3,
        backgroundColor: palette.backgroundDark,
      },
    }}
  >
    <DialogContent
      dividers
      sx={{
        p: 2, 
      }}
    >
      {user ? (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
              bgcolor: palette.accentMedium,
              p: 2,
              borderRadius: 2,
            }}
          >
            <Avatar
              src={user.icon ? `http://localhost:8000${user.icon}` : undefined}
              sx={{
                width: 60,
                height: 60,
                bgcolor: palette.backgroundLight,
                color: palette.accentMedium,
                border: `2px solid ${palette.backgroundLight}`,
              }}
            >
              {user.first_name?.[0] || <PersonIcon />}
              {user.last_name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} color={palette.backgroundLight}>
                @{user.username}
              </Typography>
              <Typography variant="subtitle1" color="rgba(255,255,255,0.9)">
                {formatRole(user.roles)}
              </Typography>
            </Box>
          </Box>

            <Stack spacing={2.5} sx={{ mt: 3 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Info label="First" value={user.first_name} />
                <Info label="Last" value={user.last_name} />
              </Box>
              <Info label="Email" value={user.email} />
              <Divider />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-around",
                  bgcolor: "rgba(102,178,160,0.08)",
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                <Box textAlign="center">
                  <Typography variant="h6" sx={{ color: palette.accentMedium, fontWeight: 700 }}>
                    {user.followers.length}
                  </Typography>
                  <Button size="small" onClick={() => setFollowersOpen(true)}>
                    Followers
                  </Button>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h6" sx={{ color: palette.accentMedium, fontWeight: 700 }}>
                    {user.following.length}
                  </Typography>
                  <Button size="small" onClick={() => setFollowingOpen(true)}>
                    Following
                  </Button>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<MailOutlineIcon />}
                onClick={() => {
                  navigate(`/app/${formatRole(logged.roles).toLowerCase()}/chat/private/${user.id}`);
                  onClose();
                }}
                sx={{
                  py: 1,
                  borderRadius: 2,
                  borderColor: palette.accentMedium,
                  color: palette.accentMedium,
                  fontWeight: 600,
                  "&:hover": {
                    bgcolor: "rgba(102,178,160,0.1)",
                    borderColor: palette.accentMedium,
                  },
                }}
              >
                Send Message
              </Button>

              {canFU && !isAdmin && loaded && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleFollow}
                  sx={{
                    py: 1,
                    borderRadius: 2,
                    bgcolor: isFollowing ? palette.errorRed : palette.accentMedium,
                    color: palette.backgroundLight,
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: isFollowing ? "#c9302c" : "rgb(80,160,140)",
                    },
                  }}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
            </Stack>
          </>
      ) : (
        <Typography>Loading profile...</Typography>
      )}

      <FollowersDialog
        open={followersOpen}
        onClose={() => setFollowersOpen(false)}
        userId={userId}
        type="followers"
        title={`Followers of @${user?.username}`}
      />
      <FollowersDialog
        open={followingOpen}
        onClose={() => setFollowingOpen(false)}
        userId={userId}
        type="following"
        title={`Following of @${user?.username}`}
      />
    </DialogContent>
  </Dialog>
  );
}

function Info({ label, value }) {
  return (
    <Box>
      <Typography variant="overline" sx={{ opacity: 0.8 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value || "N/A"}</Typography>
    </Box>
  );
}
