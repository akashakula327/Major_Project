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
  Alert,
  Snackbar,
} from '@mui/material';
import { Shield, ArrowForward } from '@mui/icons-material';
import { Navbar } from '../components/Navbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      setSnackbar({ open: true, message: 'Login successful!', severity: 'success' });
      navigate('/dashboard');
    } else {
      setSnackbar({ open: true, message: result.error || 'Login failed', severity: 'error' });
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
            Complaint Management System
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to access your account
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your credentials to continue
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                endIcon={<ArrowForward />}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={() => navigate('/register')}
              >
                Create Citizen Account
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default Login;
