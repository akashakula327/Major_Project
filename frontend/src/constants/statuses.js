// Complaint Status Constants
export const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

export const STATUS_LABELS = {
  [STATUS.PENDING]: 'Pending',
  [STATUS.IN_PROGRESS]: 'In Progress',
  [STATUS.RESOLVED]: 'Resolved',
  [STATUS.REJECTED]: 'Rejected',
};

// Backend status mapping (for API calls)
export const BACKEND_STATUS_MAP = {
  [STATUS.PENDING]: 'PENDING',
  [STATUS.IN_PROGRESS]: 'IN_PROGRESS',
  [STATUS.RESOLVED]: 'RESOLVED',
  [STATUS.REJECTED]: 'REJECTED',
};

// Valid statuses array
export const VALID_STATUSES = [
  STATUS.PENDING,
  STATUS.IN_PROGRESS,
  STATUS.RESOLVED,
  STATUS.REJECTED,
];

