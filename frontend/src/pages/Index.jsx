import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Container, Box, Typography, Grid, Paper } from '@mui/material';
import { Shield, Description, People, CheckCircle } from '@mui/icons-material';
import { Navbar } from '../components/Navbar';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
            Complaint Management System
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            A streamlined platform for citizens to report issues and track their resolution,
            while enabling officers and administrators to efficiently manage and resolve complaints.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" size="large" onClick={() => navigate('/register')}>
              Get Started
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4} sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  mb: 2,
                }}
              >
                <Description sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Submit Complaints
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Citizens can easily submit and track complaints about water, electricity, roads, and more.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  mb: 2,
                }}
              >
                <People sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Officer Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Officers can view assigned complaints and update status with detailed remarks.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  mb: 2,
                }}
              >
                <CheckCircle sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Admin Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administrators get complete oversight with filtering, assignment, and management tools.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Index;

