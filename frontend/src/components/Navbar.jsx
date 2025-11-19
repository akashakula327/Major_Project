import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Shield,
  Dashboard,
  Description,
  People,
  PersonAdd,
  Logout,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileAnchorEl, setMobileAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { label: 'Home', path: '/', icon: <Shield /> },
        { label: 'Login', path: '/login', icon: <AccountCircle /> },
      ];
    }

    if (user.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
        { label: 'All Complaints', path: '/all-complaints', icon: <Description /> },
        { label: 'Manage Officers', path: '/officers', icon: <People /> },
        { label: 'Manage Citizens', path: '/citizens', icon: <People /> },
      ];
    }

    if (user.role === 'officer') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
        { label: 'My Complaints', path: '/my-complaints', icon: <Description /> },
      ];
    }

    return [
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
      { label: 'Submit Complaint', path: '/submit-complaint', icon: <Description /> },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3 }}>
          <Shield sx={{ color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ color: 'text.primary', fontWeight: 700 }}>
            CMS
          </Typography>
        </Box>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexGrow: 1 }}>
          {navLinks.map((link) => (
            <Button
              key={link.path}
              startIcon={link.icon}
              onClick={() => navigate(link.path)}
              sx={{
                color: location.pathname === link.path ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === link.path ? 600 : 400,
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>

        {/* Mobile Menu Button */}
        <IconButton
          sx={{ display: { xs: 'flex', md: 'none' }, ml: 'auto' }}
          onClick={handleMobileMenuOpen}
        >
          <MenuIcon />
        </IconButton>

        {/* User Menu */}
        {user ? (
          <>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, ml: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {user.name}
              </Typography>
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {user.role}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ display: { xs: 'none', md: 'flex' }, ml: 2 }}
          >
            Login
          </Button>
        )}

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileAnchorEl}
          open={Boolean(mobileAnchorEl)}
          onClose={handleMobileMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {navLinks.map((link) => (
            <MenuItem
              key={link.path}
              onClick={() => {
                navigate(link.path);
                handleMobileMenuClose();
              }}
              selected={location.pathname === link.path}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {link.icon}
                {link.label}
              </Box>
            </MenuItem>
          ))}
          {user && (
            <>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} fontSize="small" />
                Logout
              </MenuItem>
            </>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

