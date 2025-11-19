import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { API_ENDPOINTS } from '../config/api';
import { ROLES } from '../constants/roles';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
} from '@mui/material';
import { People, Description, Email, Delete } from '@mui/icons-material';

const ManageCitizens = () => {
  const { user } = useAuth();
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, citizenId: null, citizenName: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchCitizens = async () => {
      const token = localStorage.getItem('cms_token');
      if (!token || user?.role !== ROLES.ADMIN) {
        setCitizens([]);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(API_ENDPOINTS.ADMIN.CITIZENS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('Failed to fetch citizens:', err.message || res.statusText);
          setCitizens([]);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setCitizens(data);
        } else if (Array.isArray(data.citizens)) {
          setCitizens(data.citizens);
        } else {
          setCitizens([]);
        }
      } catch (error) {
        console.error('Error fetching citizens:', error);
        setCitizens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCitizens();
  }, [user]);

  const handleDeleteCitizen = async (id) => {
    const token = localStorage.getItem('cms_token');
    if (!token) {
      setSnackbar({ open: true, message: 'Not authenticated', severity: 'error' });
      setDeleteDialog({ open: false, citizenId: null, citizenName: '' });
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.CITIZEN_DELETE(id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setSnackbar({ open: true, message: data.message || 'Failed to delete citizen', severity: 'error' });
        setDeleteDialog({ open: false, citizenId: null, citizenName: '' });
        return;
      }

      setSnackbar({ open: true, message: 'Citizen deleted successfully', severity: 'success' });
      setDeleteDialog({ open: false, citizenId: null, citizenName: '' });

      // Refetch citizens to update the list
      const fetchRes = await fetch(API_ENDPOINTS.ADMIN.CITIZENS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (fetchRes.ok) {
        const fetchData = await fetchRes.json();
        if (Array.isArray(fetchData)) {
          setCitizens(fetchData);
        }
      }
    } catch (error) {
      console.error('Error deleting citizen:', error);
      setSnackbar({ open: true, message: 'Failed to delete citizen', severity: 'error' });
      setDeleteDialog({ open: false, citizenId: null, citizenName: '' });
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Manage Citizens
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View registered citizens and their complaint history
          </Typography>
        </Box>

        <Card>
          <CardHeader
            avatar={<People />}
            title={`Total Citizens: ${citizens.length}`}
          />
        </Card>

        <Grid container spacing={3}>
          {citizens.map(citizen => (
            <Grid item xs={12} sm={6} md={4} key={citizen.id}>
              <Card>
                <CardHeader title={citizen.name} />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {citizen.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Complaints submitted
                        </Typography>
                      </Box>
                      <Chip label={citizen.complaintCount} color="primary" size="small" />
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialog({ open: true, citizenId: citizen.id, citizenName: citizen.name })}
                  >
                    Remove Citizen
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {!loading && citizens.length === 0 && (
          <Card>
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No citizens registered yet
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, citizenId: null, citizenName: '' })}>
        <DialogTitle>Remove Citizen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{deleteDialog.citizenName}</strong>? 
            This will also delete all complaints submitted by this citizen. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, citizenId: null, citizenName: '' })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => handleDeleteCitizen(deleteDialog.citizenId)}>
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

export default ManageCitizens;

