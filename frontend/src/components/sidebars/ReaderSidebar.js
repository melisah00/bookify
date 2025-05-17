import { NavLink } from 'react-router-dom';
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
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HomeIcon from '@mui/icons-material/Home';
import BookIcon from '@mui/icons-material/Book';
import SchoolIcon from '@mui/icons-material/School';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import EventIcon from '@mui/icons-material/Event';
import ForumIcon from '@mui/icons-material/Forum';

const drawerWidth = 200;

const colors = {
  backgroundLight: "rgb(248,246,241)",
  backgroundMedium: "rgb(225,234,229)",
  accentLight: "rgb(167,215,184)",
  accentMedium: "rgb(102,178,160)",
  textDark: "rgb(78,121,107)",
  errorRed: "#d9534f"
};

const navItems = [
  { label: 'Home', to: '/app/reader', icon: <HomeIcon /> },
  { label: 'Browse Books', to: '/app/reader/books', icon: <BookIcon /> },
  { label: 'Student corner', icon: <SchoolIcon /> },
  { label: 'Inbox', icon: <InboxIcon /> },
  { label: 'Events', icon: <EventIcon /> },
  { label: 'Forums', icon: <ForumIcon /> },
];

export default function ReaderSidebar({ open, onToggle }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 60,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        '& .MuiDrawer-paper': {
          marginTop: '64px',
          height: `calc(100% - 64px)`,
          width: open ? drawerWidth : 60,
          transition: 'width 0.3s',
          overflowX: 'hidden',
          bgcolor: colors.backgroundLight,
          color: colors.textDark,
          borderRight: `1px solid ${colors.backgroundMedium}`,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <IconButton onClick={onToggle} sx={{ color: colors.textDark }}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: colors.backgroundMedium }} />

      <List>
        {navItems.map(({ label, to, icon }) => {
          const listItem = (
            <ListItemButton
              component={to ? NavLink : 'div'}
              to={to}
              end
              sx={({ isActive }) => ({
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                mx: 1,
                borderRadius: 2,
                color: isActive ? '#fff' : colors.textDark,
                backgroundColor: isActive ? colors.accentMedium : 'transparent',
                '&:hover': {
                  backgroundColor: colors.accentLight,
                  color: '#fff',
                },
              })}
            >
              <ListItemIcon sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
                color: 'inherit',
              }}>
                {icon}
              </ListItemIcon>
              <ListItemText primary={label} sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          );

          return (
            <ListItem key={label} disablePadding sx={{ display: 'block' }}>
              {open ? listItem : (
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
