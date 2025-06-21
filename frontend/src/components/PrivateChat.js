import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  Divider,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useAuth } from "../contexts/AuthContext";

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentLight: "rgb(167,215,184)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
};

const formatDate = (iso) => new Date(iso).toLocaleDateString();
const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const linkify = (text) => {
  const urlRegex =
    /((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([\/?][^\s]*)?)/gi;
  return (
    <span>
      {text.split(/\s+/).map((part, i) => {
        if (urlRegex.test(part)) {
          let url = part;
          if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
          }
          return (
            <React.Fragment key={i}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "blue", textDecoration: "underline" }}
              >
                {part}
              </a>{" "}
            </React.Fragment>
          );
        }
        return <React.Fragment key={i}>{part} </React.Fragment>;
      })}
    </span>
  );
};

const PrivateChat = () => {
  const { receiverId } = useParams();
  const { user: loggedInUser } = useAuth();
  const navigate = useNavigate();

  const senderId = loggedInUser?.id;
  const username = loggedInUser?.username;
  const userRole =
    Array.isArray(loggedInUser?.roles) && loggedInUser.roles.length > 0
      ? typeof loggedInUser.roles[0] === "string"
        ? loggedInUser.roles[0]
        : loggedInUser.roles[0]?.name?.toLowerCase()
      : "reader";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const typingTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);
  const ws = useRef(null);
  const emojiButtonRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "typing",
          sender_id: senderId,
          receiver_id: parseInt(receiverId),
        })
      );
    }
  };

useEffect(() => {
  if (!senderId || !receiverId) return;

  // 🟢 1. Dohvati postojeće poruke
  axios
    .get(`http://localhost:8000/private-chat/${senderId}/${receiverId}`, {
      withCredentials: true,
    })
    .then((res) => {
      setMessages(res.data);
      scrollToBottom();
    })
    .catch((err) => console.error("❌ Greška kod dohvata historije:", err));

  // 🟢 2. Postavi WebSocket konekciju
  ws.current = new WebSocket(`ws://localhost:8000/ws/private-chat/${senderId}`);

  ws.current.onopen = () => {
    console.log("✅ WebSocket otvoren");
  };

  ws.current.onerror = (err) => {
    console.error("❌ WebSocket greška:", err);
  };

  ws.current.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "private_message") {
      const isRelevant =
        (data.sender_id === senderId && data.receiver_id == receiverId) ||
        (data.sender_id == receiverId && data.receiver_id === senderId);

      if (isRelevant) {
        setMessages((prev) => [...prev, data]);
        scrollToBottom();
      }
    }

    if (data.type === "private_delete") {
      setMessages((prev) =>
        prev.filter((msg) => msg.message_id !== data.message_id)
      );
    }

    if (data.type === "private_edit") {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === data.message_id
            ? { ...msg, content: data.new_content }
            : msg
        )
      );
    }

    if (data.type === "private_typing") {
      if (data.sender_id === parseInt(receiverId)) {
        setTypingUser(data.username);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null);
        }, 3000);
      }
    }
  };

  return () => {
    ws.current?.close();

    // Emituj custom event kada napustiš privatni chat
    const event = new Event("left-private-chat");
    window.dispatchEvent(event);
  };
}, [senderId, receiverId]);



  const sendMessage = () => {
    if (input.trim() && ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          sender_id: senderId,
          receiver_id: parseInt(receiverId),
          content: input,
        })
      );
      setInput("");
      setShowEmoji(false);
    }
  };

  const handleMenuClick = (e, id) => {
    setAnchorEl(e.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:8000/private-chat/messages/${selectedId}`,
        {
          params: { username },
          withCredentials: true,
        }
      );
      setMessages((prev) =>
        prev.filter((msg) => msg.message_id !== selectedId)
      );
      handleMenuClose();
    } catch (err) {
      console.error("Delete error:", err);
      handleMenuClose();
    }
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(
        `http://localhost:8000/private-chat/messages/${editingId}`,
        {
          username,
          new_content: editInput,
        },
        {
          withCredentials: true,
        }
      );
      setEditingId(null);
      setEditInput("");
    } catch (error) {
      console.error("Edit error:", error);
    }
  };

  let lastDate = null;

  return (
    <Box sx={{ p: 2, bgcolor: colors.backgroundLight, height: "100%" }}>
      <Typography variant="h5" sx={{ mb: 2, color: colors.textDark }}>
        Private Chat
      </Typography>

      <Paper
        sx={{
          p: 2,
          height: "60vh",
          overflowY: "auto",
          mb: 2,
          bgcolor: colors.backgroundMedium,
          borderRadius: 2,
        }}
      >
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === senderId;
          const showDate = formatDate(msg.timestamp) !== lastDate;
          lastDate = formatDate(msg.timestamp);
          const initials =
            (msg.first_name?.[0] || "") + (msg.last_name?.[0] || "");

          return (
            <React.Fragment key={index}>
              {showDate && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
                  <Divider sx={{ flex: 1, mr: 1 }} />
                  <Typography variant="caption" sx={{ color: colors.textDark }}>
                    {lastDate}
                  </Typography>
                  <Divider sx={{ flex: 1, ml: 1 }} />
                </Box>
              )}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: isMine ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Avatar
                  src={
                    msg.icon ? `http://localhost:8000${msg.icon}` : undefined
                  }
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 14,
                    bgcolor: "#66b2a0",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    navigate(
                      msg.sender_id === loggedInUser?.id
                        ? `/app/${userRole}/profile`
                        : `/app/${userRole}/user/${msg.sender_id}`
                    )
                  }
                >
                  {!msg.icon && initials.toUpperCase()}
                </Avatar>

                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: "70%",
                    bgcolor: isMine ? colors.accentMedium : colors.accentLight,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <Typography variant="subtitle2">
                    {formatTime(msg.timestamp)}
                  </Typography>
                  {editingId === msg.message_id ? (
                    <Box>
                      <TextField
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        fullWidth
                        size="small"
                        multiline
                      />
                      <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleEditSubmit}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setEditingId(null);
                            setEditInput("");
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body1">
                      {linkify(msg.content)}
                    </Typography>
                  )}
                </Box>

                {isMine && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, msg.message_id)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </React.Fragment>
          );
        })}

        {typingUser && (
          <Typography
            variant="body2"
            sx={{ fontStyle: "italic", color: colors.textDark, mt: 1 }}
          >
            {typingUser} is typing...
          </Typography>
        )}

        <div ref={chatEndRef} />
      </Paper>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          position: "relative",
        }}
      >
        <TextField
          fullWidth
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type a message..."
        />

        <Button
          ref={emojiButtonRef}
          onClick={() => setShowEmoji((prev) => !prev)}
          sx={{
            minWidth: 40,
            px: 1.5,
            bgcolor: colors.accentMedium,
            color: "white",
          }}
        >
          😀
        </Button>

        <Button
          onClick={sendMessage}
          variant="contained"
          sx={{ bgcolor: colors.accentMedium }}
        >
          Send
        </Button>

        {showEmoji && (
          <Box
            sx={{
              position: "absolute",
              bottom: 60,
              right: 100,
              zIndex: 10,
            }}
          >
            <Picker
              data={data}
              onEmojiSelect={(e) => setInput((prev) => prev + e.native)}
              theme="light"
            />
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const msg = messages.find((m) => m.message_id === selectedId);
            setEditInput(msg?.content?.replace(" (edited)", "") || "");
            setEditingId(selectedId);
            handleMenuClose();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </Box>
  );
};

export default PrivateChat;
