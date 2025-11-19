import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ComplaintProvider } from './contexts/ComplaintContext';
import {ProtectedRoute}  from './components/ProtectedRoute';
import theme from './theme';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import OfficerComplaints from './pages/OfficerComplaints';
import AdminComplaints from './pages/AdminComplaints';
import ManageOfficers from './pages/ManageOfficers';
import ManageCitizens from './pages/ManageCitizens';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ComplaintProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/submit-complaint"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <SubmitComplaint />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/my-complaints"
                element={
                  <ProtectedRoute allowedRoles={['officer']}>
                    <OfficerComplaints />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/all-complaints"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminComplaints />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/officers"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageOfficers />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/citizens"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageCitizens />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ComplaintProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

