import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "../config/api";
import { ROLES } from "../constants/roles";
import { STATUS, BACKEND_STATUS_MAP } from "../constants/statuses";

const ComplaintContext = createContext(undefined);

const normalizeStatus = (status) => {
  if (!status) return 'pending';
  return status.toString().toLowerCase().replace(/_/g, '-');
};

// Initial mock data for fallback/demo purposes
const initialComplaints = [
  {
    id: '1',
    title: 'Water Supply Issue',
    description: 'No water supply in the area for the past 2 days',
    type: 'water',
    category: 'water',
    location: 'Main Street, Block A',
    status: 'in-progress',
    user_id: '3',
    citizenId: '3',
    citizenName: 'John Doe',
    assigned_officer_id: '2',
    officerId: '2',
    officerName: 'Officer Smith',
    statusRemarks: 'Team dispatched to check the main pipeline',
    created_at: new Date('2025-01-08').toISOString(),
    updatedAt: new Date('2025-01-09').toISOString(),
  },
  {
    id: '2',
    title: 'Street Light Not Working',
    description: 'Multiple street lights on Oak Avenue are not functioning',
    type: 'electricity',
    category: 'electricity',
    location: 'Oak Avenue, Block B',
    status: 'pending',
    user_id: '3',
    citizenId: '3',
    citizenName: 'John Doe',
    created_at: new Date('2025-01-10').toISOString(),
    updatedAt: new Date('2025-01-10').toISOString(),
  },
];

const initialOfficers = [
  { id: '2', name: 'Officer Smith', email: 'officer@cms.gov', assignedComplaints: 1 },
  { id: '4', name: 'Officer Johnson', email: 'johnson@cms.gov', assignedComplaints: 0 },
];

