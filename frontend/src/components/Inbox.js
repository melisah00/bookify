import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Badge,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Inbox({ onlineUsers = [] }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userRole =
    Array.isArray(user?.roles) && user.roles.length > 0
      ? typeof user.roles[0] === "string"
        ? user.roles[0]
        : user.roles[0]?.name?.toLowerCase()
      : "reader";

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 🔁 Fetch inbox
  useEffect(() => {
    if (!user?.id) return;

    fetch(`http://localhost:8000/chat/inbox/${user.id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setConversations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load inbox:", err);
        setLoading(false);
      });
  }, [user]);


  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        📥 Inbox
      </Typography>
      <Stack spacing={2}>
        {conversations.map((conv) => {
          const initials = (conv.first_name?.[0] || "") + (conv.last_name?.[0] || "");
          const isOnline = onlineUsers.includes(conv.id);

          return (
            <Card
              key={conv.id}
              sx={{
                transition: "0.2s",
                borderRadius: 3,
                "&:hover": { boxShadow: 6, cursor: "pointer", transform: "scale(1.01)" },
              }}
              onClick={() => navigate(`/app/${userRole}/chat/private/${conv.id}`)}
            >
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {/* Avatar + status + badge */}
                <Box sx={{ position: "relative", width: 56, height: 56 }}>
                  {/* Crveni badge s brojem */}
                  {conv.unread_count > 0 && (
                    <Badge
                      badgeContent={conv.unread_count}
                      color="error"
                      sx={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                      }}
                    />
                  )}

                  {/* Avatar */}
                  <Avatar
                    src={conv.icon ? `http://localhost:8000${conv.icon}` : undefined}
                    sx={{ width: 56, height: 56, fontWeight: "bold" }}
                  >
                    {initials}
                  </Avatar>

                  {/* Online/offline status krug */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: isOnline ? "#44b700" : "#9e9e9e",
                      border: "2px solid white",
                    }}
                  />
                </Box>

                {/* Tekstualni sadržaj */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {conv.first_name} {conv.last_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{
                      maxWidth: "100%",
                      fontWeight: conv.unread_count > 0 ? "bold" : "normal",
                    }}
                  >
                    {conv.last_message}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50 }}>
                  {formatTime(conv.last_time)}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
