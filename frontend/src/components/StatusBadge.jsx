import { Chip } from '@mui/material';
import { AccessTime, HourglassEmpty, CheckCircle, Cancel } from '@mui/icons-material';

export const StatusBadge = ({ status }) => {
  const configs = {
    pending: {
      label: 'Pending',
      color: 'warning',
      icon: <AccessTime fontSize="small" />,
    },
    'in-progress': {
      label: 'In Progress',
      color: 'primary',
      icon: <HourglassEmpty fontSize="small" />,
    },
    resolved: {
      label: 'Resolved',
      color: 'success',
      icon: <CheckCircle fontSize="small" />,
    },
    rejected: {
      label: 'Rejected',
      color: 'error',
      icon: <Cancel fontSize="small" />,
    },
  };

  const normalizedStatus = (status || 'pending').toString().toLowerCase().replace(/_/g, '-');
  const config = configs[normalizedStatus] || configs.pending;

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      variant="outlined"
      size="small"
    />
  );
};

