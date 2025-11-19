import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Description,
  People,
  ManageAccounts,
  Shield,
  Logout,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 280;

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const citizenLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home /> },
    { to: '/submit-complaint', label: 'Submit Complaint', icon: <Description /> },
  ];

  const officerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home /> },
    { to: '/my-complaints', label: 'My Complaints', icon: <Description /> },
  ];

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home /> },
    { to: '/all-complaints', label: 'All Complaints', icon: <Description /> },
    { to: '/officers', label: 'Manage Officers', icon: <ManageAccounts /> },
    { to: '/citizens', label: 'Manage Citizens', icon: <People /> },
  ];

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'officer' ? officerLinks :
    citizenLinks;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700}>
            CMS
          </Typography>
        </Box>
      </Box>

      <List sx={{ flexGrow: 1, pt: 2 }}>
        {links.map((link) => (
          <ListItem key={link.to} disablePadding>
            <ListItemButton
              selected={location.pathname === link.to}
              onClick={() => navigate(link.to)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                {link.icon}
              </ListItemIcon>
              <ListItemText primary={link.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {user?.role}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<Logout />}
          onClick={logout}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            Complaint Management System
          </Typography>
        </Toolbar>
        {children}
      </Box>
    </Box>
  );
};

