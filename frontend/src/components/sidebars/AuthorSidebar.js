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
import UploadIcon from '@mui/icons-material/Upload';
import { useTheme } from '@mui/material/styles';
import MyBooksIcon from '@mui/icons-material/MenuBook';
import AnalyticsIcon from '@mui/icons-material/Analytics';



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
    { label: 'Home', to: '/app/author', icon: <HomeIcon /> },
    { label: 'Browse Books', to: '/app/author/books', icon: <BookIcon /> },
    { label: 'Student corner', icon: <SchoolIcon /> },
    { label: 'Inbox', icon: <InboxIcon /> },
    { label: 'Events', icon: <EventIcon /> },
    { label: 'Forums', icon: <ForumIcon /> },
    { label: 'Favorites', icon: <HeartIcon /> },
    { label: 'Shopping Cart', icon: <CartIcon /> },
    { label: 'Upload Book', icon: <UploadIcon /> },
    { label: 'My Books', icon: <MyBooksIcon /> },
    { label: 'Analytics', icon: <AnalyticsIcon /> },
];

export default function AuthorSidebar({ open, onToggle }) {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    const effectiveOpen = isSmallScreen ? false : open;
    const drawerWidthToUse = effectiveOpen ? drawerWidth : 60;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidthToUse,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                '& .MuiDrawer-paper': {
                    marginTop: '64px',
                    height: `calc(100% - 64px)`,
                    width: drawerWidthToUse,
                    transition: 'width 0.3s',
                    overflowX: 'hidden',
                    bgcolor: colors.backgroundLight,
                    color: colors.textDark,
                    borderRight: `1px solid ${colors.backgroundMedium}`,
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                {!isSmallScreen && (
                    <IconButton onClick={onToggle} sx={{ color: colors.textDark }}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
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
                                justifyContent: effectiveOpen ? 'initial' : 'center',
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
                                mr: effectiveOpen ? 3 : 'auto',
                                justifyContent: 'center',
                                color: 'inherit',
                            }}>
                                {icon}
                            </ListItemIcon>
                            <ListItemText primary={label} sx={{ opacity: effectiveOpen ? 1 : 0 }} />
                        </ListItemButton>
                    );

                    return (
                        <ListItem key={label} disablePadding sx={{ display: 'block' }}>
                            {effectiveOpen ? listItem : (
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
