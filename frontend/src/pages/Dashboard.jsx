import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useComplaints } from '../contexts/ComplaintContext';
import { ROLES } from '../constants/roles';
import { STATUS } from '../constants/statuses';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import { Description, AccessTime, HourglassEmpty, CheckCircle, Cancel } from '@mui/icons-material';
import { StatusBadge } from '../components/StatusBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const { complaints, fetchComplaints } = useComplaints();
  console.log("USER:", user);
  console.log("COMPLAINTS:", complaints);

  // Refetch complaints when dashboard mounts and user is available
  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user, fetchComplaints]);


  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    return status.toString().toLowerCase().replace(/_/g, '-');
  };

  // 🔥 Filter complaints based on user role & backend fields
  const userComplaints =
    user?.role === ROLES.CITIZEN
      ? complaints.filter(c => c.user_id === user.id)
      : user?.role === ROLES.OFFICER
      ? complaints.filter(c => c.assigned_officer_id === user.id)
      : complaints; // admin sees all

  const recentComplaints =
    user?.role === ROLES.CITIZEN
      ? userComplaints
      : userComplaints.slice(0, 5);

  const stats = {
    total: userComplaints.length,
    pending: userComplaints.filter(c => normalizeStatus(c.status) === STATUS.PENDING).length,
    inProgress: userComplaints.filter(c => normalizeStatus(c.status) === STATUS.IN_PROGRESS).length,
    resolved: userComplaints.filter(c => normalizeStatus(c.status) === STATUS.RESOLVED).length,
    rejected: userComplaints.filter(c => normalizeStatus(c.status) === STATUS.REJECTED).length,
  };

  const StatCard = ({ title, value, icon }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          {icon}
        </Box>
        <Typography variant="h4" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* Welcome Header */}
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome back, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.role === 'admin' && 'Manage all complaints and users from your dashboard'}
            {user?.role === 'officer' && 'View and update your assigned complaints'}
            {user?.role === 'citizen' && 'Track the status of your submitted complaints'}
          </Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Total Complaints"
              value={stats.total}
              icon={<Description sx={{ color: 'text.secondary' }} />}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={<AccessTime sx={{ color: 'warning.main' }} />}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="In Progress"
              value={stats.inProgress}
              icon={<HourglassEmpty sx={{ color: 'primary.main' }} />}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Resolved"
              value={stats.resolved}
              icon={<CheckCircle sx={{ color: 'success.main' }} />}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={<Cancel sx={{ color: 'error.main' }} />}
            />
          </Grid>
        </Grid>

        {/* Recent Complaints */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Complaints
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {recentComplaints.map(complaint => (
                <Box
                  key={complaint.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    pb: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0, pb: 0 },
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {complaint.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {complaint.location || "Unknown Location"}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {complaint.created_at
                        ? new Date(complaint.created_at).toLocaleDateString()
                        : ""}
                    </Typography>
                  </Box>

                  <StatusBadge status={normalizeStatus(complaint.status)} />
                </Box>
              ))}

              {recentComplaints.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ py: 4 }}
                >
                  No complaints found
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;
