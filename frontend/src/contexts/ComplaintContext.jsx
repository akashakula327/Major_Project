import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "../config/api";
import { ROLES } from "../constants/roles";
import { STATUS, BACKEND_STATUS_MAP } from "../constants/statuses";

const ComplaintContext = createContext(undefined);

const normalizeStatus = (status) => {
  if (!status) return 'pending';
  return status.toString().toLowerCase().replace(/_/g, '-');
};

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("cms_token");
  const getUser = () => {
    const userStr = localStorage.getItem("cms_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const fetchComplaints = useCallback(async () => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      setLoading(false);
      return;
    }

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
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
    } catch (err) {
      console.error("Error fetching officers:", err);
    }
  }, []);

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
      setOfficers([]);
      setLoading(false);
    }
  }, [fetchComplaints, fetchOfficers]);

  const addComplaint = async (complaintData) => {
    const user = getUser();
    const complaintText = complaintData.complaint || complaintData.description || complaintData.title || '';
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
      category: complaintData.category || complaintData.type || 'General',
      location: complaintData.location || 'Location not provided',
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComplaints(prev => [newComplaint, ...prev]);

    const token = getToken();
    if (!token) {
      return { success: true, data: newComplaint, message: "Saved locally (not logged in)" };
    }

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

      return { success: true, data: newComplaint, message: "Saved locally (API error: " + (data.message || "Unknown") + ")" };
    } catch (err) {
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

    const token = getToken();
    if (!token) {
      return;
    }

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
      endpoint = API_ENDPOINTS.ADMIN.COMPLAINT_STATUS(id);
      body = JSON.stringify({
        status: BACKEND_STATUS_MAP[normalizedStatus] || normalizedStatus.toUpperCase(),
      });
    }

    try {
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
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.COMPLAINT_DELETE(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchComplaints();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const assignOfficer = async (complaintId, officerId) => {
    const token = getToken();
    if (!token) return;

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
        fetchComplaints();
      }
    } catch (err) {
      console.error("Assign officer error:", err);
    }
  };

  const addOfficer = (officer) => {
    const newOfficer = {
      ...officer,
      id: officer.id || Date.now().toString(),
      assignedComplaints: 0,
    };
    setOfficers(prev => [...prev, newOfficer]);
  };

  const removeOfficer = (id) => {
    setOfficers(prev => prev.filter(o => o.id !== id));
    setComplaints(prev => prev.map(c =>
      c.assigned_officer_id === id || c.officerId === id
        ? { ...c, assigned_officer_id: undefined, officerId: undefined, officerName: undefined, updatedAt: new Date().toISOString() }
        : c
    ));
  };

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