export const ComplaintProvider = ({ children }) => {
  // Initialize complaints from localStorage or use empty array (API will populate)
  const [complaints, setComplaints] = useState(() => {
    const stored = localStorage.getItem('cms_complaints');
    if (stored) {
      try {
        return JSON.parse(stored).map(c => ({
          ...c,
          created_at: c.created_at || c.createdAt,
          updatedAt: c.updatedAt || c.updated_at,
        }));
      } catch (e) {
        console.error('Error parsing stored complaints:', e);
        return [];
      }
    }
    return [];
  });

  // Initialize officers from localStorage or use initial mock data
  const [officers, setOfficers] = useState(() => {
    const stored = localStorage.getItem('cms_officers');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored officers:', e);
        return initialOfficers;
      }
    }
    return initialOfficers;
  });

  const [loading, setLoading] = useState(true);

  // Helper function to get token dynamically
  const getToken = () => {
    return localStorage.getItem("cms_token");
  };

  // Helper function to get user from localStorage
  const getUser = () => {
    const userStr = localStorage.getItem("cms_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error("Error parsing user:", e);
        return null;
      }
    }
    return null;
  };

  // ✅ Fetch user's complaints based on role
  const fetchComplaints = useCallback(async () => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      setLoading(false);
      return;
    }

    // Determine the correct endpoint based on user role
    let endpoint = "";
    if (user.role === ROLES.ADMIN) {
      endpoint = API_ENDPOINTS.ADMIN.COMPLAINTS;
    } else if (user.role === ROLES.OFFICER) {
      endpoint = API_ENDPOINTS.OFFICER.COMPLAINTS;
    } else if (user.role === ROLES.CITIZEN) {
      endpoint = API_ENDPOINTS.COMPLAINTS.MY;
    }

    if (!endpoint) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      
      let fetchedComplaints = Array.isArray(data) ? data : data.complaints || data.data || [];

      const normalizedComplaints = fetchedComplaints.map(c => ({
        ...c,
        status: normalizeStatus(c.status),
        location: c.location ?? c.location_description ?? 'Location not provided',
      }));

      setComplaints(normalizedComplaints);
      localStorage.setItem('cms_complaints', JSON.stringify(fetchedComplaints));
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Fetch officers from database
  const fetchOfficers = useCallback(async () => {
    const token = getToken();
    const user = getUser();
    if (!token || !user || user.role !== ROLES.ADMIN) return;

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.OFFICERS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch officers");
      const data = await res.json();
      setOfficers(Array.isArray(data) ? data : []);
      localStorage.setItem('cms_officers', JSON.stringify(data));
    } catch (err) {
      console.error("Error fetching officers:", err);
    }
  }, []);

  // Initial fetch on mount if user is logged in
  useEffect(() => {
    const token = getToken();
    const user = getUser();
    
    if (token && user) {
      fetchComplaints();
      if (user.role === ROLES.ADMIN) {
        fetchOfficers();
      }
    } else {
      setComplaints([]);
      setLoading(false);
    }
  }, [fetchComplaints, fetchOfficers]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cms_token' || e.key === 'cms_user') {
        const token = getToken();
        const user = getUser();
        if (token && user) {
          fetchComplaints();
          if (user.role === ROLES.ADMIN) fetchOfficers();
        } else {
          setComplaints([]);
          setLoading(false);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchComplaints, fetchOfficers]);

  // ✅ Add complaint (works locally immediately, then syncs with API)
  const addComplaint = async (complaintData) => {
    const user = getUser();
    const complaintText = complaintData.complaint || complaintData.description || complaintData.title || '';
    const normalizedCategory = complaintData.category || complaintData.type || 'General';

    const title = complaintText.length > 60 ? `${complaintText.slice(0, 57)}...` : complaintText;

    const newComplaint = {
      ...complaintData,
      title,
      description: complaintText,
      id: Date.now().toString(),
      status: normalizeStatus(complaintData.status),
      user_id: user?.id,
      citizenId: user?.id,
      citizenName: user?.name,
      category: normalizedCategory,
      location: complaintData.location || 'Location not provided',
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to local state immediately for instant UI update
    setComplaints(prev => [newComplaint, ...prev]);

    const token = getToken();
    if (!token) {
      return { success: true, data: newComplaint, message: "Saved locally (not logged in)" };
    }

    // Try to sync with API in background
    try {
      const res = await fetch(API_ENDPOINTS.COMPLAINTS.SUBMIT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ complaint: complaintText, location: complaintData.location }),
      });

      const data = await res.json();

      if (res.ok) {
        // Merge backend response with local data so we don't lose fields like location
        const mergedComplaint = {
          ...newComplaint,
          ...data,
          id: data.id || newComplaint.id,
          status: normalizeStatus(data.status || newComplaint.status),
          location: data.location || newComplaint.location,
        };

        setComplaints(prev => prev.map(c => 
          c.id === newComplaint.id ? mergedComplaint : c
        ));
        return { success: true, data };
      }

      // API failed but already saved locally
      return { success: true, data: newComplaint, message: "Saved locally (API error: " + (data.message || "Unknown") + ")" };
    } catch (err) {
      // API failed but already saved locally
      return { success: true, data: newComplaint, message: "Saved locally (Network error)" };
    }
  };

  const updateComplaintStatus = async (id, status, remarks) => {
    const user = getUser();
    if (!user) {
      console.error("No user found. Please login again.");
      return;
    }

    const normalizedStatus = normalizeStatus(status);

    setComplaints(prev => prev.map(c => 
      c.id === id || c.id?.toString() === id?.toString()
        ? { ...c, status: normalizedStatus, statusRemarks: remarks, updatedAt: new Date().toISOString() }
        : c
    ));

    const token = getToken();
    if (!token) {
      console.warn("No token - updated locally only");
      return;
    }

    // Try to sync with API in background
    try {
      if (![ROLES.ADMIN, ROLES.OFFICER].includes(user.role)) {
        console.warn("Current user role cannot update status");
        return;
      }

      let endpoint = '';
      let method = 'PUT';
      let body = {};

      if (user.role === ROLES.OFFICER) {
        endpoint = API_ENDPOINTS.OFFICER.UPDATE_STATUS;
        method = 'POST';
        body = JSON.stringify({
          complaintId: id,
          status: BACKEND_STATUS_MAP[normalizedStatus] || normalizedStatus.toUpperCase(),
          remarks,
        });
      } else {
        // Admin endpoint - only status, no remarks
        endpoint = API_ENDPOINTS.ADMIN.COMPLAINT_STATUS(id);
        body = JSON.stringify({
          status: BACKEND_STATUS_MAP[normalizedStatus] || normalizedStatus.toUpperCase(),
        });
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (res.ok) {
        fetchComplaints();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Status update error:", errorData.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const deleteComplaint = async (id) => {
    // Delete locally immediately for instant UI update
    setComplaints(prev => prev.filter(c => c.id !== id && c.id?.toString() !== id?.toString()));

    const token = getToken();
    if (!token) {
      console.warn("No token - deleted locally only");
      return;
    }

    // Try to sync with API in background
    try {
      // Delete is only available for admin via /admin/complaints/:id
      const res = await fetch(API_ENDPOINTS.ADMIN.COMPLAINT_DELETE(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Refresh from API to get latest state
        fetchComplaints();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Delete error:", errorData.message || "Failed to delete complaint");
        // Already deleted locally, so user sees the change
      }
    } catch (err) {
      console.error("Delete error:", err);
      // Already deleted locally, so user sees the change
    }
  };

  const assignOfficer = async (complaintId, officerId) => {
    const officer = officers.find(o => o.id === officerId || o.id?.toString() === officerId?.toString());
    if (!officer) {
      console.error("Officer not found");
      return;
    }

    // Update locally immediately for instant UI update
    setComplaints(prev => prev.map(c => 
      c.id === complaintId || c.id?.toString() === complaintId?.toString()
        ? { ...c, assigned_officer_id: officerId, officerId, officerName: officer.name, updatedAt: new Date().toISOString() }
        : c
    ));
    setOfficers(prev => prev.map(o => 
      o.id === officerId ? { ...o, assignedComplaints: (o.assignedComplaints || 0) + 1 } : o
    ));

    const token = getToken();
    if (!token) {
      console.warn("No token - assigned locally only");
      return;
    }

    // Try to sync with API in background
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.ASSIGN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ complaintId, officerId }),
      });

      if (res.ok) {
        // Refresh from API to get latest state
        fetchComplaints();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Assign officer error:", errorData.message || "Failed to assign officer");
        // Already updated locally, so user sees the change
      }
    } catch (err) {
      console.error("Assign officer error:", err);
      // Already updated locally, so user sees the change
    }
  };

  // Officer management functions (for admin)
  const addOfficer = (officer) => {
    const newOfficer = {
      ...officer,
      id: officer.id || Date.now().toString(),
      assignedComplaints: 0,
    };
    setOfficers(prev => {
      const updated = [...prev, newOfficer];
      localStorage.setItem('cms_officers', JSON.stringify(updated));
      return updated;
    });
  };

  const removeOfficer = (id) => {
    setOfficers(prev => {
      const updated = prev.filter(o => o.id !== id);
      localStorage.setItem('cms_officers', JSON.stringify(updated));
      return updated;
    });
    setComplaints(prev => prev.map(c => 
      c.assigned_officer_id === id || c.officerId === id
        ? { ...c, assigned_officer_id: undefined, officerId: undefined, officerName: undefined, updatedAt: new Date().toISOString() }
        : c
    ));
  };

  // Persist complaints to localStorage whenever they change
  useEffect(() => {
    if (complaints.length > 0) {
      localStorage.setItem('cms_complaints', JSON.stringify(complaints));
    }
  }, [complaints]);

  // Persist officers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cms_officers', JSON.stringify(officers));
  }, [officers]);

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        officers,
        loading,
        addComplaint,
        updateComplaintStatus,
        deleteComplaint,
        assignOfficer,
        addOfficer,
        removeOfficer,
        fetchComplaints,
        fetchOfficers,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (!context)
    throw new Error("useComplaints must be used within a ComplaintProvider");
  return context;
};

