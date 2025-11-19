import { useEffect, useMemo, useState } from 'react';
import { useComplaints } from '../contexts/ComplaintContext';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { ROLES } from '../constants/roles';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  DialogContentText,
  Snackbar,
} from '@mui/material';
import { PersonAdd, Delete, Email, Description } from '@mui/icons-material';

const ManageOfficers = () => {
  const { user } = useAuth();
  const { officers, addOfficer, removeOfficer } = useComplaints();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, officerId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [serverOfficers, setServerOfficers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOfficers = async () => {
      const token = localStorage.getItem('cms_token');
      if (!token || user?.role !== ROLES.ADMIN) {
        setServerOfficers([]);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(API_ENDPOINTS.ADMIN.OFFICERS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('Failed to fetch officers:', err.message || res.statusText);
          setServerOfficers([]);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setServerOfficers(data);
        } else if (Array.isArray(data.officers)) {
          setServerOfficers(data.officers);
        } else {
          setServerOfficers([]);
        }
      } catch (error) {
        console.error('Error fetching officers:', error);
        setServerOfficers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, [user]);

  const officersToRender = useMemo(() => {
    if (serverOfficers.length > 0) {
      return serverOfficers;
    }
    return officers;
  }, [serverOfficers, officers]);

  const handleAddOfficer = async () => {
    if (!name || !email || !password) {
      setSnackbar({ open: true, message: 'Please fill in all fields', severity: 'error' });
      return;
    }

    if (password.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters', severity: 'error' });
      return;
    }

    const token = localStorage.getItem('cms_token');
    if (!token) {
      setSnackbar({ open: true, message: 'Not authenticated', severity: 'error' });
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.OFFICER_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSnackbar({ open: true, message: data.message || 'Failed to create officer', severity: 'error' });
        return;
      }

      setSnackbar({ open: true, message: 'Officer created successfully', severity: 'success' });
      setIsAddDialogOpen(false);
      setName('');
      setEmail('');
      setPassword('');

      // Refetch officers to update the list
        const fetchRes = await fetch(API_ENDPOINTS.ADMIN.OFFICERS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (fetchRes.ok) {
        const fetchData = await fetchRes.json();
        if (Array.isArray(fetchData)) {
          setServerOfficers(fetchData);
        }
      }
    } catch (error) {
      console.error('Error creating officer:', error);
      setSnackbar({ open: true, message: 'Failed to create officer', severity: 'error' });
    }
  };

  const handleRemoveOfficer = async (id) => {
    const token = localStorage.getItem('cms_token');
    if (!token) {
      setSnackbar({ open: true, message: 'Not authenticated', severity: 'error' });
      setDeleteDialog({ open: false, officerId: null });
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.OFFICER_DELETE(id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setSnackbar({ open: true, message: data.message || 'Failed to delete officer', severity: 'error' });
        setDeleteDialog({ open: false, officerId: null });
        return;
      }

      setSnackbar({ open: true, message: 'Officer deleted successfully', severity: 'success' });
      setDeleteDialog({ open: false, officerId: null });

      // Refetch officers to update the list
        const fetchRes = await fetch(API_ENDPOINTS.ADMIN.OFFICERS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (fetchRes.ok) {
        const fetchData = await fetchRes.json();
        if (Array.isArray(fetchData)) {
          setServerOfficers(fetchData);
        }
      }
    } catch (error) {
      console.error('Error deleting officer:', error);
      setSnackbar({ open: true, message: 'Failed to delete officer', severity: 'error' });
      setDeleteDialog({ open: false, officerId: null });
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Manage Officers
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Add or remove officers from the system
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Officer
          </Button>
        </Box>

        <Grid container spacing={3}>
          {officersToRender.map(officer => (
            <Grid item xs={12} sm={6} md={4} key={officer.id}>
              <Card>
                <CardHeader
                  title={officer.name}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {officer.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {officer.assignedComplaints ?? officer.assignedComplaintsCount ?? 0} assigned complaints
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialog({ open: true, officerId: officer.id })}
                  >
                    Remove Officer
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {!loading && officersToRender.length === 0 && (
          <Card>
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No officers added yet
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Officer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="Full Name"
              placeholder="Enter officer's name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              placeholder="Enter officer's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              placeholder="Enter password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              helperText="Password must be at least 6 characters long"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsAddDialogOpen(false);
            setName('');
            setEmail('');
            setPassword('');
          }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddOfficer}>
            Add Officer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, officerId: null })}>
        <DialogTitle>Remove Officer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this officer? Any assigned complaints will become unassigned.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, officerId: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => handleRemoveOfficer(deleteDialog.officerId)}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </DashboardLayout>
  );
};

export default ManageOfficers;

