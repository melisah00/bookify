import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreIcon from '@mui/icons-material/MoreVert';
import LogoutButton from './LogoutButton';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import palette from '../theme/palette';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

export default function Header() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);
  const [options, setOptions] = React.useState([]);
  const [inputValue, setInputValue] = React.useState('');
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const { user, loading } = useAuth();

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const getRolePath = (user) => {
    if (!user) return 'reader';
    if (user.roles.includes('admin')) return 'admin';
    if (user.roles.includes('author')) return 'author';
    return 'reader';
  };

  const role = !loading ? getRolePath(user) : 'reader';
  const profilePath = `/app/${role}/profile`;

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  React.useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (inputValue.trim().length > 0) {
        setLoadingUsers(true);
        console.log("Searching users with query:", inputValue);

        fetch(`http://localhost:8000/users/search-users?query=${inputValue}`, {
          credentials: 'include'
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log("API response:", data);
            setOptions(data);
          })
          .catch(error => {
            console.error("Search error:", error);
            setOptions([]);
          })
          .finally(() => {
            setLoadingUsers(false);
          });
      } else {
        console.log("Clearing search (input empty)");
        setOptions([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [inputValue]);

  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={menuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>
        <NavLink
          to={profilePath}
          style={({ isActive }) => ({
            textDecoration: 'none',
            color: isActive ? '#66b2a0' : 'inherit',
            fontWeight: isActive ? 'bold' : 'normal',
          })}
        >
          Profile
        </NavLink>
      </MenuItem>
      <MenuItem onClick={handleMenuClose}><LogoutButton /></MenuItem>
    </Menu>
  );

  const mobileMenuId = 'primary-search-account-menu-mobile';
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem>
        <IconButton size="large" color="inherit">
          <Badge badgeContent={4} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        <p>Messages</p>
      </MenuItem>
      <MenuItem>
        <IconButton size="large" color="inherit">
          <Badge badgeContent={17} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton size="large" color="inherit">
          <AccountCircle />
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'rgb(102,178,160)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(255, 255, 255, 0.3)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderLeft: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        <Toolbar>
          <Box
            component="img"
            src="/Book.png"
            alt="Bookify Logo"
            sx={{ width: 40, height: 40, mr: 1, filter: 'brightness(0) invert(1)' }}
          />

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              display: { xs: 'none', sm: 'block' },
              fontWeight: 'bold',
              color: 'rgb(248,246,241)',
            }}
          >
            BOOKIFY
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              justifyContent: 'center',
              mx: 4,
            }}
          >
            <Autocomplete
              options={options}
              loading={loadingUsers}
              inputValue={inputValue}
              onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
              }}
              onChange={(event, selectedUser) => {
                if (selectedUser) {
                  setSelectedUser(selectedUser);
                  setModalOpen(true);
                  setInputValue('');
                  setOptions([]);
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.username
                  ? `${option.first_name && option.first_name !== 'N/A' ? option.first_name : ''} ${option.last_name && option.last_name !== 'N/A' ? option.last_name : ''} (@${option.username})`.trim()
                  : '';
              }}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  key={option.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 10px',
                    fontSize: 14,
                    bgcolor: 'white',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <strong>@{option.username}</strong>
                  <span style={{ marginLeft: 8 }}>
                    {option.first_name !== 'N/A' ? option.first_name : ''}{' '}
                    {option.last_name !== 'N/A' ? option.last_name : ''}
                  </span>
                </Box>
              )}
              noOptionsText="No users found"
              sx={{
                width: { xs: 200, sm: 300, md: 400 },
                bgcolor: '#f8f9fa',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                '& .MuiOutlinedInput-root': {
                  minHeight: 32,
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: palette.accentMedium,
                  },
                  '&.Mui-focused fieldset': {
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
                      bgcolor: '#f8f9fa',
                      borderRadius: '8px',
                      '& input': {
                        padding: '4px 6px',
                      },
                    },
                  }}
                />
              )}
            />
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <IconButton size="large" color="inherit">
              <Badge badgeContent={4} sx={{ '& .MuiBadge-badge': { backgroundColor: '#d9534f' } }}>
                <MailIcon />
              </Badge>
            </IconButton>
            <IconButton size="large" color="inherit">
              <Badge badgeContent={17} sx={{ '& .MuiBadge-badge': { backgroundColor: '#d9534f' } }}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Box>

          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="show more"
              aria-controls={mobileMenuId}
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
      {selectedUser && (
        <UserProfile
          open={modalOpen}
          handleClose={() => setModalOpen(false)}
          userId={selectedUser.id}
        />
      )}
    </Box>
  );
}
