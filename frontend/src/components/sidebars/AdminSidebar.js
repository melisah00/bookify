import { NavLink } from "react-router-dom";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeIcon from "@mui/icons-material/Home";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import EventIcon from "@mui/icons-material/Event";
import ForumIcon from "@mui/icons-material/Forum";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import UserIcon from "@mui/icons-material/Person";
import { useTheme } from "@mui/material/styles";


const drawerWidth = 200;

const colors = {
  accentMedium: "rgb(102,178,160)",
};

const navItems = [
    { label: 'Home', to: '/app/admin', icon: <HomeIcon /> },
    { label: "Users", to: "/app/admin/users", icon: <UserIcon /> },
    { label: 'Inbox', icon: <InboxIcon /> },
    { label: 'Events', to: '/app/events', icon: <EventIcon /> },
    { label: 'Forums', icon: <ForumIcon />, to: '/app/admin/forum' },
    { label: "Analytics", to: "/app/admin/analytics", icon: <AnalyticsIcon /> },

];

export default function AdminSidebar({ open, onToggle }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const effectiveOpen = !isSmallScreen && open;
  const widthToUse = effectiveOpen ? drawerWidth : 60;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: widthToUse,
        flexShrink: 0,
        whiteSpace: "nowrap",
        "& .MuiDrawer-paper": {
          marginTop: "64px",
          height: `calc(100% - 64px)`,
          width: widthToUse,
          transition: "width 0.3s",
          overflowX: "hidden",
          bgcolor: colors.accentMedium,
          color: "white",
          borderRight: "none",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
        {!isSmallScreen && (
          <IconButton onClick={onToggle} sx={{ color: "white" }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      <List>
        {navItems.map(({ label, to, icon }) => {
          const listItem = (
            <ListItemButton
              component={to ? NavLink : "div"}
              to={to}
              sx={({ isActive }) => ({
                minHeight: 48,
                justifyContent: effectiveOpen ? "initial" : "center",
                px: 2.5,
                mx: 1,
                borderRadius: 2,
                color: "white",
                backgroundColor: isActive
                  ? "rgba(255,255,255,0.2)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              })}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: effectiveOpen ? 3 : "auto",
                  justifyContent: "center",
                  color: "inherit",
                }}
              >
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={label}
                sx={{ opacity: effectiveOpen ? 1 : 0 }}
              />
            </ListItemButton>
          );

          return (
            <ListItem key={label} disablePadding sx={{ display: "block" }}>
              {effectiveOpen ? (
                listItem
              ) : (
                <Tooltip title={label} placement="right">
                  {listItem}
                </Tooltip>
              )}
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
