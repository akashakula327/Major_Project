import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { Shield, ArrowBack } from '@mui/icons-material';
import { Navbar } from '../components/Navbar';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const { register } = useAuth();
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate Gmail
  if (!email.endsWith('@gmail.com')) {
    setSnackbar({
      open: true,
      message: 'Only @gmail.com email addresses are allowed',
      severity: 'error'
    });
    return;
  }

  if (password !== confirmPassword) {
    setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' });
    return;
  }

  if (password.length < 6) {
    setSnackbar({ open: true, message: 'Password must be at least 6 characters', severity: 'error' });
    return;
  }

  setLoading(true);

  const result = await register(name, email, password);

  if (result.success) {
    setSnackbar({
      open: true,
      message: result.message || 'Registration successful!',
      severity: 'success'
    });

    setTimeout(() => {
      navigate('/login');
    }, 1500);

  } else {
    setSnackbar({
      open: true,
      message: result.error || 'User already exists',
      severity: 'error'
    });
  }

  setLoading(false);
};


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              mb: 2,
            }}
          >
            <Shield sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Create Citizen Account
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Register to submit and track complaints
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Register
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fill in your details to get started
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
              />

              <Button 
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <Button
                type="button"
                variant="text"
                fullWidth
                startIcon={<ArrowBack />}
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Register;
