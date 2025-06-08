import React, { useState, useEffect, useRef } from "react";
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
  Popper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentLight: "rgb(167,215,184)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
};

const formatDate = (isoString) => {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(isoString).toLocaleDateString(undefined, options);
};

const formatTime = (isoString) => {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const linkify = (text) => {
  const urlRegex =
    /\b((https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[\S]*)?)/g;
  return text.split(urlRegex).map((part, i) => {
    if (urlRegex.test(part)) {
      const hasProtocol = part.startsWith("http");
      const url = hasProtocol ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "blue" }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const StudentCornerChat = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [editingTimestamp, setEditingTimestamp] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  const ws = useRef(null);
  const chatEndRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleTyping = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "typing", username }));
    }
  };

  const handleMenuClick = (event, timestamp) => {
    setAnchorEl(event.currentTarget);
    setSelectedTimestamp(timestamp);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTimestamp(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:8000/chat/messages/${selectedTimestamp}`,
        {
          params: { username },
        }
      );
      setMessages((prev) =>
        prev.filter((msg) => msg.timestamp !== selectedTimestamp)
      );
      handleMenuClose();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(
        `http://localhost:8000/chat/messages/${editingTimestamp}`,
        {
          username,
          new_content: editInput,
        }
      );
      setEditingTimestamp(null);
      setEditInput("");
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:8000/chat/messages")
      .then((response) => {
        setMessages(response.data);
        scrollToBottom();
      })
      .catch((error) => {
        console.error("Error fetching messages:", error);
      });

    ws.current = new WebSocket("ws://localhost:8000/ws/chat");

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "typing" && data.username !== username) {
        setTypingUsers((prev) => ({ ...prev, [data.username]: Date.now() }));
      }

      if (data.type === "message") {
        setMessages((prev) => [...prev, data]);
        scrollToBottom();
      }

      if (data.type === "delete") {
        setMessages((prev) =>
          prev.filter((msg) => msg.timestamp !== data.timestamp)
        );
      }

      if (data.type === "edit") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.timestamp === data.timestamp
              ? { ...msg, content: data.new_content }
              : msg
          )
        );
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([_, ts]) => now - ts < 3000)
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = () => {
    if (input.trim() && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({ type: "message", username, content: input })
      );
      setInput("");
      setShowEmoji(false);
    }
  };

  let lastDate = null;

  return (
    <Box sx={{ p: 2, bgcolor: colors.backgroundLight, height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ color: colors.textDark }}>
          Student Corner Chat
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate("/app/reader/student-corner/scripts")}
          sx={{
            color: colors.accentMedium,
            borderColor: colors.accentMedium,
            "&:hover": {
              backgroundColor: colors.backgroundMedium,
            },
          }}
        >
          View Scripts
        </Button>
      </Box>

      <Paper
        sx={{
          p: 2,
          height: "60vh",
          overflowY: "auto",
          mb: 2,
          bgcolor: colors.backgroundMedium,
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, index) => {
          const isMine = msg.username === username;
          const initials =
            msg.first_name && msg.last_name
              ? `${msg.first_name[0].toUpperCase()}${msg.last_name[0].toUpperCase()}`
              : "NN";

          const currentDate = formatDate(msg.timestamp);
          const showDate = currentDate !== lastDate;
          lastDate = currentDate;

          return (
            <React.Fragment key={index}>
              {showDate && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
                  <Divider sx={{ flex: 1, mr: 1 }} />
                  <Typography variant="caption" sx={{ color: colors.textDark }}>
                    {currentDate}
                  </Typography>
                  <Divider sx={{ flex: 1, ml: 1 }} />
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: isMine ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  mb: 1,
                  gap: 1,
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
                      isMine
                        ? "/app/reader/profile"
                        : `/app/reader/user/${msg.user_id}`
                    )
                  }
                >
                  {initials}
                </Avatar>

                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: "70%",
                    bgcolor: isMine ? colors.accentMedium : colors.accentLight,
                    color: colors.textDark,
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <Typography variant="subtitle2">
                    {msg.username} ({formatTime(msg.timestamp)})
                  </Typography>
                  {editingTimestamp === msg.timestamp ? (
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
                            setEditingTimestamp(null);
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
                    onClick={(e) => handleMenuClick(e, msg.timestamp)}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </React.Fragment>
          );
        })}

        {Object.keys(typingUsers).length > 0 && (
          <Typography
            variant="body2"
            sx={{ fontStyle: "italic", color: colors.textDark, mt: 1 }}
          >
            {Object.keys(typingUsers)[0]} is typing
            {Object.keys(typingUsers).length > 1 &&
              ` + ${Object.keys(typingUsers).length - 1} more...`}
          </Typography>
        )}

        <div ref={chatEndRef} />
      </Paper>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          position: "relative",
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
        />
        <Button
          variant="contained"
          sx={{ bgcolor: colors.accentMedium, color: "#fff" }}
          onClick={(e) => {
            setShowEmoji((prev) => !prev);
            setEmojiAnchor(e.currentTarget);
          }}
          ref={emojiBtnRef}
        >
          😀
        </Button>
        <Button
          variant="contained"
          sx={{ bgcolor: colors.accentMedium, color: "#fff" }}
          onClick={sendMessage}
        >
          Send
        </Button>
      </Box>

      <Popper
        open={showEmoji}
        anchorEl={emojiAnchor}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <Box sx={{ mt: 1 }}>
          <Picker
            data={data}
            onEmojiSelect={(e) => setInput((prev) => prev + e.native)}
            theme="light"
          />
        </Box>
      </Popper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const msg = messages.find((m) => m.timestamp === selectedTimestamp);
            setEditInput(msg?.content?.replace(" (edited)", "") || "");
            setEditingTimestamp(selectedTimestamp);
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

export default StudentCornerChat;
