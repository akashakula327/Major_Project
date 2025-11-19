import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useComplaints } from '../contexts/ComplaintContext';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Box,
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
  MenuItem,
  Snackbar,
  Chip,
  Divider,
} from '@mui/material';
import {
  Description,
  LocationOn,
  CalendarToday,
  Summarize,
  PriorityHigh,
} from '@mui/icons-material';
import { StatusBadge } from '../components/StatusBadge';

const OfficerComplaints = () => {
  const { user } = useAuth();
  const { complaints, updateComplaintStatus } = useComplaints();
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('pending');
  const [remarks, setRemarks] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const priorityRank = { High: 1, Medium: 2, Low: 3 };

  const myComplaints = useMemo(() => {
    return complaints
      .filter(
        c =>
          c.officerId === user?.id ||
          c.assigned_officer_id === user?.id ||
          c.assigned_officer_id?.toString() === user?.id?.toString()
      )
      .sort((a, b) => {
        const priorityA = priorityRank[a.priority] || 4;
        const priorityB = priorityRank[b.priority] || 4;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
      });
  }, [complaints, user?.id]);

  const getPriorityColor = priority => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = value => {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString();
  };

  const handleOpenDialog = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus((complaint.status || 'pending').toLowerCase());
    setRemarks(complaint.statusRemarks || '');
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedComplaint(null);
    setRemarks('');
  };

  const handleUpdateStatus = () => {
    if (!selectedComplaint) return;

    updateComplaintStatus(selectedComplaint.id, newStatus, remarks);
    setSnackbar({ open: true, message: 'Complaint status updated successfully!', severity: 'success' });
    handleCloseDialog();
  };

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            My Assigned Complaints
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and update the status of complaints assigned to you
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {myComplaints.map(complaint => (
            <Card key={complaint.id}>
              <CardHeader
                title={complaint.title}
                subheader={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <LocationOn sx={{ fontSize: 16 }} />
                    {complaint.location || 'Location not provided'}
                  </Box>
                }
                action={
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <StatusBadge status={complaint.status} />
                    <Chip
                      size="small"
                      color={getPriorityColor(complaint.priority)}
                      icon={<PriorityHigh sx={{ fontSize: 14 }} />}
                      label={`${complaint.priority || 'Unspecified'} priority`}
                    />
                  </Box>
                }
              />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {complaint.description || 'No detailed description provided.'}
                </Typography>

                <Divider />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Citizen
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {complaint.citizenName || complaint.citizen_name || 'Not available'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {complaint.category || complaint.type || 'Not specified'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Submitted
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatDate(complaint.created_at || complaint.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(complaint.updated_at || complaint.updatedAt)}
                    </Typography>
                  </Box>
                </Box>

                {(complaint.summary || complaint.ai_summary) && (
                  <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, display: 'flex', gap: 1 }}>
                    <Summarize sx={{ fontSize: 20 }} color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        AI Summary
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {complaint.summary || complaint.ai_summary}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {complaint.statusRemarks && (
                  <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Status Remarks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {complaint.statusRemarks}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Description />}
                    onClick={() => handleOpenDialog(complaint)}
                  >
                    Update Status
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}

          {myComplaints.length === 0 && (
            <Card>
              <CardContent sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No complaints assigned to you yet
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Complaint Status</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              select
              label="Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              fullWidth
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
            <TextField
              label="Remarks"
              placeholder="Add notes about the current status..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateStatus}>
            Update Status
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

export default OfficerComplaints;

