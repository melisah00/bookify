import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MailIcon from "@mui/icons-material/Mail";
// import NotificationsIcon from "@mui/icons-material/Notifications";
import MoreIcon from "@mui/icons-material/MoreVert";
import LogoutButton from "./LogoutButton";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import palette from "../theme/palette";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Avatar from "@mui/material/Avatar";

export default function Header({ onOnlineUsersChange }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);
  const [options, setOptions] = React.useState([]);
  const [inputValue, setInputValue] = React.useState("");
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [conversations, setConversations] = React.useState([]);
  const [messageAnchorEl, setMessageAnchorEl] = React.useState(null);
  const [onlineUsers, setOnlineUsers] = React.useState([]);
  const isMessageMenuOpen = Boolean(messageAnchorEl);
  const location = useLocation();

  const { user } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.roles?.[0] || "reader";
  const profilePath = `/app/${userRole}/profile`;

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);
  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };
  const handleMobileMenuOpen = (event) =>
    setMobileMoreAnchorEl(event.currentTarget);

  const handleMessageMenuOpen = (event) => {
    setMessageAnchorEl(event.currentTarget);
  };

  const handleMessageMenuClose = () => {
    setMessageAnchorEl(null);
  };

  const totalUnread = conversations.reduce(
    (acc, c) => acc + (c.unread_count || 0),
    0
  );

  // const fetchInbox = () => {
  //   fetch(`http://localhost:8000/chat/inbox/${user.id}`, {
  //     credentials: "include",
  //   })
  //     .then((res) => res.json())
  //     .then(setConversations)
  //     .catch((err) => console.error("Failed to load inbox in header:", err));
  // };

  const fetchInbox = React.useCallback(() => {
    fetch(`http://localhost:8000/chat/inbox/${user.id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setConversations)
      .catch((err) => console.error("Failed to load inbox in header:", err));
  }, [user?.id]);


  React.useEffect(() => {
    if (!user?.id) return;
    fetchInbox();
  }, [user, location, fetchInbox]);

  React.useEffect(() => {
    const refreshInbox = () => {
      fetchInbox();
    };

    window.addEventListener("left-private-chat", refreshInbox);
    return () => {
      window.removeEventListener("left-private-chat", refreshInbox);
    };
  }, [fetchInbox]);


  const headerWS = React.useRef(null);

  React.useEffect(() => {
    if (!user?.id) return;

    const connectWS = () => {
      headerWS.current = new WebSocket(`ws://localhost:8000/ws/private-chat/${user.id}`);

      headerWS.current.onopen = () => {
        console.log("📡 Header WebSocket otvoren");
      };

      headerWS.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (
          data.type === "unread_count_update" ||
          data.type === "private_message"
        ) {
          fetchInbox();
        }

        if (data.type === "online_users") {
          setOnlineUsers(data.user_ids);

          // Ako je funkcija propom proslijeđena (npr. u Dashboardu)
          if (typeof onOnlineUsersChange === "function") {
            onOnlineUsersChange(data.user_ids);
          }
        }
      };

      headerWS.current.onclose = () => {
        console.log("❌ Header WebSocket zatvoren");
      };

      headerWS.current.onerror = (e) => {
        console.error("Header WS error:", e);
      };
    };

    connectWS();

    // Ponovno konektovanje kada izađeš iz PrivateChat
    const reconnect = () => {
      console.log("🔁 Header WS ponovna konekcija nakon izlaska iz chata");
      if (headerWS.current?.readyState === WebSocket.OPEN) {
        headerWS.current.close();
      }
      connectWS();
    };

    window.addEventListener("left-private-chat", reconnect);

    return () => {
      window.removeEventListener("left-private-chat", reconnect);
      headerWS.current?.close();
    };
  }, [user?.id, onOnlineUsersChange, fetchInbox]);



  React.useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (inputValue.trim()) {
        setLoadingUsers(true);
        fetch(`http://localhost:8000/users/search-users?query=${inputValue}`, {
          credentials: "include",
        })
          .then((res) => res.json())
          .then(setOptions)
          .catch(() => setOptions([]))
          .finally(() => setLoadingUsers(false));
      } else {
        setOptions([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [inputValue]);

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      open={isMenuOpen}
      onClose={handleMenuClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <MenuItem onClick={handleMenuClose}>
        <NavLink
          to={profilePath}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          Profile
        </NavLink>
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <LogoutButton />
      </MenuItem>
    </Menu>
  );

  const renderMessageMenu = (
    <Menu
      anchorEl={messageAnchorEl}
      open={isMessageMenuOpen}
      onClose={handleMessageMenuClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{ sx: { maxHeight: 400, width: 300 } }}
    >
      {conversations.length === 0 ? (
        <MenuItem disabled>No messages</MenuItem>
      ) : (
        conversations.map((conv) => {
          const initials = (conv.first_name?.[0] || "") + (conv.last_name?.[0] || "");
          const isOnline = onlineUsers?.includes(conv.id); // koristi ako već imaš onlineUsers
          return (
            <MenuItem
              key={conv.id}
              onClick={() => {
                navigate(`/app/${userRole}/chat/private/${conv.id}`);
                handleMessageMenuClose();
              }}
              sx={{ alignItems: "flex-start", gap: 1 }}
            >
              <Box sx={{ position: "relative", width: 40, height: 40 }}>
                <Avatar
                  src={conv.icon ? `http://localhost:8000${conv.icon}` : undefined}
                  sx={{
                    width: 40,
                    height: 40,
                    fontSize: conv.icon ? 16 : 13,
                    bgcolor: "#66b2a0",
                  }}
                >
                  {!conv.icon && initials}
                </Avatar>
                {/* Online/offline status dot */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: isOnline ? "#44b700" : "#9e9e9e",
                    border: "2px solid white",
                  }}
                />
              </Box>

              <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {conv.first_name} {conv.last_name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: "block", maxWidth: "100%" }}
                >
                  {conv.last_message}
                </Typography>
              </Box>

              {conv.unread_count > 0 && (
                <Badge
                  badgeContent={conv.unread_count}
                  color="error"
                  sx={{ ml: 1, mt: 0.5 }}
                />
              )}
            </MenuItem>
          );
        })
      )}
    </Menu>
  );


  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      {user?.roles?.[0] !== "admin" && (
        <MenuItem onClick={handleMessageMenuOpen}>
          <IconButton size="large" color="inherit">
            <Badge badgeContent={totalUnread} color="error">
              <MailIcon />
            </Badge>
          </IconButton>
          <p>Messages</p>
        </MenuItem>
      )}

      {/* <MenuItem>
        <IconButton size="large" color="inherit">
          <Badge badgeContent={17} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem> */}
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton size="large" color="inherit">
          <AccountCircle />
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ width: "100%" }}>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: "rgb(102,178,160)",
          color: "white",
          boxShadow: "0 4px 12px rgba(255, 255, 255, 0.3)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderLeft: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        <Toolbar>
          <Box
            component="img"
            src="/Book.png"
            alt="Bookify Logo"
            sx={{
              width: 40,
              height: 40,
              mr: 1,
              filter: "brightness(0) invert(1)",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              display: { xs: "none", sm: "block" },
              fontWeight: "bold",
              color: "rgb(248,246,241)",
              cursor: "pointer",
            }}
            onClick={() => navigate(`/`)}
          >
            BOOKIFY
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
              mx: 4,
            }}
          >
            {user?.roles?.[0] !== "admin" && (
              <Autocomplete
                options={options}
                loading={loadingUsers}
                inputValue={inputValue}
                onInputChange={(e, val) => setInputValue(val)}
                onChange={(e, selectedUser) => {
                  if (selectedUser) {
                    navigate(`/app/${userRole}/user/${selectedUser.id}`);
                    setInputValue("");
                    setOptions([]);
                  }
                }}
                getOptionLabel={(option) =>
                  option.username
                    ? `${option.first_name !== "N/A" ? option.first_name : ""
                      } ${option.last_name !== "N/A" ? option.last_name : ""
                      } (@${option.username})`.trim()
                    : ""
                }
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    key={option.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 0.5,
                    }}
                  >
                    <Avatar
                      src={
                        option.icon
                          ? `http://localhost:8000${option.icon}`
                          : undefined
                      }
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: 14,
                        bgcolor: "#66b2a0",
                      }}
                    >
                      <AccountCircle />
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        <strong>@{option.username}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.first_name} {option.last_name}
                      </Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="No users found"
                sx={{
                  width: { xs: 200, sm: 300, md: 400 },
                  bgcolor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                  "& .MuiOutlinedInput-root": {
                    minHeight: 32,
                    bgcolor: "white",
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: palette.accentMedium },
                    "&.Mui-focused fieldset": {
                      borderColor: palette.accentMedium,
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search users..."
                    size="small"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {loadingUsers && (
                            <CircularProgress
                              color="inherit"
                              size={16}
                              sx={{ mr: 1 }}
                            />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                      sx: {
                        height: 32,
                        px: 1,
                        fontSize: 14,
                        bgcolor: "white",
                        borderRadius: "8px",
                        "& input": { padding: "4px 6px" },
                      },
                    }}
                  />
                )}
              />
            )}
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" } }}>
            {user?.roles?.[0] !== "admin" && (
              <IconButton size="large" color="inherit" onClick={handleMessageMenuOpen}>
                <Badge badgeContent={totalUnread} color="error">
                  <MailIcon />
                </Badge>
              </IconButton>
            )}

            {/* <IconButton size="large" color="inherit">
              <Badge badgeContent={17} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton> */}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              {user?.roles?.[0] !== "admin" && user?.icon ? (
                <Avatar
                  src={`http://localhost:8000${user.icon}`}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountCircle sx={{ width: 32, height: 32 }} />
              )}
            </IconButton>
          </Box>

          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="show more"
              aria-controls="primary-search-account-menu-mobile"
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {renderMobileMenu}
      {renderMenu}
      {renderMessageMenu}
    </Box>
  );
}
