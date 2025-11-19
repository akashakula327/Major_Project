import { useMemo, useState } from 'react';
import { useComplaints } from '../contexts/ComplaintContext';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import { Search, Filter, Delete, PersonAdd } from '@mui/icons-material';
import { StatusBadge } from '../components/StatusBadge';

const AdminComplaints = () => {
  const { complaints, officers, deleteComplaint, updateComplaintStatus, assignOfficer } = useComplaints();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, complaintId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [statusDrafts, setStatusDrafts] = useState({});

  const formatDateTime = (value) => {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString();
  };

  const filteredComplaints = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return complaints.filter(c => {
      const status = (c.status || '').toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const titleMatch = c.title?.toLowerCase().includes(query);
      const locationMatch = c.location?.toLowerCase().includes(query);
      const citizenMatch = (c.citizenName || c.citizen_name || '').toLowerCase().includes(query);
      const matchesSearch = titleMatch || locationMatch || citizenMatch;
      return matchesStatus && matchesSearch;
    });
  }, [complaints, statusFilter, searchQuery]);

  const handleDelete = (id) => {
    deleteComplaint(id);
    setSnackbar({ open: true, message: 'Complaint deleted successfully', severity: 'success' });
    setDeleteDialog({ open: false, complaintId: null });
  };

  const handleAssignOfficer = (complaintId, officerId) => {
    assignOfficer(complaintId, officerId);
    setSnackbar({ open: true, message: 'Officer assigned successfully', severity: 'success' });
  };

  const handleStatusChange = (complaintId, value) => {
    setStatusDrafts(prev => ({ ...prev, [complaintId]: value }));
  };

  const handleUpdateStatus = (complaintId) => {
    const newStatus = statusDrafts[complaintId];
    if (!newStatus) {
      setSnackbar({ open: true, message: 'Select a status before updating', severity: 'warning' });
      return;
    }

    updateComplaintStatus(complaintId, newStatus, '');
    setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
  };

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            All Complaints
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View, manage, and track all submitted complaints
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <TextField
                placeholder="Search by title, location, or citizen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: { md: 200 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Filter />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </TextField>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredComplaints.map(complaint => (
            <Card key={complaint.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {complaint.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {complaint.location}
                    </Typography>
                  </Box>
                  <StatusBadge status={complaint.status} />
                </Box>

                <Typography variant="body2" sx={{ mb: 3 }}>
                  {complaint.description}
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Citizen
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {complaint.citizenName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                      {complaint.type}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Officer
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {complaint.officerName || 'Unassigned'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(complaint.created_at || complaint.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    select
                    label="Status"
                    value={statusDrafts[complaint.id] ?? complaint.status}
                    onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                    sx={{ minWidth: 150 }}
                    size="small"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </TextField>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleUpdateStatus(complaint.id)}
                    disabled={
                      (statusDrafts[complaint.id] ?? complaint.status) === complaint.status
                    }
                  >
                    Update Status
                  </Button>

                  <TextField
                    select
                    label="Assign Officer"
                    value={complaint.officerId || ''}
                    onChange={(e) => handleAssignOfficer(complaint.id, e.target.value)}
                    sx={{ minWidth: 200 }}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonAdd fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  >
                    {officers.map(officer => (
                      <MenuItem key={officer.id} value={officer.id}>
                        {officer.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialog({ open: true, complaintId: complaint.id })}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}

          {filteredComplaints.length === 0 && (
            <Card>
              <CardContent sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No complaints found
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, complaintId: null })}>
        <DialogTitle>Delete Complaint</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this complaint? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, complaintId: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteDialog.complaintId)}>
            Delete
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

export default AdminComplaints;

