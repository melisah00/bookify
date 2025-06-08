import React, { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import BookIcon from "@mui/icons-material/Book";
import SchoolIcon from "@mui/icons-material/School";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import EventIcon from "@mui/icons-material/Event";
import ForumIcon from "@mui/icons-material/Forum";
import HeartIcon from "@mui/icons-material/Favorite";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const items = [
  { label: "Profile", icon: <AccountCircleIcon />, to: "/app/reader/profile" },
  { label: "Browse Books", to: "/app/reader/books", icon: <BookIcon /> },
  { label: "Student Corner", icon: <SchoolIcon /> },
  { label: "Inbox", icon: <InboxIcon /> },
  { label: 'Events', icon: <EventIcon /> , to: '/app/events' },
  { label: "Forums", icon: <ForumIcon />, to: '/app/forums' },
  { label: "Favorites", icon: <HeartIcon />, to: "/app/reader/favourites" },
];

export default function ReaderHomePage() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: "#f4f7f6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 6,
      }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 4, fontWeight: "bold", color: "#4e796b" }}
      >
        {loading ? "Loading..." : user ? `Hello, ${user.username}` : "Hello"}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 4,
          width: "100%",
          maxWidth: 900,
          px: 2,
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
        }}
      >
        {items.map((item, index) => (
          <Paper
            key={index}
            elevation={4}
            onClick={() => {
              setSelected(item);
              if (item.to) {
                navigate(item.to);
              }
            }}
            sx={{
              cursor: "pointer",
              height: 150,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              bgcolor:
                selected?.label === item.label ? "rgb(102,178,160)" : "white",
              color:
                selected?.label === item.label ? "#fff" : "rgb(78,121,107)",
              borderRadius: 4,
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: selected?.label === item.label ? 6 : 2,
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
                bgcolor:
                  selected?.label === item.label
                    ? "rgb(102,178,160)"
                    : "rgb(245,250,248)",
              },
              textAlign: "center",
              px: 2,
            }}
          >
            <Box sx={{ fontSize: 36 }}>{item.icon}</Box>
            <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 500 }}>
              {item.label}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
