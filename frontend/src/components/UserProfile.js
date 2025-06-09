import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import PersonIcon from "@mui/icons-material/Person";
import Divider from "@mui/material/Divider";
import { useAuth } from "../contexts/AuthContext";
import palette from "../theme/palette";
import FollowersDialog from "./FollowersDialog";
import MailOutlineIcon from '@mui/icons-material/MailOutline';

export default function UserProfile() {
  const navigate = useNavigate();
  const { id: userId } = useParams();
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState(null);
  const { hasRole, user: loggedInUser } = useAuth();
  const [followStatusLoaded, setFollowStatusLoaded] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  const userRole = Array.isArray(loggedInUser?.roles) && loggedInUser.roles.length > 0
    ? (typeof loggedInUser.roles[0] === "string"
      ? loggedInUser.roles[0]
      : loggedInUser.roles[0]?.name?.toLowerCase())
    : "reader";

  useEffect(() => {
    fetch(`http://localhost:8000/users/fe/${userId}`, {
      credentials: "include",
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
      credentials: "include",
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
  }, [userId]);

  // const handleFollow = async () => {
  //   try {
  //     const followRes = await fetch(
  //       `http://localhost:8000/users/follow/${userId}`,
  //       {
  //         method: "POST",
  //         credentials: "include",
  //       }
  //     );
  //     if (!followRes.ok) throw new Error("Follow failed");
  //     setIsFollowing(true);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  // const handleUnfollow = async () => {
  //   try {
  //     const unfollowRes = await fetch(
  //       `http://localhost:8000/users/unfollow/${userId}`,
  //       {
  //         method: "DELETE",
  //         credentials: "include",
  //       }
  //     );
  //     if (!unfollowRes.ok) throw new Error("Unfollow failed");
  //     setIsFollowing(false);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };


  const toggleFollow = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/users/${isFollowing ? "unfollow" : "follow"}/${userId}`,
        {
          method: isFollowing ? "DELETE" : "POST",
          credentials: "include",
        }
      );

      if (res.ok) {
        setIsFollowing(!isFollowing);
        setUser((prev) => ({
          ...prev,
          followers: isFollowing
            ? prev.followers.filter((f) => f.id !== loggedInUser.id)
            : [...prev.followers, { id: loggedInUser.id, username: loggedInUser.username }],
        }));
      } else {
        console.error("Failed to follow/unfollow");
      }
    } catch (err) {
      console.error("Follow/unfollow error:", err);
    }
  };


  const formatRole = (roles) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) return "N/A";
    const firstRole = roles[0];
    let rawName =
      typeof firstRole === "string"
        ? firstRole
        : firstRole?.name || firstRole?.roleName || String(firstRole);
    return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  };

  const isAdmin = hasRole("admin");

  const roleNames = Array.isArray(user?.roles)
    ? user.roles.map((r) =>
      typeof r === "string"
        ? r.toLowerCase().trim()
        : r.name?.toLowerCase().trim() || ""
    )
    : [];

  const canFollowOrUnfollow =
    user && (roleNames.includes("reader") || roleNames.includes("author"));

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 6, mb: 4, px: 2 }}>
      {error ? (
        <Typography color={palette.errorRed} textAlign="center" sx={{ py: 1.5 }}>
          {error}
        </Typography>
      ) : !user ? (
        <Typography textAlign="center" sx={{ color: palette.textDark, py: 1.5 }}>
          Loading profile...
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              bgcolor: palette.accentMedium,
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderRadius: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: palette.backgroundLight,
                width: 60,
                height: 60,
                color: palette.accentMedium,
                border: `2px solid ${palette.backgroundLight}`,
              }}
              src={user?.icon ? `http://localhost:8000${user.icon}` : undefined}
            >
              {user?.first_name && user?.last_name ? (
                `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
              ) : (
                <PersonIcon sx={{ fontSize: 26 }} />
              )}
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
              <Info label="First name" value={user.first_name} />
              <Info label="Last name" value={user.last_name} />
              <Info label="Email" value={user.email} full colspan />
            </Box>
            <Divider />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                bgcolor: "rgba(102,178,160, 0.08)",
                borderRadius: 2,
                py: 1.5,
                textAlign: "center",
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ color: palette.accentMedium, fontWeight: 700 }}>
                  {user.followers?.length || 0}
                </Typography>
                <Button
                  variant="text"
                  onClick={() => setFollowersOpen(true)}
                  sx={{ fontSize: 12, fontWeight: 600, color: palette.accentMedium }}
                >
                  Followers
                </Button>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: palette.accentMedium, fontWeight: 700 }}>
                  {user.following.length}
                </Typography>
                <Button
                  variant="text"
                  onClick={() => setFollowingOpen(true)}
                  sx={{ fontSize: 12, fontWeight: 600, color: palette.accentMedium }}
                >
                  Following
                </Button>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<MailOutlineIcon />}
              onClick={() => navigate(`/app/${userRole}/chat/private/${user.id}`)}
              sx={{
                py: 1,
                borderRadius: 2,
                borderColor: palette.accentMedium,
                color: palette.accentMedium,
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "rgba(102,178,160, 0.1)",
                  borderColor: palette.accentMedium,
                },
              }}
            >
              Send Message
            </Button>

            {canFollowOrUnfollow && !isAdmin && followStatusLoaded && (
              <Button
                fullWidth
                variant="contained"
                onClick={toggleFollow}
                sx={{
                  py: 1,
                  borderRadius: 2,
                  bgcolor: isFollowing ? palette.errorRed : palette.accentMedium,
                  color: palette.backgroundLight,
                  fontWeight: 600,
                  "&:hover": {
                    bgcolor: isFollowing ? "#c9302c" : "rgb(80, 160, 140)",
                  },
                }}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}

          </Stack>

          <FollowersDialog
            open={followersOpen}
            onClose={() => setFollowersOpen(false)}
            userId={user.id}
            type="followers"
            title={`Followers of @${user.username}`}
          />

          <FollowersDialog
            open={followingOpen}
            onClose={() => setFollowingOpen(false)}
            userId={user.id}
            type="following"
            title={`Users followed by @${user.username}`}
          />
        </>
      )}
    </Box>
  );
}

function Info({ label, value }) {
  return (
    <Box>
      <Typography variant="overline" sx={{ color: palette.textDark, opacity: 0.8, fontSize: "0.7rem" }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ color: palette.textDark, fontWeight: 500 }}>
        {value || "N/A"}
      </Typography>
    </Box>
  );
}
