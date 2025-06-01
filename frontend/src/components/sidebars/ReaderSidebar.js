import { NavLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HomeIcon from '@mui/icons-material/Home';
import BookIcon from '@mui/icons-material/Book';
import SchoolIcon from '@mui/icons-material/School';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import EventIcon from '@mui/icons-material/Event';
import ForumIcon from '@mui/icons-material/Forum';
import HeartIcon from '@mui/icons-material/Favorite';
import CartIcon from '@mui/icons-material/ShoppingCart';
import { useTheme } from '@mui/material/styles';

const drawerWidth = 200;

const colors = {
  backgroundLight: 'rgb(248,246,241)',
  backgroundMedium: 'rgb(225,234,229)',
  accentLight: 'rgb(167,215,184)',
  accentMedium: 'rgb(102,178,160)',
  textDark: 'rgb(78,121,107)',
  errorRed: '#d9534f',
};

const navItems = [
  { label: 'Home', to: '/app/reader', icon: <HomeIcon /> },
  { label: 'Browse Books', to: '/app/reader/books', icon: <BookIcon /> },
  { label: 'Student corner', icon: <SchoolIcon /> },
  { label: 'Inbox', icon: <InboxIcon /> },
  { label: 'Events', icon: <EventIcon /> },
  { label: 'Forums', icon: <ForumIcon /> },
  { label: 'Favorites', to: '/app/reader/favourites', icon: <HeartIcon /> },
  { label: 'Shopping Cart', icon: <CartIcon /> },
];

export default function ReaderSidebar({ open, onToggle }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const effectiveOpen = !isSmallScreen && open;
  const widthToUse = effectiveOpen ? drawerWidth : 60;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: widthToUse,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        '& .MuiDrawer-paper': {
          marginTop: '64px',
          height: `calc(100% - 64px)`,
          width: widthToUse,
          transition: 'width 0.3s',
          overflowX: 'hidden',
          bgcolor: colors.accentMedium,
          color: 'white',
          borderRight: 'none',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        {!isSmallScreen && (
          <IconButton onClick={onToggle} sx={{ color: 'white' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

      <List>
        {navItems.map(({ label, to, icon }) => (
          <ListItem key={label} disablePadding sx={{ display: 'block' }}>
            {to ? (
              <NavLink to={to} end style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <ListItemIconWrapper
                    icon={icon}
                    label={label}
                    isActive={isActive}
                    effectiveOpen={effectiveOpen}
                  />
                )}
              </NavLink>
            ) : (
              <Tooltip title={label} placement="right">
                <Box>
                  <ListItemIconWrapper
                    icon={icon}
                    label={label}
                    isActive={false}
                    effectiveOpen={effectiveOpen}
                  />
                </Box>
              </Tooltip>
            )}
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

function ListItemIconWrapper({ icon, label, isActive, effectiveOpen }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2.5,
        mx: 1,
        borderRadius: 2,
        minHeight: 48,
        justifyContent: effectiveOpen ? 'initial' : 'center',
        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.1)',
        },
        color: 'white',
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: effectiveOpen ? 3 : 'auto',
          justifyContent: 'center',
          color: 'inherit',
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        sx={{ opacity: effectiveOpen ? 1 : 0, color: 'inherit' }}
      />
    </Box>
  );
}
