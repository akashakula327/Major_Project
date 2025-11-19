import { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext(undefined);

// Mock users for demonstration
const mockUsers = [
  
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Check for stored user and token on mount
    const storedUser = localStorage.getItem('cms_user');
    const storedToken = localStorage.getItem('cms_token');
    
    // Only restore user if both user and token exist
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        // Clear corrupted data
        localStorage.removeItem('cms_user');
        localStorage.removeItem('cms_token');
        setUser(null);
      }
    } else if (storedUser && !storedToken) {
      // If user exists but token doesn't, clear user (token expired/missing)
      localStorage.removeItem('cms_user');
      setUser(null);
    }
    
    // Mark loading as complete after checking localStorage
    setLoading(false);
  }, []);

const login = async (email, password) => {
  try {
    const res = await fetch(API_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    // Check if response is ok before trying to parse JSON
    if (!res.ok) {
      // Try to parse error message from response
      let errorMessage = "Invalid email or password";
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If response is not JSON, use status text
        errorMessage = res.statusText || `Server error (${res.status})`;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Parse JSON response
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      return {
        success: false,
        error: "Invalid response from server. Please try again.",
      };
    }

    // Expected response from backend:
    // { user: {...}, token: "JWT_TOKEN_HERE" }

    const loggedUser = data.user;
    const jwtToken = data.token;

    // Validate that we received both user and token
    if (!loggedUser || !jwtToken) {
      return {
        success: false,
        error: "Invalid response from server. Missing user or token.",
      };
    }

    // Save in state
    setUser(loggedUser);

    // Save in localStorage
    localStorage.setItem("cms_user", JSON.stringify(loggedUser));
    localStorage.setItem("cms_token", jwtToken);

    return { success: true };
  } catch (error) {
    // More specific error handling
    console.error("Login error:", error);
    
    // Check for "Failed to fetch" or network-related errors
    if (
      error.name === 'TypeError' && 
      (error.message.includes('fetch') || 
       error.message === 'Failed to fetch' ||
       error.message.includes('NetworkError') ||
       error.message.includes('Network request failed'))
    ) {
      return {
        success: false,
        error: "Cannot connect to server. Please make sure the backend server is running.",
      };
    }
    
    return {
      success: false,
      error: error.message || "Network error. Please check your connection and try again.",
    };
  }
};


  const logout = () => {
    setUser(null);
    localStorage.removeItem('cms_user');
    localStorage.removeItem('cms_token');
    // Loading state should remain false after logout
  };

const register = async (name, email, password) => {
  try {
    const res = await fetch(API_ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    // Check if response is ok before trying to parse JSON
    if (!res.ok) {
      // Try to parse error message from response
      let errorMessage = "Registration failed";
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If response is not JSON, use status text
        errorMessage = res.statusText || `Server error (${res.status})`;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Parse JSON response
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      return {
        success: false,
        error: "Invalid response from server. Please try again.",
      };
    }

    // Successful registration
    return {
      success: true,
      message: data.message || "Registration successful",
    };
  } catch (error) {
    // More specific error handling
    console.error("Registration error:", error);
    
    // Check for "Failed to fetch" or network-related errors
    if (
      error.name === 'TypeError' && 
      (error.message.includes('fetch') || 
       error.message === 'Failed to fetch' ||
       error.message.includes('NetworkError') ||
       error.message.includes('Network request failed'))
    ) {
      return {
        success: false,
        error: "Cannot connect to server. Please make sure the backend server is running.",
      };
    }
    
    return {
      success: false,
      error: error.message || "Network error. Please check your connection and try again.",
    };
  }
};



  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

