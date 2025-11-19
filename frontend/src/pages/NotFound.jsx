import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { Home } from '@mui/icons-material';
import { Navbar } from '../components/Navbar';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            textAlign: 'center',
          }}
        >
          <Typography variant="h1" fontWeight={700} gutterBottom>
            404
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Oops! Page not found
          </Typography>
          <Button
            component={Link}
            to="/"
            variant="contained"
            startIcon={<Home />}
            sx={{ mt: 3 }}
          >
            Return to Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFound;

