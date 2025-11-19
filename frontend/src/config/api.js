// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  
  // Complaint endpoints
  COMPLAINTS: {
    MY: `${API_BASE_URL}/complaints/my`,
    SUBMIT: `${API_BASE_URL}/complaints/submit`,
    BY_ID: (id) => `${API_BASE_URL}/complaints/${id}`,
    STATUS: (id) => `${API_BASE_URL}/complaints/${id}/status`,
  },
  
  // Admin endpoints
  ADMIN: {
    COMPLAINTS: `${API_BASE_URL}/admin/complaints`,
    COMPLAINT_STATUS: (id) => `${API_BASE_URL}/admin/complaints/${id}/status`,
    COMPLAINT_DELETE: (id) => `${API_BASE_URL}/admin/complaints/${id}`,
    ASSIGN: `${API_BASE_URL}/admin/assign`,
    OFFICERS: `${API_BASE_URL}/admin/officers`,
    OFFICER_CREATE: `${API_BASE_URL}/admin/officers`,
    OFFICER_DELETE: (id) => `${API_BASE_URL}/admin/officers/${id}`,
    CITIZENS: `${API_BASE_URL}/admin/citizens`,
    CITIZEN_DELETE: (id) => `${API_BASE_URL}/admin/citizens/${id}`,
  },
  
  // Officer endpoints
  OFFICER: {
    COMPLAINTS: `${API_BASE_URL}/officer/complaints`,
    UPDATE_STATUS: `${API_BASE_URL}/officer/update-status`,
  },
};

export default API_BASE_URL;

